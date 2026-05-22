import { useAppContext } from '../context/AppContext';
import styles from './WeatherWidget.module.css';

export default function WeatherWidget() {
  const { data } = useAppContext();
  const weather = data?.weather || {
    temp: 29,
    condition: 'Parcialmente Nublado',
    icon: '02d',
    humidity: 10,
    pop: 10,
    city: 'Barinas'
  };

  const forecast = [
    { day: '7 días', icon: '☁️', temp: '' },
    { day: 'Lun', icon: '🌧️', temp: '' },
    { day: 'Luv', icon: '☁️', temp: '' },
    { day: 'Luv', icon: '🌤️', temp: '' },
    { day: 'Doc', icon: '🌧️', temp: '' },
    { day: 'Mem', icon: '☁️', temp: '' },
    { day: 'Sab', icon: '🌧️', temp: '' },
    { day: '7 dia', icon: '🌧️', temp: '' },
  ];

  return (
    <div className={styles.weatherCard}>
      <div className={styles.topSection}>
        <div className={styles.leftInfo}>
          <p className={styles.location}>{weather.city}</p>
          <div className={styles.tempRow}>
            <h2 className={styles.temp}>{weather.temp}°<span className={styles.celsius}>C</span></h2>
            <p className={styles.conditionText}>{weather.condition}</p>
          </div>
        </div>
        <div className={styles.rightIcon}>
          <div className={styles.cloudWrapper}>
            <img 
              src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`} 
              alt={weather.condition} 
              className={styles.cloudImg} 
              onError={(e) => { e.target.onerror = null; e.target.src = '/generic_plant.png'; }}
            />
          </div>
        </div>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.bottomSection}>
        <div className={styles.forecast}>
          {forecast.map((item, index) => (
            <div key={index} className={styles.forecastItem}>
              <span className={styles.fDay}>{item.day}</span>
              <span className={styles.fIcon}>{item.icon}</span>
            </div>
          ))}
        </div>
        
        <div className={styles.footerInfo}>
          <p className={styles.windInfo}>Wiento: {weather.temp}°C / ↗ rm4 km</p>
          <p className={styles.humInfo}>💧 {weather.pop}% / Humididad: {weather.humidity}%</p>
        </div>
      </div>
    </div>
  );
}
