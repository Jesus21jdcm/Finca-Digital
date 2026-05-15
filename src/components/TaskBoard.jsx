import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAppContext } from '../context/AppContext';
import styles from './TaskBoard.module.css';

const COLUMNS = [
  { id: 'todo', label: 'Pendientes', color: '#64748b' },
  { id: 'doing', label: 'En Proceso', color: '#3b82f6' },
  { id: 'done', label: 'Completado', color: '#10b981' }
];

export default function TaskBoard() {
  const { data, showAlert } = useAppContext();
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', desc: '', worker: '' });

  useEffect(() => {
    const q = query(collection(db, 'tasks'));
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'tasks'), {
        ...newTask,
        status: 'todo',
        createdAt: serverTimestamp(),
        createdBy: data.user.nombre
      });
      setIsModalOpen(false);
      setNewTask({ title: '', desc: '', worker: '' });
    } catch (err) {
      showAlert({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const moveTask = async (taskId, newStatus) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { status: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Gestión de Tareas</h2>
          <p className={styles.subtitle}>Asigna y supervisa las labores de campo en tiempo real.</p>
        </div>
        <button className={styles.addBtn} onClick={() => setIsModalOpen(true)}>
          + Nueva Labor
        </button>
      </header>

      <div className={styles.board}>
        {COLUMNS.map(col => (
          <div key={col.id} className={styles.column}>
            <div className={styles.colHeader} style={{ borderTop: `4px solid ${col.color}` }}>
              <h3>{col.label}</h3>
              <span className={styles.count}>{tasks.filter(t => t.status === col.id).length}</span>
            </div>
            <div className={styles.colContent}>
              {tasks.filter(t => t.status === col.id).map(task => (
                <div key={task.id} className={styles.taskCard}>
                  <h4>{task.title}</h4>
                  <p>{task.desc}</p>
                  <div className={styles.taskFooter}>
                    <span className={styles.worker}>👤 {task.worker}</span>
                    <div className={styles.actions}>
                      {col.id !== 'todo' && <button onClick={() => moveTask(task.id, 'todo')}>⏪</button>}
                      {col.id === 'todo' && <button onClick={() => moveTask(task.id, 'doing')}>▶️</button>}
                      {col.id === 'doing' && <button onClick={() => moveTask(task.id, 'done')}>✅</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Asignar Nueva Tarea</h3>
            <form onSubmit={handleAddTask}>
              <div className={styles.formGroup}>
                <label>Título de la labor</label>
                <input 
                  type="text" 
                  placeholder="Ej: Fumigar lote norte" 
                  value={newTask.title} 
                  onChange={e => setNewTask({...newTask, title: e.target.value})} 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Descripción / Instrucciones</label>
                <textarea 
                  placeholder="Detalles sobre el producto a usar o área específica..." 
                  value={newTask.desc} 
                  onChange={e => setNewTask({...newTask, desc: e.target.value})} 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Encargado</label>
                <input 
                  type="text" 
                  placeholder="Nombre del trabajador" 
                  value={newTask.worker} 
                  onChange={e => setNewTask({...newTask, worker: e.target.value})} 
                  required 
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>Asignar Tarea</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
