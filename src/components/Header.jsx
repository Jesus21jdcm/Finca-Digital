import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAppContext } from '../context/AppContext';
import styles from './Header.module.css';

export default function Header({ onNavigate, userRole }) {
  const { theme, toggleTheme } = useAppContext();
  const handleLogout = () => {
    signOut(auth).catch((error) => {
      console.error("Error al cerrar sesión:", error);
    });
  };

  const userEmail = auth.currentUser?.email || 'admin@fincadigital.com';

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <div className={styles.left}>
          <div className={styles.logoGroup}>
            <div className={styles.logoCircle}>
              <img src="/logo.png" alt="Finca Digital Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div className={styles.brandInfo}>
              <h1 className={styles.brandName}>FINCA DIGITAL</h1>
              <div className={styles.divider}></div>
              <div className={styles.brandSub}>
                <h2 className={styles.mainTitle}>Panel Administrativo</h2>
                <p className={styles.subTitle}>Sistema de Gestión Agrícola</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.buttonGroup}>
            {userRole === 'admin' && (
              <button className={styles.outlineBtn} onClick={() => onNavigate('usuarios')}>
                Usuarios
              </button>
            )}
            <button className={styles.themeToggle} onClick={toggleTheme} title="Cambiar Tema">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>

          <div className={styles.userProfile}>
            <div className={styles.avatar}>
              AD
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>admin</span>
              <span className={styles.userEmail}>{userEmail}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
