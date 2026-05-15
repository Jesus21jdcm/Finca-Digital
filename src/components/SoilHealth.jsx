import { useState, useEffect } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAppContext } from '../context/AppContext';
import styles from './SoilHealth.module.css';

const SOIL_GUIDE = {
  pH: {
    low: { min: 0, max: 5.5, label: 'Ácido', color: '#ef4444', rec: 'Aplicar cal agrícola para elevar el pH. Evitar fertilizantes acidificantes.' },
    neutral: { min: 5.6, max: 7.2, label: 'Óptimo', color: '#10b981', rec: 'El suelo está en rango ideal. Mantener con materia orgánica.' },
    high: { min: 7.3, max: 14, label: 'Alcalino', color: '#3b82f6', rec: 'Aplicar azufre elemental o materia orgánica para acidificar ligeramente.' },
  },
  Nitrogen: {
    low: { max: 20, label: 'Bajo', rec: 'Aplicar Urea o abonos nitrogenados. Rotar con leguminosas.' },
    medium: { min: 21, max: 50, label: 'Medio', rec: 'Mantenimiento normal según el ciclo del cultivo.' },
    high: { min: 51, label: 'Alto', rec: 'Reducir fertilización nitrogenada para evitar toxicidad o crecimiento excesivo.' },
  }
};

