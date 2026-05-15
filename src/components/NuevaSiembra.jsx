import { useState } from 'react';
import { collection, addDoc, Timestamp, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAppContext } from '../context/AppContext';
import { CROP_CATALOG, getCropMetadata } from '../constants/crops';
import { addDays, formatDate } from '../utils/dateUtils';
import styles from './NuevaSiembra.module.css';

const RUBROS_DISPONIBLES = CROP_CATALOG.map(c => c.key);

export default function NuevaSiembra({ onSiembraCreada }) {
  const [form, setForm] = useState({
    rubro: RUBROS_DISPONIBLES[0],
    hectareas: '',
    lote: '',
    fechaSiembra: '',
  });
  const [estado, setEstado] = useState({ tipo: null, mensaje: '' });
  const { data, showAlert } = useAppContext();
  const inventario = data.inventoryItems || [];

  const hoy = new Date().toISOString().split('T')[0];

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEstado({ tipo: 'cargando', mensaje: 'Verificando inventario y registrando...' });

    try {
      const hectareasNum = Number(form.hectareas);
      const meta = getCropMetadata(form.rubro);
      const semillasNecesarias = meta.densidad * hectareasNum;
      
      const itemSemilla = inventario.find(i => 
        i.nombre.toLowerCase().includes(form.rubro.toLowerCase())
      );

      if (!itemSemilla || itemSemilla.cantidad < semillasNecesarias) {
        throw new Error(`Stock insuficiente. Necesitas ${semillasNecesarias.toLocaleString()} ${meta.unidad} de ${form.rubro} para ${hectareasNum} ha. Disponible: ${itemSemilla?.cantidad || 0} ${itemSemilla?.unidad || ''}`);
      }

      const start = new Date(form.fechaSiembra + 'T12:00:00'); 
      
      const tareasProgramadas = meta.tareasDefault.map(t => ({
        nombre: t.nombre,
        dia: t.dia,
        fechaEjecucion: Timestamp.fromDate(addDays(start, t.dia)),
        completada: false
      }));

      const dFin = addDays(start, meta.duracion);

      const nuevaSiembra = {
        rubro: form.rubro,
        lote: form.lote,
        hectareas: hectareasNum,
        fechaSiembra: Timestamp.fromDate(start),
        fechaFinalizacion: Timestamp.fromDate(dFin),
        duracionDias: meta.duracion,
        estado: 'activo',
        tareas: tareasProgramadas,
        createdAt: Timestamp.now()
      };

      const itemRef = doc(db, 'inventario', itemSemilla.id);
      await updateDoc(itemRef, {
        cantidad: itemSemilla.cantidad - semillasNecesarias,
        ultimaSalida: serverTimestamp()
      });

      const docRef = await addDoc(collection(db, 'crops'), nuevaSiembra);

      setEstado({
        tipo: 'exito',
        mensaje: `✅ Siembra registrada. Se descontaron ${semillasNecesarias} ${itemSemilla.unidad} de semillas.`,
      });

      showAlert({
        type: 'success',
        title: 'Ciclo Iniciado con Éxito',
        message: `Se han descontado ${semillasNecesarias} ${itemSemilla.unidad} de semillas del inventario. El ciclo de ${form.rubro} ha comenzado.`,
        confirmText: 'Entendido'
      });

      setForm({ rubro: RUBROS_DISPONIBLES[0], hectareas: '', lote: '', fechaSiembra: '' });
      if (onSiembraCreada) onSiembraCreada({ id: docRef.id, ...nuevaSiembra });
    } catch (err) {
      setEstado({ tipo: 'error', mensaje: `❌ ${err.message}` });
      showAlert({ type: 'error', title: 'Error en el Flujo', message: err.message, confirmText: 'Cerrar' });
    }
  }

  const selectedMeta = getCropMetadata(form.rubro);

  return (
    <section className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.iconWrap}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M12 22V12" /><path d="M12 12C12 7 7 4 3 5c0 5 4 8 9 7" /><path d="M12 12C12 7 17 4 21 5c0 5-4 8-9 7" /></svg>
          </div>
          <div>
            <h2 className={styles.title}>Nueva Siembra</h2>
            <p className={styles.subtitle}>Registra un ciclo de cultivo. Las tareas se calcularán automáticamente.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label htmlFor="ns-rubro" className={styles.label}><span className={styles.labelIcon}>🌱</span>Rubro</label>
              <div className={styles.selectWrapper}>
                <select id="ns-rubro" name="rubro" value={form.rubro} onChange={handleChange} className={styles.select} required>
                  {RUBROS_DISPONIBLES.map((r) => (<option key={r} value={r}>{r}</option>))}
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="ns-lote" className={styles.label}><span className={styles.labelIcon}>📍</span>Lote</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></span>
                <input id="ns-lote" name="lote" type="text" placeholder="Ej: Lote A-1" value={form.lote} onChange={handleChange} className={styles.input} required />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="ns-hectareas" className={styles.label}><span className={styles.labelIcon}>📏</span>Hectáreas</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg></span>
                <input id="ns-hectareas" name="hectareas" type="number" min="0.1" step="0.1" placeholder="Ej: 5.5" value={form.hectareas} onChange={handleChange} className={styles.input} required />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="ns-fecha" className={styles.label}><span className={styles.labelIcon}>📅</span>Fecha de Siembra</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></span>
                <input id="ns-fecha" name="fechaSiembra" type="date" max={hoy} value={form.fechaSiembra} onChange={handleChange} className={styles.input} required />
              </div>
            </div>
          </div>

          {form.hectareas && (
            <div className={styles.requirementInfo}>
              <p><strong>Requerimiento Estimado:</strong> {(selectedMeta.densidad * Number(form.hectareas)).toLocaleString()} {selectedMeta.unidad}</p>
              <small>{selectedMeta.descRequerimiento}</small>
              {(() => {
                const itemSemilla = inventario.find(i => i.nombre.toLowerCase().includes(form.rubro.toLowerCase()));
                if (itemSemilla) {
                  const maxHa = (itemSemilla.cantidad / selectedMeta.densidad).toFixed(2);
                  if (itemSemilla.cantidad < (selectedMeta.densidad * Number(form.hectareas))) {
                    return (
                      <div className={styles.stockAlert}>
                        ⚠️ Con tus <strong>{itemSemilla.cantidad} {itemSemilla.unidad}</strong> actuales, solo puedes sembrar <strong>{maxHa} ha</strong>.
                        <button type="button" className={styles.adjustBtn} onClick={() => setForm(prev => ({ ...prev, hectareas: maxHa }))}>Ajustar a {maxHa} ha</button>
                      </div>
                    );
                  }
                }
                return null;
              })()}
            </div>
          )}

          {form.fechaSiembra && (
            <div className={styles.preview}>
              <h3 className={styles.previewTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Tareas Automáticas para {form.rubro}
              </h3>
              <div className={styles.timeline}>
                {selectedMeta.tareasDefault.map((t, i) => (
                  <div className={styles.timelineItem} key={i}>
                    <div className={styles.timelineDot}></div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineDay}>Día {t.dia}</div>
                      <div className={styles.timelineDesc}>{t.nombre}</div>
                      <div className={styles.timelineDate}>{formatDate(addDays(form.fechaSiembra, t.dia))}</div>
                    </div>
                  </div>
                ))}
                <div className={`${styles.timelineItem} ${styles.final}`}>
                  <div className={styles.timelineDot}></div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineDay}>Día {selectedMeta.duracion}</div>
                    <div className={styles.timelineDesc}>Cosecha Estimada</div>
                    <div className={styles.timelineDate}>{formatDate(addDays(form.fechaSiembra, selectedMeta.duracion))}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={styles.btnWrapper}>
            <button type="submit" className={styles.btn} id="ns-submit-btn" disabled={estado.tipo === 'cargando'}>
              {estado.tipo === 'cargando' ? <span className={styles.spinner} /> : (
                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>Confirmar e Iniciar Ciclo</>
              )}
            </button>
          </div>
        </form>

        {estado.tipo && estado.tipo !== 'cargando' && (
          <div className={`${styles.feedback} ${styles[estado.tipo]}`}>
            <p>{estado.mensaje}</p>
          </div>
        )}
      </div>
    </section>
  );
}
