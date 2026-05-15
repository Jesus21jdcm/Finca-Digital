import React from 'react';
import styles from './CustomAlert.module.css';

/**
 * CustomAlert Component
 * @param {Object} props
 * @param {string} props.type - 'success' | 'error' | 'confirm' | 'warning'
 * @param {string} props.title - Title of the alert
 * @param {string} props.message - Description text
 * @param {Function} props.onConfirm - Callback for confirmation
 * @param {Function} props.onCancel - Callback for cancellation/closing
 * @param {string} props.confirmText - Text for the confirm button
 * @param {string} props.cancelText - Text for the cancel button
 */
const CustomAlert = ({ 
  type = 'success', 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Aceptar', 
  cancelText = 'Cancelar' 
}) => {
  
  const getIconData = () => {
    switch (type) {
      case 'success': return { 
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>, 
        className: styles.successIcon,
        badge: "✅"
      };
      case 'error': return { 
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>, 
        className: styles.errorIcon,
        badge: "❌"
      };
      case 'warning': return { 
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>, 
        className: styles.warningIcon,
        badge: "⚠️"
      };
      case 'confirm': return { 
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>, 
        className: styles.confirmIcon,
        badge: "❓"
      };
      default: return { 
        icon: "ℹ️", 
        className: styles.confirmIcon,
        badge: "ℹ️"
      };
    }
  };

  const { icon, className, badge } = getIconData();

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={`${styles.iconWrapper} ${className}`}>
          <div className={styles.svgIcon}>{icon}</div>
          <div className={styles.cornerBadge}>{badge}</div>
        </div>
        
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
        
        <div className={styles.actions}>
          {type === 'confirm' || type === 'warning' ? (
            <>
              <button className={`${styles.btn} ${styles.cancelBtn}`} onClick={onCancel}>
                {cancelText}
              </button>
              <button 
                className={`${styles.btn} ${type === 'warning' ? styles.deleteBtn : styles.confirmBtn}`} 
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button className={`${styles.btn} ${styles.confirmBtn}`} onClick={onConfirm || onCancel}>
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomAlert;
