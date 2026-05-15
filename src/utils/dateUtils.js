/**
 * dateUtils.js
 * Centralized date handling for Finca Digital.
 */

/**
 * Safely converts a value (Firestore timestamp, JS Date, or ISO string) to a JS Date.
 */
export function safeToDate(val) {
  try {
    if (!val) return new Date();
    if (typeof val.toDate === 'function') return val.toDate();
    if (val.seconds) return new Date(val.seconds * 1000);
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  } catch (e) {
    return new Date();
  }
}

/**
 * Calculates days elapsed from a start date and the progress percentage.
 */
export function calculateCropProgress(startDate, durationDays) {
  const start = safeToDate(startDate);
  const hoy = new Date();
  const diasTranscurridos = Math.max(0, Math.floor((hoy - start) / 86400000));
  const progreso = Math.min(100, Math.round((diasTranscurridos / (durationDays || 120)) * 100));
  
  return {
    diasTranscurridos,
    progreso
  };
}

/**
 * Formats a date for display in Venezuela locale.
 */
export function formatDate(date, options = { day: '2-digit', month: 'short', year: 'numeric' }) {
  const d = safeToDate(date);
  return d.toLocaleDateString('es-VE', options);
}

/**
 * Adds days to a date string (YYYY-MM-DD) or Date object.
 */
export function addDays(date, days) {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
