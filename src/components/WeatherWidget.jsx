import { useAppContext } from '../context/AppContext';
import styles from './WeatherWidget.module.css';

export default function WeatherWidget() {
  const { data } = useAppContext();
  const weather = data?.weather || {
    temp: 29,
    condition: 'Parcialmente nublado',
    icon: '02d',
    humidity: 60,
    pop: 10,
    city: 'Barinas'
  };

  const forecast = [
    { time: 'Ahora', temp: `${weather.temp}°`, icon: '🌡️' },
    { time: 'Humedad', temp: `${weather.humidity}%`, icon: '💧' },
    { time: 'Nubes', temp: `${weather.pop}%`, icon: '☁️' },
  ];

  return (
    <div className={styles.weatherCard}>
      <div className={styles.left}>
        <div className={styles.mainInfo}>
          <h2 className={styles.temp}>{weather.temp}°</h2>
          <div className={styles.locationInfo}>
            <p className={styles.location}>{weather.city}</p>
            <p className={styles.probability}>{weather.pop}% Nubosidad</p>
          </div>
        </div>

        <div className={styles.forecast}>
          {forecast.map((item, index) => (
            <div key={index} className={styles.forecastItem}>
              <span className={styles.fIcon}>{item.icon}</span>
              <div className={styles.fLine}></div>
              <span className={styles.fTime}>{item.temp}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.cloudWrapper}>
          <img 
            src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`} 
            alt={weather.condition} 
            className={styles.cloudImg} 
          />
        </div>
        <p className={styles.conditionText} style={{ textTransform: 'capitalize' }}>
          {weather.condition}
        </p>
      </div>
    </div>
  );
}
