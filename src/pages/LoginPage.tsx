import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Mail, Lock } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        showToast('¡Bienvenido de nuevo!', 'success');
        if (payload.role === 'BUSINESS') {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Credenciales inválidas. Intenta de nuevo.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fdf2f8',
      padding: '1rem',
    },
    card: {
      width: '100%',
      maxWidth: '420px',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 10px 40px rgba(233, 30, 140, 0.12)',
      padding: '2rem',
    },
    header: {
      textAlign: 'center',
      marginBottom: '1.5rem',
    },
    title: {
      fontSize: '1.8rem',
      fontWeight: 700,
      color: '#1a1a2e',
      marginBottom: '0.5rem',
    },
    subtitle: {
      fontSize: '0.95rem',
      color: '#6b7280',
    },
    gradientText: {
      background: 'linear-gradient(135deg, #e91e8c, #9c27b0)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.2rem',
    },
    errorBox: {
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '10px',
      padding: '0.75rem 1rem',
      fontSize: '0.85rem',
      color: '#dc2626',
      textAlign: 'center',
    },
    footer: {
      textAlign: 'center',
      marginTop: '1.5rem',
      fontSize: '0.9rem',
      color: '#6b7280',
    },
    link: {
      color: '#e91e8c',
      fontWeight: 600,
      textDecoration: 'none',
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            <span style={styles.gradientText}>GlamBook</span>
          </h1>
          <p style={styles.subtitle}>Inicia sesión en tu cuenta</p>
        </div>

        <form style={styles.form} onSubmit={handleSubmit} noValidate>
          {error && <div style={styles.errorBox}>{error}</div>}

          <Input
            label="Email"
            type="email"
            icon={Mail}
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Contraseña"
            type="password"
            icon={Lock}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <div style={styles.footer}>
          ¿No tienes cuenta?{' '}
          <Link to="/register" style={styles.link}>
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