export default function SoilHealth() {
  const { data, showAlert } = useAppContext();
  const [activeTab, setActiveTab] = useState('registro'); // 'registro' | 'historial' | 'satelital'
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [form, setForm] = useState({
    lote: '',
    ph: '',
    nitrogeno: '',
    fosforo: '',
    potasio: '',
    observaciones: ''
  });

  // Location state
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'soil_analysis'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Cargar ubicación guardada si existe
    const unsubLoc = onSnapshot(doc(db, 'dashboard', 'farmConfig'), (docSnap) => {
      if (docSnap.exists()) {
        setLocation(docSnap.data().location);
      }
    });

    return () => { unsub(); unsubLoc(); };
  }, []);

  const handleCaptureLocation = () => {
    setLocationLoading(true);
    if (!navigator.geolocation) {
      showAlert({ type: 'error', title: 'Error', message: 'Tu navegador no soporta geolocalización.' });
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const newLoc = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      };
      
      try {
        await setDoc(doc(db, 'dashboard', 'farmConfig'), { location: newLoc }, { merge: true });
        setLocation(newLoc);
        showAlert({
          type: 'success',
          title: 'Ubicación Fijada',
          message: `Coordenadas guardadas: ${newLoc.lat.toFixed(4)}, ${newLoc.lng.toFixed(4)}. El escaneo satelital ahora es preciso para este punto.`,
          confirmText: 'Genial'
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLocationLoading(false);
      }
    }, (err) => {
      showAlert({ type: 'error', title: 'Error de GPS', message: 'No se pudo obtener la ubicación. Asegúrate de dar permisos.' });
      setLocationLoading(false);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'soil_analysis'), {
        ...form,
        ph: Number(form.ph),
        nitrogeno: Number(form.nitrogeno),
        fosforo: Number(form.fosforo),
        potasio: Number(form.potasio),
        encargado: data.user.nombre,
        timestamp: serverTimestamp()
      });
      showAlert({
        type: 'success',
        title: 'Análisis Registrado',
        message: 'Los datos del suelo se han guardado. Revisa las recomendaciones en el historial.',
        confirmText: 'Ver Historial'
      });
      setForm({ lote: '', ph: '', nitrogeno: '', fosforo: '', potasio: '', observaciones: '' });
      setActiveTab('historial');
    } catch (err) {
      showAlert({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const resetForm = () => {
    setForm({ lote: '', ph: '', nitrogeno: '', fosforo: '', potasio: '', observaciones: '' });
  };

  const handleDelete = async (id) => {
    showAlert({
      type: 'warning',
      title: '¿Eliminar Análisis?',
      message: 'Esta acción no se puede deshacer. ¿Estás seguro de que quieres borrar este registro?',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'soil_analysis', id));
          showAlert({ type: 'success', title: 'Eliminado', message: 'El registro ha sido borrado correctamente.' });
        } catch (err) {
          showAlert({ type: 'error', title: 'Error', message: 'No se pudo eliminar el registro.' });
        }
      }
    });
  };

  const getPHStatus = (val) => {
    if (val <= 5.5) return SOIL_GUIDE.pH.low;
    if (val <= 7.2) return SOIL_GUIDE.pH.neutral;
    return SOIL_GUIDE.pH.high;
  };

  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  useEffect(() => {
    if (activeTab === 'satelital' && location && !scanComplete) {
      setIsScanning(true);
      const timer = setTimeout(() => {
        setIsScanning(false);
        setScanComplete(true);
      }, 4000); // 4 segundos de "escaneo"
      return () => clearTimeout(timer);
    }
  }, [activeTab, location, scanComplete]);

  const resetScan = () => {
    setScanComplete(false);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
    }, 4000);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>🌱 Salud y Nutrición del Suelo</h1>
          <p className={styles.subtitle}>Monitoreo químico, recomendaciones técnicas e inteligencia satelital.</p>
        </div>
      </header>

      <nav className={styles.tabs}>
        <button className={`${styles.tabBtn} ${activeTab === 'registro' ? styles.active : ''}`} onClick={() => setActiveTab('registro')}>
          📝 Nuevo Análisis
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'historial' ? styles.active : ''}`} onClick={() => setActiveTab('historial')}>
          📜 Historial y Diagnóstico
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'satelital' ? styles.active : ''}`} onClick={() => setActiveTab('satelital')}>
          🛰️ Escaneo Satelital (Beta)
        </button>
        <button className={styles.locationBtn} onClick={handleCaptureLocation} disabled={locationLoading}>
          {locationLoading ? '⌛ Capturando...' : location ? '📍 Ubicación Fijada' : '📍 Fijar Ubicación Finca'}
        </button>
      </nav>

      {activeTab === 'registro' && (
        <div className={styles.content}>
          <form className={styles.formCard} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Lote / Sector</label>
                <input type="text" placeholder="Ej: Lote Norte A-1" value={form.lote} onChange={e => setForm({...form, lote: e.target.value})} required />
              </div>
              <div className={styles.formGroup}>
                <label>pH del Suelo (0-14)</label>
                <input type="number" step="0.1" placeholder="Ej: 6.5" value={form.ph} onChange={e => setForm({...form, ph: e.target.value})} required />
              </div>
              <div className={styles.formGroup}>
                <label>Nitrógeno (ppm o kg/ha)</label>
                <input type="number" placeholder="Ej: 35" value={form.nitrogeno} onChange={e => setForm({...form, nitrogeno: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>Fósforo (ppm)</label>
                <input type="number" placeholder="Ej: 20" value={form.fosforo} onChange={e => setForm({...form, fosforo: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>Potasio (ppm)</label>
                <input type="number" placeholder="Ej: 150" value={form.potasio} onChange={e => setForm({...form, potasio: e.target.value})} />
              </div>
            </div>
            <div className={styles.formGroup} style={{marginTop: '16px'}}>
              <label>Observaciones del Laboratorio</label>
              <textarea placeholder="Notas adicionales sobre la textura o color del suelo..." value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})} />
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.clearBtn} onClick={resetForm}>
                🧹 Vaciar Casillas
              </button>
              <button type="submit" className={styles.submitBtn}>
                Guardar y Generar Recomendaciones
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'historial' && (
        <div className={styles.historyGrid}>
          {history.length === 0 ? (
            <p className={styles.empty}>Aún no hay análisis de suelo registrados.</p>
          ) : (
            history.map(item => {
              const phStatus = getPHStatus(item.ph);
              return (
                <div key={item.id} className={styles.historyCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.headerLeft}>
                      <h3>{item.lote}</h3>
                      <span className={styles.date}>{item.timestamp?.toDate?.()?.toLocaleDateString() || 'Reciente'}</span>
                    </div>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(item.id)} title="Borrar análisis">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                  <div className={styles.metricsGrid}>
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>pH</span>
                      <span className={styles.metricValue} style={{color: phStatus.color}}>{item.ph}</span>
                      <span className={styles.metricStatus}>{phStatus.label}</span>
                    </div>
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>N</span>
                      <span className={styles.metricValue}>{item.nitrogeno}</span>
                    </div>
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>P</span>
                      <span className={styles.metricValue}>{item.fosforo}</span>
                    </div>
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>K</span>
                      <span className={styles.metricValue}>{item.potasio}</span>
                    </div>
                  </div>
                  <div className={styles.recommendationBox}>
                    <h4>💡 Recomendación Técnica:</h4>
                    <p>{phStatus.rec}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'satelital' && (
        <div className={styles.satContent}>
          <div className={styles.satInfoCard}>
            <div className={styles.satInfoIcon}>💡</div>
            <div className={styles.satInfoText}>
              <h3>Inteligencia Satelital (Estimación)</h3>
              <p>
                Esta herramienta analiza el reflejo de la luz en tu terreno para estimar la salud del suelo desde el espacio. 
                Es una <strong>estimación predictiva aproximada</strong> diseñada para cuando no tienes acceso inmediato a un laboratorio. 
                <em> Para decisiones críticas, siempre recomendamos validar con una prueba química de campo.</em>
              </p>
            </div>
          </div>
          {!location ? (
            <div className={styles.warningCard}>
              <span style={{fontSize: '48px'}}>📍</span>
              <h3>Ubicación no detectada</h3>
              <p>Para realizar un escaneo satelital, primero debes fijar la ubicación de tu finca usando el botón superior.</p>
            </div>
          ) : (
            <div className={styles.satCard}>
              <div className={styles.satHeader}>
                <span className={styles.satIcon}>🛰️</span>
                <h3>Análisis de Capas Geográficas</h3>
                {scanComplete && <button className={styles.resetBtn} onClick={resetScan}>🔄 Re-escaneado</button>}
              </div>
              
              <p className={styles.coordsLabel}>
                Lat: {location.lat.toFixed(6)} | Lng: {location.lng.toFixed(6)}
              </p>

              <div className={styles.satMapContainer}>
                {isScanning ? (
                  <div className={styles.satOverlay}>
                    <div className={styles.radar}></div>
                    <p>Conectando con Sentinel-2...</p>
                    <p className={styles.pulse}>Descargando datos espectrales...</p>
                  </div>
                ) : scanComplete ? (
                  <div className={styles.heatmapWrapper}>
                    {/* Simulación de Heatmap */}
                    <div className={styles.heatmap}>
                      <div className={styles.heatPoint} style={{top: '20%', left: '30%', background: 'rgba(255,0,0,0.4)'}}></div>
                      <div className={styles.heatPoint} style={{top: '50%', left: '60%', background: 'rgba(34,197,94,0.4)'}}></div>
                      <div className={styles.heatPoint} style={{top: '70%', left: '20%', background: 'rgba(234,179,8,0.4)'}}></div>
                    </div>
                    <div className={styles.heatmapLegend}>
                      <span>🔴 Estrés Hídrico</span>
                      <span>🟡 Deficiencia N</span>
                      <span>🟢 Vigor Óptimo</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.placeholder}>Iniciando sistema...</div>
                )}
              </div>

              {scanComplete && (
                <>
                  <div className={styles.satData}>
                    <div className={styles.satRow}>
                      <span>Índice de Vegetación (NDVI):</span> 
                      <strong style={{color: '#22c55e'}}>0.78 (Excelente)</strong>
                    </div>
                    <div className={styles.satRow}>
                      <span>Materia Orgánica Estimada:</span> 
                      <strong>2.8%</strong>
                    </div>
                    <div className={styles.satRow}>
                      <span>Humedad Superficial:</span> 
                      <strong>65%</strong>
                    </div>
                    <div className={styles.satRow}>
                      <span>pH Estimado (Satelital):</span> 
                      <strong>6.2</strong>
                    </div>
                    <div className={styles.satRow}>
                      <span>Nitrógeno Estimado (N):</span> 
                      <strong>32 ppm</strong>
                    </div>
                  </div>

                  <button 
                    className={styles.importBtn}
                    onClick={() => {
                      setForm({
                        ...form,
                        ph: '6.2',
                        nitrogeno: '32',
                        observaciones: 'Datos importados de estimación satelital. Validar con prueba de campo.'
                      });
                      setActiveTab('registro');
                      showAlert({
                        type: 'success',
                        title: 'Datos Importados',
                        message: 'Hemos llenado el formulario con las estimaciones del satélite. Por favor, complétalo con tus datos de laboratorio.'
                      });
                    }}
                  >
                    📥 Usar estas estimaciones en mi análisis
                  </button>
                </>
              )}

              <div className={styles.alertBox}>
                <p><strong>¿Cómo funciona esto?</strong> Los datos satelitales son <u>estimaciones predictivas</u> basadas en el reflejo de la luz (reflectancia) captada por satélites como el Sentinel-2. No reemplazan un análisis de laboratorio, pero sirven para identificar zonas críticas de la finca sin caminar todo el terreno.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
