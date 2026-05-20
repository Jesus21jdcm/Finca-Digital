import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  runTransaction,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import dotenv from 'dotenv';
import { getCropMetadata } from './constants/crops';

// Cargar variables de entorno del archivo .env
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Inicializar la app de Firebase Client SDK
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const serverApp = express();
serverApp.use(cors());
serverApp.use(express.json());

// Helper para sumar días a una fecha
function addDays(date: string | Date, days: number): Date {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Endpoint para registrar una Nueva Siembra
serverApp.post('/api/nueva-siembra', async (req, res) => {
  const { rubro, hectareas, lote, fechaSiembra } = req.body;

  if (!rubro || !hectareas || !lote || !fechaSiembra) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: rubro, hectareas, lote, fechaSiembra' });
  }

  const hectareasNum = Number(hectareas);
  if (isNaN(hectareasNum) || hectareasNum <= 0) {
    return res.status(400).json({ error: 'El campo hectareas debe ser un número positivo' });
  }

  try {
    // Obtener metadatos del rubro seleccionado
    const meta = getCropMetadata(rubro);
    if (!meta) {
      return res.status(400).json({ error: `Rubro no reconocido: ${rubro}` });
    }

    const semillasNecesarias = meta.densidad * hectareasNum;

    // Ejecutar transacción atómica en Firestore usando el Client SDK
    const result = await runTransaction(db, async (transaction) => {
      const inventarioRef = collection(db, 'inventario');
      const snapshot = await getDocs(inventarioRef);
      
      let seedDoc: any = null;
      
      // Busca el insumo que corresponda con el nombre de la semilla/rubro
      snapshot.forEach(docSnap => {
        const nombre = docSnap.data().nombre || '';
        if (nombre.toLowerCase().includes(rubro.toLowerCase())) {
          seedDoc = docSnap;
        }
      });

      if (!seedDoc) {
        throw new Error(`No se encontró el insumo de semilla en el inventario para el rubro: ${rubro}`);
      }

      const seedData = seedDoc.data();
      const currentQty = Number(seedData.cantidad) || 0;
      const unidad = seedData.unidad || 'Sacos';

      // Verificar si hay stock suficiente
      if (currentQty < semillasNecesarias) {
        throw new Error(
          `Stock insuficiente en el inventario. Se necesitan ${semillasNecesarias.toLocaleString()} ${unidad} de ${rubro} para ${hectareasNum} ha. Disponible: ${currentQty.toLocaleString()} ${unidad}`
        );
      }

      // Calcular fechas para las tareas calendarizadas
      const start = new Date(fechaSiembra + 'T12:00:00');
      const tareasProgramadas = meta.tareasDefault.map(t => ({
        nombre: t.nombre,
        dia: t.dia,
        fechaEjecucion: Timestamp.fromDate(addDays(start, t.dia)),
        completada: false
      }));

      const dFin = addDays(start, meta.duracion);

      const nuevaSiembra = {
        rubro,
        lote,
        hectareas: hectareasNum,
        fechaSiembra: Timestamp.fromDate(start),
        fechaFinalizacion: Timestamp.fromDate(dFin),
        duracionDias: meta.duracion,
        estado: 'activo',
        tareas: tareasProgramadas,
        createdAt: Timestamp.now()
      };

      // 1. Restar stock del inventario
      const seedDocRef = doc(db, 'inventario', seedDoc.id);
      transaction.update(seedDocRef, {
        cantidad: currentQty - semillasNecesarias,
        ultimaSalida: serverTimestamp()
      });

      // 2. Crear documento de la siembra en la colección 'crops'
      const newCropRef = doc(collection(db, 'crops'));
      transaction.set(newCropRef, nuevaSiembra);

      return {
        id: newCropRef.id,
        nuevaSiembra,
        semillasNecesarias,
        unidad
      };
    });

    // Formatear los timestamps para que coincidan con la estructura esperada por el cliente web
    return res.status(200).json({
      success: true,
      message: `✅ Siembra registrada con éxito. Se descontaron ${result.semillasNecesarias} ${result.unidad} de semillas del inventario.`,
      crop: {
        id: result.id,
        rubro: result.nuevaSiembra.rubro,
        lote: result.nuevaSiembra.lote,
        hectareas: result.nuevaSiembra.hectareas,
        fechaSiembra: {
          _seconds: Math.floor(result.nuevaSiembra.fechaSiembra.seconds),
          _nanoseconds: result.nuevaSiembra.fechaSiembra.nanoseconds,
        },
        fechaFinalizacion: {
          _seconds: Math.floor(result.nuevaSiembra.fechaFinalizacion.seconds),
          _nanoseconds: result.nuevaSiembra.fechaFinalizacion.nanoseconds,
        },
        duracionDias: result.nuevaSiembra.duracionDias,
        estado: result.nuevaSiembra.estado,
        createdAt: {
          _seconds: Math.floor(result.nuevaSiembra.createdAt.seconds),
          _nanoseconds: result.nuevaSiembra.createdAt.nanoseconds,
        },
        tareas: result.nuevaSiembra.tareas.map(t => ({
          ...t,
          fechaEjecucion: {
            _seconds: Math.floor(t.fechaEjecucion.seconds),
            _nanoseconds: t.fechaEjecucion.nanoseconds,
          }
        }))
      }
    });

  } catch (err: any) {
    console.error('[API Nueva Siembra Error]:', err);
    return res.status(400).json({ error: err.message || 'Error al procesar la siembra' });
  }
});

// Rutas mock para compatibilidad con la configuración de WhatsApp
serverApp.get('/api/whatsapp/status/:userId', (req, res) => {
  return res.json({ status: 'NOT_INITIALIZED', qr: null });
});
serverApp.post('/api/whatsapp/start', (req, res) => {
  return res.json({ success: true, message: 'Bot mock iniciado' });
});
serverApp.post('/api/whatsapp/logout', (req, res) => {
  return res.json({ success: true, message: 'Bot mock desvinculado' });
});
serverApp.post('/api/notificaciones/test', (req, res) => {
  return res.json({ success: true, message: 'Notificación de prueba mock enviada' });
});

// Exportar handler para Netlify Functions
export const handler = serverless(serverApp);

// Ejecución local como servidor Express clásico si corre de forma standalone
const isMain = process.env.STANDALONE === 'true' || (typeof require !== 'undefined' && require.main === module);
if (isMain) {
  const PORT = process.env.PORT || 4000;
  serverApp.listen(PORT, () => {
    console.log(`[Backend Server] Escuchando en el puerto ${PORT} (standalone con Client SDK)`);
  });
}
