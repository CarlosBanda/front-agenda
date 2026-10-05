import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { User, Mail, Lock, Phone } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('CLIENT');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register({ name, email, password, phone, role });
      showToast('¡Cuenta creada exitosamente!', 'success');
      if (role === 'BUSINESS') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Error al registrarse. Intenta de nuevo.';
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
    roleSelector: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
    },
    roleLabel: {
      fontSize: '0.9rem',
      fontWeight: 600,
      color: '#1a1a2e',
    },
    roleOptions: {
      display: 'flex',
      gap: '0.75rem',
    },
    roleOption: {
      flex: 1,
      padding: '0.7rem 1rem',
      borderRadius: '10px',
      fontSize: '0.9rem',
      fontWeight: 600,
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s ease',
      border: '2px solid #e5e7eb',
      backgroundColor: '#ffffff',
      color: '#6b7280',
    },
    roleOptionActive: {
      flex: 1,
      padding: '0.7rem 1rem',
      borderRadius: '10px',
      fontSize: '0.9rem',
      fontWeight: 600,
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s ease',
      border: '2px solid #e91e8c',
      background: 'linear-gradient(135deg, #e91e8c, #9c27b0)',
      color: '#ffffff',
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
          <p style={styles.subtitle}>Crea tu cuenta</p>
        </div>

        <form style={styles.form} onSubmit={handleSubmit} noValidate>
          {error && <div style={styles.errorBox}>{error}</div>}

          <Input
            label="Nombre"
            type="text"
            icon={User}
            placeholder="Tu nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

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
            minLength={10}
            required
          />

          <Input
            label="Teléfono"
            type="tel"
            icon={Phone}
            placeholder="+52 123 456 7890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <div style={styles.roleSelector}>
            <span style={styles.roleLabel}>Tipo de cuenta</span>
            <div style={styles.roleOptions}>
              <button
                type="button"
                style={role === 'CLIENT' ? styles.roleOptionActive : styles.roleOption}
                onClick={() => setRole('CLIENT')}
              >
                Cliente
              </button>
              <button
                type="button"
                style={role === 'BUSINESS' ? styles.roleOptionActive : styles.roleOption}
                onClick={() => setRole('BUSINESS')}
              >
                Negocio
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? 'Creando cuenta...' : 'Registrarse'}
          </Button>
        </form>

        <div style={styles.footer}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={styles.link}>
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
