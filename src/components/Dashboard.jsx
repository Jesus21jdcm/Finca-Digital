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
        
        {/* ROW 1: Clima (Izq) y Donut Chart (Der) */}
        <div className={styles.rowTop}>
          <div className={styles.weatherWrapper}>
            <WeatherWidget />
          </div>
          
          <div className={styles.donutCard}>
            <h3 className={styles.cardTitle}>Total Hectares Donut Chart</h3>
            <div className={styles.donutContent}>
              <div className={styles.donutChartContainer}>
                <svg viewBox="0 0 36 36" className={styles.donutSvg}>
                  {/* Simplistic donut chart matching design */}
                  <path className={styles.donutRing} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                  <path className={styles.donutSegmentBlue} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="6" strokeDasharray="65 35" strokeDashoffset="25" />
                  <path className={styles.donutSegmentOrange} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f59e0b" strokeWidth="6" strokeDasharray="35 65" strokeDashoffset="-40" />
                </svg>
                <div className={styles.donutCenter}>
                  <span className={styles.donutValueTotal}>143.0 ha</span>
                </div>
              </div>
              <div className={styles.donutLegend}>
                <div className={styles.legendHeader}>
                  <span className={styles.lCrop}>Crop</span>
                  <span className={styles.lHect}>Hectares</span>
                </div>
                <div className={styles.legendRow}>
                  <span className={styles.lCropName}>🌽 Maíz</span>
                  <span className={styles.lCropVal}>124.2 ha</span>
                </div>
                <div className={styles.legendRow}>
                  <span className={styles.lCropName}>🥥 Cacao</span>
                  <span className={styles.lCropVal}>2.1 ha</span>
                </div>
                <div className={styles.legendRow}>
                  <span className={styles.lCropName}>🍠 Yuca</span>
                  <span className={styles.lCropVal}>14.7 ha</span>
                </div>
                <div className={styles.legendRow}>
                  <span className={styles.lCropName}>🍌 Platano</span>
                  <span className={styles.lCropVal}>2 ha</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Gráfico Grande de Cultivos */}
        <div className={styles.rowMiddle}>
          <div className={styles.largeChartCard}>
            <h3 className={styles.cardTitle}>Resumen de Cultivos Activos</h3>
            <div className={styles.largeChartContent}>
              {/* Fake Chart representation for design match */}
              <div className={styles.chartGraphic}>
                <div className={styles.chartLines}>
                  {/* We use SVG to draw the fake lines */}
                  <svg width="100%" height="100%" viewBox="0 0 1000 200" preserveAspectRatio="none">
                    <path d="M0,150 Q250,50 500,100 T1000,120" fill="none" stroke="#f59e0b" strokeWidth="3" opacity="0.8"/>
                    <path d="M0,100 Q200,180 600,80 T1000,160" fill="none" stroke="#3b82f6" strokeWidth="3" opacity="0.8"/>
                    <path d="M0,180 Q400,20 700,150 T1000,100" fill="none" stroke="#8b4513" strokeWidth="3" opacity="0.8"/>
                    <path d="M0,120 Q300,150 500,180 T1000,80" fill="none" stroke="#10b981" strokeWidth="3" opacity="0.8"/>
                    
                    {/* Dots on lines */}
                    <circle cx="250" cy="50" r="12" fill="#f59e0b" />
                    <circle cx="200" cy="180" r="12" fill="#3b82f6" />
                    <circle cx="400" cy="20" r="12" fill="#8b4513" />
                    <circle cx="700" cy="150" r="12" fill="#10b981" />
                    
                    {/* Vertical lines connecting dots to X axis */}
                    <line x1="250" y1="50" x2="250" y2="200" stroke="#f59e0b" strokeDasharray="4 4" />
                    <line x1="200" y1="180" x2="200" y2="200" stroke="#3b82f6" strokeDasharray="4 4" />
                    <line x1="400" y1="20" x2="400" y2="200" stroke="#8b4513" strokeDasharray="4 4" />
                    <line x1="700" y1="150" x2="700" y2="200" stroke="#10b981" strokeDasharray="4 4" />
                  </svg>
                </div>
                <div className={styles.chartXAxis}>
                  <span>1 dias</span>
                  <span>2 dias</span>
                  <span>3 dias</span>
                  <span>5 dias</span>
                  <span>6 dias</span>
                  <span>7 dias</span>
                </div>
              </div>
              <div className={styles.chartCardsRow}>
                {Object.entries(cropStats).filter(([_, s]) => s.count > 0).slice(0, 4).map(([key, s]) => (
                  <div key={key} className={styles.smallCropCard}>
                    <div className={styles.sCropIcon}>
                      <img
                        src={`/${key}.png`}
                        alt={key}
                        onError={(e) => { e.target.onerror = null; e.target.src = '/generic_plant.png'; }}
                      />
                    </div>
                    <div className={styles.sCropInfo}>
                      <h4 className={styles.sCropTitle}>{key.charAt(0).toUpperCase() + key.slice(1)}</h4>
                      <p className={styles.sCropDesc}>{s.campos} campos activos</p>
                    </div>
                    <div className={styles.sCropStats}>
                      <p className={styles.sCropVal}>{s.hectareas}</p>
                      <p className={styles.sCropSub}>{key.charAt(0).toUpperCase() + key.slice(1)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: Logistica y Estadisticas */}
        <div className={styles.rowBottom}>
          <div className={styles.logisticaCard}>
            <div className={styles.logHeader}>
              <div className={styles.logIconWrapper}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
              </div>
              <h3 className={styles.logTitle}>Logistica / Tareas</h3>
            </div>
            <div className={styles.logContent}>
              <ul className={styles.logList}>
                <li>⚙️ Garantizar condiciones óptimas para labores manuales.</li>
                <li>⚙️ Revisar bitácora de riego (Pendiente).</li>
                <li>⚙️ Realizar monitoreo preventivo de plagas.</li>
              </ul>
            </div>
          </div>
          
          <div className={styles.estCard}>
            <div className={styles.estHeader}>
              <h3 className={styles.estTitle}>Estadísticas Territoriales</h3>
              <p className={styles.estSub}>Distribución de Hectáreas - Territorio</p>
            </div>
            <div className={styles.estContent}>
              <div className={styles.estLeft}>
                <div className={styles.laurelWreath}>
                  <span className={styles.estNum}>11</span>
                  <p className={styles.estLabel}>TOTAL CULTIVOS<br/>ACTIVOS</p>
                </div>
              </div>
              <div className={styles.estCenter}>
                <img src="/generic_plant.png" alt="Plant" className={styles.estPlantImg} />
              </div>
              <div className={styles.estRight}>
                <ul className={styles.estList}>
                  <li>Maíz (124.2)</li>
                  <li>Cacao (2.1)</li>
                  <li>Yuca (14.7)</li>
                  <li>Platano (2)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
