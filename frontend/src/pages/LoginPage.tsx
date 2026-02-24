import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(username, password);
      navigate('/');
    } catch {
      setError('Identifiants invalides. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <Link to="/" style={styles.logoLink} aria-label="Retour à l'accueil">
          <span style={styles.logoMain}>La Petite Maison</span>
          <span style={styles.logoSub}>de l'épouvante</span>
        </Link>

        <h1 style={styles.heading}>Connexion</h1>
        <p style={styles.subheading}>Accédez à votre espace membre</p>

        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          <div style={styles.field}>
            <label htmlFor="username" style={styles.label}>Nom d'utilisateur</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              placeholder="votre_pseudo"
              disabled={isSubmitting}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>Mot de passe</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <p role="alert" style={styles.errorMsg}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...styles.submitBtn,
              opacity: isSubmitting ? 0.6 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    background: 'var(--ink)',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'var(--ink-light)',
    border: '1px solid var(--ash-mid)',
    borderRadius: 'var(--radius)',
    padding: '3rem 2.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  logoLink: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textDecoration: 'none',
    marginBottom: '1.5rem',
  },
  logoMain: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: 'var(--bone)',
  },
  logoSub: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.7rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    color: 'var(--blood-bright)',
  },
  heading: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.6rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: 'var(--bone)',
    marginBottom: '0.25rem',
  },
  subheading: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    color: 'var(--bone-dim)',
    marginBottom: '1.5rem',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.65rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: 'var(--bone-dim)',
  },
  input: {
    background: 'var(--ash)',
    border: '1px solid var(--ash-mid)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--bone)',
    fontFamily: 'var(--font-body)',
    fontSize: '1rem',
    padding: '0.65rem 0.85rem',
    outline: 'none',
    transition: 'border-color var(--transition)',
    width: '100%',
  },
  errorMsg: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    color: 'var(--blood-bright)',
    padding: '0.6rem 0.85rem',
    background: 'rgba(139,0,0,0.12)',
    border: '1px solid var(--blood)',
    borderRadius: 'var(--radius-sm)',
  },
  submitBtn: {
    marginTop: '0.5rem',
    width: '100%',
    fontFamily: 'var(--font-display)',
    fontSize: '0.75rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    padding: '0.85rem',
    background: 'var(--blood)',
    color: 'var(--bone)',
    border: '1px solid var(--blood)',
    borderRadius: 'var(--radius-sm)',
    transition: 'background var(--transition)',
  },
};
