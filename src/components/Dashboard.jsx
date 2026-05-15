import { useAppContext } from '../context/AppContext';
import WeatherWidget from './WeatherWidget';
import MiniChart from './MiniChart';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { data, loading } = useAppContext();

  if (loading) return null;

  const user = data.user || { nombre: 'admin', rol: 'Administrador', email: 'admin@fincadigital.com' };
  const cropStats = data.cultivos || {};

  const weather = data?.weather || {};
  const isRainy = weather.pop > 50 || (weather.condition && weather.condition.toLowerCase().includes('lluvia'));
  const isSunny = weather.pop < 20 && weather.temp > 30;

  let alertText = (
    <>
      • Clima estable: Condiciones óptimas para labores manuales. <br />
      • Revisar bitácora de riego (Pendiente). <br />
      • Realizar monitoreo preventivo de plagas.
    </>
  );

  if (isRainy) {
    alertText = (
      <>
        • Alta probabilidad de lluvia ({weather.pop}%): Postergar fertilización. <br />
        • Asegurar drenajes en lotes bajos. <br />
        • Suspender labores de fumigación.
      </>
    );
  } else if (isSunny) {
    alertText = (
      <>
        • Alta temperatura ({weather.temp}°C): Aumentar frecuencia de riego. <br />
        • Proteger plantines del sol directo. <br />
        • Hidratar al personal de campo.
      </>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.mainGrid}>
        {/* Columna Izquierda */}
        <div className={styles.columnLeft}>
          {/* Perfil */}
          <div className={styles.profileCard}>
            <div className={styles.profileAvatarLarge}>
              <img src={`https://ui-avatars.com/api/?name=${user.nombre}&background=10b981&color=fff&size=128`} alt="Avatar" />
            </div>
            <div className={styles.profileInfo}>
              <h2 className={styles.profileName}>{user.nombre} <span className={styles.profileRole}>| {user.rol}</span></h2>
              <span className={styles.profileStatus}>Activo</span>
              <div className={styles.profileMeta}>
                <p>{user.email}</p>
                <p>Sede Principal, Barinas</p>
                <p>Último acceso: Hoy</p>
              </div>
            </div>
          </div>

          {/* Resumen de Cultivos */}
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Resumen de Cultivos Activos</h3>
          </div>

          <div className={styles.cropCards}>
            {Object.entries(cropStats).filter(([_, s]) => s.count > 0).map(([key, s]) => (
              <div key={key} className={styles.cropCard}>
                <div className={styles.cropTop}>
                  <div className={styles.cropIcon}>
                    <img 
                      src={`/${key}.png`} 
                      alt={key} 
                      onError={(e) => { e.target.onerror = null; e.target.src = '/flowerpot_icon.svg'; }} 
                    />
                  </div>
                  <div className={styles.cropHeader}>
                    <div className={styles.cropTitleRow}>
                      <h4 className={styles.cropTitle}>{key.charAt(0).toUpperCase() + key.slice(1)}</h4>
                      <span className={styles.cropTime}>Últimos 7 días</span>
                    </div>
                    <p className={styles.cropDetail}>{s.campos} campos activos</p>
                    <p className={styles.cropDetail}>{s.hectareas}</p>
                  </div>
                </div>
                <div className={styles.cropBottom}>
                  <MiniChart data={s.data} color={key === 'maiz' ? '#d97706' : '#10b981'} />
                  <div className={styles.cropCount}>{s.count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna Derecha */}
        <div className={styles.columnRight}>
          <WeatherWidget />

          {/* Alerta */}
          <div className={styles.alertCard}>
            <div className={styles.alertIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 9v4M12 17h.01M4.93 19h14.14a2 2 0 0 0 1.73-3L13.73 4a2 2 0 0 0-3.46 0L3.2 16a2 2 0 0 0 1.73 3z" />
              </svg>
            </div>
            <div className={styles.alertContent}>
              <h4 className={styles.alertTitle}>ALERTA DE LOGÍSTICA / TAREAS ASIGNADAS:</h4>
              <p className={styles.alertText}>
                {alertText}
              </p>
            </div>
          </div>

          {/* Estadísticas */}
          <div className={styles.statsCard}>
            <div className={styles.statsHeader}>
              <h3 className={styles.statsTitle}>ESTADÍSTICAS TERRITORIALES</h3>
              <p className={styles.statsSub}>Distribución de Hectáreas - Territorio</p>
            </div>
            <div className={styles.statsContent}>
              <div className={styles.statsLeft}>
                <div className={styles.totalBadge}>
                  <span className={styles.totalNum}>{data.stats['cultivos-activos'].count}</span>
                  <p className={styles.totalLabel}>Total Cultivos Activos</p>
                </div>
                <div className={styles.statsIconPlant}>
                  <img src="/generic_plant.png" alt="Plant" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                </div>
              </div>
              <div className={styles.statsRight}>
                <div className={styles.chartContainer}>
                  <svg viewBox="0 0 36 36" className={styles.donutChart}>
                    <path className={styles.donutHole} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="#fff" />
                    <path className={styles.donutRing} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                    <path className={styles.donutSegment} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#d97706" strokeWidth="4" strokeDasharray="92 8" strokeDashoffset="25" />
                    <path className={styles.donutSegment} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="8 92" strokeDashoffset="33" />
                  </svg>
                  <div className={styles.donutCenter}>
                    <span className={styles.donutTotal}>Total</span>
                    <span className={styles.donutValue}>{Object.values(cropStats).reduce((acc, curr) => acc + (parseFloat(curr.hectareas) || 0), 0).toFixed(1)} ha</span>
                  </div>
                </div>
                <div className={styles.legend}>
                  {Object.entries(cropStats).filter(([_, s]) => s.count > 0).map(([key, s]) => (
                    <p key={key}>{key.charAt(0).toUpperCase() + key.slice(1)} ({s.hectareas})</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tareas */}
          <div className={styles.tasksCard}>
            <div className={styles.tasksHeader}>
              <h3 className={styles.tasksTitle}>TAREAS PENDIENTES</h3>
              <span className={styles.tasksTotal}>Total: {data.activeCrops.reduce((acc, c) => acc + c._tareasPendientes, 0)}</span>
            </div>
            <div className={styles.tasksContent}>
              <div className={styles.tasksLeft}>
                <div className={styles.tasksCircle}>{data.activeCrops.reduce((acc, c) => acc + c._tareasPendientes, 0)}</div>
              </div>
              <div className={styles.tasksRight}>
                <ul className={styles.tasksList}>
                  {data.activeCrops.slice(0, 3).map(c => (
                    c.tareas.filter(t => !t.completada).slice(0, 1).map((t, idx) => (
                      <li key={`${c.id}-${idx}`}>{t.nombre} ({c.rubro})</li>
                    ))
                  ))}
                </ul>
                <p className={styles.tasksFooter}>
                  {data.activeCrops.some(c => c._tareasPendientes > 0) 
                    ? "Tienes labores pendientes por completar." 
                    : "No hay labores pendientes. ¡Todo al día!"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
