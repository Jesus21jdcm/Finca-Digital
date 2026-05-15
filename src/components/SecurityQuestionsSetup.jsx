import { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import styles from './SecurityQuestionsSetup.module.css';

const QUESTIONS = [
  "¿Cuál es el nombre de tu primera mascota?",
  "¿En qué ciudad naciste?",
  "¿Cuál es tu color favorito?",
  "¿Cuál es el nombre de tu abuelo materno?",
  "¿Cuál fue tu primer carro?",
  "¿Cómo se llamaba tu escuela primaria?"
];

export default function SecurityQuestionsSetup({ userId, onComplete }) {
  const [q1, setQ1] = useState(QUESTIONS[0]);
  const [a1, setA1] = useState('');
  const [q2, setQ2] = useState(QUESTIONS[1]);
  const [a2, setA2] = useState('');
  const [q3, setQ3] = useState(QUESTIONS[2]);
  const [a3, setA3] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!a1 || !a2 || !a3) return;

    setLoading(true);
    try {
      await setDoc(doc(db, 'security_configs', userId), {
        questions: [
          { q: q1, a: a1.toLowerCase().trim() },
          { q: q2, a: a2.toLowerCase().trim() },
          { q: q3, a: a3.toLowerCase().trim() }
        ],
        setupComplete: true
      });
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.icon}>🔒</span>
          <h3>Configura tu Seguridad</h3>
          <p>Para recuperar tu clave sin ayuda externa, por favor responde 3 preguntas de seguridad. Solo tú sabrás estas respuestas.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.group}>
            <label>Pregunta 1</label>
            <select value={q1} onChange={e => setQ1(e.target.value)}>
              {QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
            <input type="text" placeholder="Tu respuesta" value={a1} onChange={e => setA1(e.target.value)} required />
          </div>

          <div className={styles.group}>
            <label>Pregunta 2</label>
            <select value={q2} onChange={e => setQ2(e.target.value)}>
              {QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
            <input type="text" placeholder="Tu respuesta" value={a2} onChange={e => setA2(e.target.value)} required />
          </div>

          <div className={styles.group}>
            <label>Pregunta 3</label>
            <select value={q3} onChange={e => setQ3(e.target.value)}>
              {QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
            <input type="text" placeholder="Tu respuesta" value={a3} onChange={e => setA3(e.target.value)} required />
          </div>

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Guardando...' : 'Finalizar Configuración'}
          </button>
        </form>
      </div>
    </div>
  );
}
