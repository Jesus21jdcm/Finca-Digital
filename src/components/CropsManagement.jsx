import { useState } from 'react';
import { doc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAppContext } from '../context/AppContext';
import NuevaSiembra from './NuevaSiembra';
import { CROP_CATALOG } from '../constants/crops';
import { safeToDate, formatDate } from '../utils/dateUtils';

import styles from './CropsManagement.module.css';

export default function CropsManagement() {
  const [tab, setTab] = useState('catalogo');
  const [editModal, setEditModal] = useState(null);
  const [taskModal, setTaskModal] = useState(null);
  const { data, loading, showAlert, hideAlert } = useAppContext();

  const siembras = data.activeCrops || [];

  const eliminarSiembra = async (id) => {
    showAlert({
      type: 'warning',
      title: '¿Eliminar siembra?',
      message: '¿Deseas eliminar esta siembra y todas sus tareas? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        hideAlert();
        try { 
          await deleteDoc(doc(db, 'crops', id)); 
          showAlert({
            type: 'success',
            title: 'Siembra Eliminada',
            message: 'El registro del cultivo ha sido removido.',
            confirmText: 'Ok'
          });
        } catch (err) { 
          showAlert({ type: 'error', title: 'Error', message: err.message });
        }
      }
    });
  };

  const toggleTarea = async (cropId, tareas, index) => {
    const nuevasTareas = [...(Array.isArray(tareas) ? tareas : [])];
    if (nuevasTareas[index]) {
      nuevasTareas[index].completada = !nuevasTareas[index].completada;
      try { await updateDoc(doc(db, 'crops', cropId), { tareas: nuevasTareas }); } catch (err) { alert(err.message); }
    }
  };

  const handleUpdateCrop = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'crops', editModal.id), {
        lote: editModal.lote,
        hectareas: Number(editModal.hectareas),
        duracionDias: Number(editModal.duracionDias)
      });
      setEditModal(null);
    } catch (err) { alert(err.message); }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    const crop = siembras.find(s => s.id === taskModal.cropId);
    if (!crop) return;
    let nuevasTareas = [...(Array.isArray(crop.tareas) ? crop.tareas : [])];

    const taskData = {
      nombre: taskModal.nombre,
      tipo: taskModal.tipo || 'general',
      fechaEjecucion: Timestamp.fromDate(new Date(taskModal.fecha + 'T12:00:00')),
      completada: taskModal.completada || false
    };

    if (taskModal.index !== null) {
      nuevasTareas[taskModal.index] = taskData;
    } else {
      nuevasTareas.push(taskData);
      nuevasTareas.sort((a, b) => safeToDate(a.fechaEjecucion).getTime() - safeToDate(b.fechaEjecucion).getTime());
    }

    try {
      await updateDoc(doc(db, 'crops', taskModal.cropId), { tareas: nuevasTareas });
      setTaskModal(null);
    } catch (err) { alert(err.message); }
  };

  const eliminarTarea = async (cropId, index) => {
    showAlert({
      type: 'warning',
      title: '¿Eliminar tarea?',
      message: '¿Estás seguro de que deseas eliminar esta tarea de la bitácora?',
      confirmText: 'Sí, eliminar',
      cancelText: 'No',
      onConfirm: async () => {
        hideAlert();
        const crop = siembras.find(s => s.id === cropId);
        if (!crop || !Array.isArray(crop.tareas)) return;
        const nuevasTareas = crop.tareas.filter((_, i) => i !== index);
        try { 
          await updateDoc(doc(db, 'crops', cropId), { tareas: nuevasTareas }); 
        } catch (err) { 
          showAlert({ type: 'error', title: 'Error', message: err.message });
        }
      }
    });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>🌿 Gestión de Cultivos</h1>
      </div>

      <div className={styles.tabs}>
        {['catalogo', 'activas', 'nueva'].map(t => (
          <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>
            {t === 'catalogo' ? '📚 Catálogo' : t === 'activas' ? '🌱 Activas' : '➕ Nueva'}
          </button>
        ))}
      </div>

      {loading && tab === 'activas' && (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Sincronizando con la finca...</p>
        </div>
      )}

      {tab === 'catalogo' && (
        <div className={styles.catalogGrid}>
          {CROP_CATALOG.map(rubro => (
            <div key={rubro.key} className={styles.catalogCard} style={{ background: rubro.bg }}>
              <div className={styles.catalogTop}>
                <span className={styles.catalogEmoji}>{rubro.emoji}</span>
                <p className={styles.catalogName}>{rubro.key}</p>
              </div>
              <p className={styles.alertaText}>{rubro.alerta}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'activas' && !loading && (
        <div className={styles.siembrasGrid}>
          {siembras.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No se encontraron siembras activas en este momento.</p>
              <button onClick={() => setTab('nueva')} className={styles.confirmBtn}>Registrar Nueva Siembra</button>
            </div>
          ) : (
            siembras.map(s => (
              <div key={s.id} className={styles.siembraCard}>
                <div className={styles.siembraHeader}>
                  <div>
                    <h3 className={styles.siembraRubro}>{s.rubro} - Lote {s.lote}</h3>
                    <p className={styles.siembraMeta}>{s.hectareas} ha · {s.duracionDias} días</p>
                  </div>
                  <div className={styles.headerActions}>
                    <button onClick={() => setEditModal(s)} className={styles.iconBtn}>✏️</button>
                    <button onClick={() => eliminarSiembra(s.id)} className={styles.iconBtn}>🗑️</button>
                  </div>
                </div>

                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${s._progreso}%` }} /></div>
                  <span className={styles.progressLabel}>{s._progreso}% completado</span>
                </div>

                <div className={styles.tasksSection}>
                  <div className={styles.tasksHeader}>
                    <h4 className={styles.tasksTitle}>Bitácora de Tareas</h4>
                    <button className={styles.addTaskBtn} onClick={() => setTaskModal({ cropId: s.id, index: null, nombre: '', tipo: 'general', fecha: '' })}>+ Tarea</button>
                  </div>
                  <ul className={styles.tareasList}>
                    {(Array.isArray(s.tareas) ? s.tareas : []).map((t, i) => (
                      <li key={i} className={styles.tareaItem}>
                        <input type="checkbox" checked={t.completada} onChange={() => toggleTarea(s.id, s.tareas, i)} />
                        <div className={styles.tareaDetails} onClick={() => setTaskModal({ cropId: s.id, index: i, ...t, fecha: safeToDate(t.fechaEjecucion).toISOString().split('T')[0] })}>
                          <span className={styles.tareaName}>{t.nombre || 'Tarea General'}</span>
                          <span className={styles.tareaDate}>{formatDate(t.fechaEjecucion)}</span>
                        </div>
                        <button onClick={() => eliminarTarea(s.id, i)} className={styles.deleteTaskBtn}>×</button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'nueva' && <NuevaSiembra onSiembraCreada={() => setTab('activas')} />}

      {editModal && (
        <div className={styles.modalOverlay} onClick={() => setEditModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2>Editar Siembra: {editModal.rubro}</h2>
            <form onSubmit={handleUpdateCrop} className={styles.modalForm}>
              <label>Lote / Potrero</label>
              <input value={editModal.lote} onChange={e => setEditModal({ ...editModal, lote: e.target.value })} />
              <label>Hectáreas</label>
              <input type="number" value={editModal.hectareas} onChange={e => setEditModal({ ...editModal, hectareas: e.target.value })} />
              <label>Duración (días)</label>
              <input type="number" value={editModal.duracionDias} onChange={e => setEditModal({ ...editModal, duracionDias: e.target.value })} />
              <button type="submit" className={styles.confirmBtn}>Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}

      {taskModal && (
        <div className={styles.modalOverlay} onClick={() => setTaskModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2>{taskModal.index !== null ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
            <form onSubmit={handleTaskSubmit} className={styles.modalForm}>
              <label>Nombre de la tarea</label>
              <input value={taskModal.nombre} onChange={e => setTaskModal({ ...taskModal, nombre: e.target.value })} required />
              <label>Fecha Programada</label>
              <input type="date" value={taskModal.fecha} onChange={e => setTaskModal({ ...taskModal, fecha: e.target.value })} required />
              <button type="submit" className={styles.confirmBtn}>Guardar Tarea</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
