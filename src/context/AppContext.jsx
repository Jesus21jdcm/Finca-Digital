import { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import CustomAlert from '../components/CustomAlert';
import { CROP_CATALOG, normalizeCropKey } from '../server/constants/crops';
import { calculateCropProgress } from '../utils/dateUtils';

const AppContext = createContext();

const INITIAL_DATA = {
  user: {
    nombre: 'Admin',
    rol: 'Gerencia',
    email: 'admin@fincadigital.com',
    estado: 'Activo'
  },
  stats: {
    'cultivos-activos': { count: 0 },
    'inventario': { count: 0 },
    'reportes': { count: 0 },
  },
  cultivos: {},
  activeCrops: [],
  inventoryItems: [],
  weather: null,
};

export function AppProvider({ children, currentUser }) {
  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [alertConfig, setAlertConfig] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const showAlert = (config) => setAlertConfig(config);
  const hideAlert = () => setAlertConfig(null);

  // Sync real user info into data
  useEffect(() => {
    if (currentUser) {
      setData(prev => ({
        ...prev,
        user: {
          nombre: currentUser.displayName || prev.user.nombre,
          rol: currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'encargado' ? 'Encargado' : 'Empleado',
          email: currentUser.email,
          estado: 'Activo'
        }
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    // 1. Dashboard Main Data (Stats)
    const docRef = doc(db, 'dashboard', 'mainData');
    const unsubscribeMain = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const firestoreData = docSnap.data();
        setData(prev => ({
          ...prev,
          ...firestoreData,
          stats: {
            ...firestoreData.stats,
            'cultivos-activos': prev.stats['cultivos-activos'],
            'inventario': prev.stats['inventario']
          }
        }));
      } else {
        setDoc(docRef, INITIAL_DATA);
      }
    });

    // 2. Active Crops Subscription
    const qCrops = query(collection(db, 'crops'), where('estado', '==', 'activo'));
    const unsubscribeCrops = onSnapshot(qCrops, (snap) => {
      const activeCrops = [];
      const statsPorRubro = {};

      // Initialize stats with catalog defaults
      CROP_CATALOG.forEach(c => {
        statsPorRubro[normalizeCropKey(c.key)] = {
          campos: 0,
          hectareas: 0,
          count: 0,
          data: [2, 3, 2.5, 4, 3.5, 5, 4.5, 6] // Sparkline mock data
        };
      });

      snap.forEach(d => {
        const cropData = { id: d.id, ...d.data() };
        const { diasTranscurridos, progreso } = calculateCropProgress(cropData.fechaSiembra, cropData.duracionDias);

        const processedCrop = {
          ...cropData,
          _diasTranscurridos: diasTranscurridos,
          _progreso: progreso,
          _tareasPendientes: (Array.isArray(cropData.tareas) ? cropData.tareas : []).filter(t => !t.completada).length
        };

        activeCrops.push(processedCrop);

        const key = normalizeCropKey(processedCrop.rubro);
        if (statsPorRubro[key]) {
          statsPorRubro[key].campos += 1;
          statsPorRubro[key].count += 1;
          statsPorRubro[key].hectareas += Number(processedCrop.hectareas) || 0;
        }
      });

      setData(prev => ({
        ...prev,
        activeCrops,
        cultivos: statsPorRubro,
        stats: {
          ...prev.stats,
          'cultivos-activos': { count: snap.size }
        }
      }));
      setLoading(false);
    });

    // 3. Inventory Subscription
    const qInv = query(collection(db, 'inventario'), orderBy('nombre', 'asc'));
    const unsubscribeInv = onSnapshot(qInv, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setData(prev => ({
        ...prev,
        inventoryItems: items,
        stats: {
          ...prev.stats,
          inventario: { count: items.length }
        }
      }));
    });

    return () => {
      unsubscribeMain();
      unsubscribeCrops();
      unsubscribeInv();
    };
  }, []);

  // 4. Weather Sync
  useEffect(() => {
    const fetchWeather = async () => {
      const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY || 'c403306634455f5e8a6a68f051e94411'; 
      const lat = 8.6226;
      const lon = -70.2045;
      
      try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`);
        if (!response.ok) throw new Error('Weather API error');
        const weatherData = await response.json();
        
        setData(prev => ({
          ...prev,
          weather: {
            temp: Math.round(weatherData.main.temp),
            condition: weatherData.weather[0].description,
            icon: weatherData.weather[0].icon,
            humidity: weatherData.main.humidity,
            pop: weatherData.clouds.all, 
            city: weatherData.name
          }
        }));
      } catch (err) {
        console.error("Weather Fetch Error:", err);
        setData(prev => ({
          ...prev,
          weather: { temp: 29, condition: 'Parcialmente nublado', icon: '02d', humidity: 60, pop: 10, city: 'Barinas' }
        }));
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 1800000); 
    return () => clearInterval(interval);
  }, []);

  const addFertilizationLog = async (log) => {
    const newLogs = [...(data.fertilizations || []), { ...log, id: Date.now().toString(), date: new Date().toLocaleDateString() }];
    try {
      const docRef = doc(db, 'dashboard', 'mainData');
      await updateDoc(docRef, { fertilizations: newLogs });
    } catch (err) {
      console.error("Error saving fertilization:", err);
    }
  };

  const updateInventoryStat = async (amount) => {
    const currentInv = data.stats.inventario.count;
    try {
      const docRef = doc(db, 'dashboard', 'mainData');
      await updateDoc(docRef, { 'stats.inventario.count': currentInv + amount });
    } catch (err) {
      console.error("Error updating inventory stat:", err);
    }
  };

  return (
    <AppContext.Provider value={{
      data,
      loading,
      updateInventoryStat,
      addFertilizationLog,
      showAlert,
      hideAlert,
      theme,
      toggleTheme
    }}>
      {children}
      {alertConfig && (
        <CustomAlert
          {...alertConfig}
          onCancel={hideAlert}
          onConfirm={() => {
            if (alertConfig.onConfirm) alertConfig.onConfirm();
            else hideAlert();
          }}
        />
      )}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
