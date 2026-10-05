import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scissors, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const getNavLinks = () => {
    if (!user) {
      return [
        { to: '/', label: 'Inicio' },
        { to: '/explorar', label: 'Explorar' },
        { to: '/planes', label: 'Planes' },
        { to: '/login', label: 'Iniciar Sesión' },
      ];
    }
    if (user.role === 'CLIENT') {
      return [
        { to: '/', label: 'Inicio' },
        { to: '/explorar', label: 'Explorar' },
        { to: '/mis-citas', label: 'Mis Citas' },
        { to: '/soporte', label: 'Soporte' },
        { to: '/perfil', label: 'Mi Perfil' },
      ];
    }
    if (user.role === 'BUSINESS') {
      return [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/citas', label: 'Agenda' },
        { to: '/clientes', label: 'Clientes' },
        { to: '/servicios', label: 'Servicios' },
        { to: '/staff', label: 'Staff' },
        { to: '/horarios', label: 'Horarios' },
        { to: '/politicas', label: 'Políticas' },
        { to: '/recordatorios', label: 'Recordatorios' },
        { to: '/mi-negocio', label: 'Mi Negocio' },
        { to: '/soporte', label: 'Soporte' },
      ];
    }
    if (user.role === 'ADMIN') {
      return [
        { to: '/admin', label: 'Dashboard' },
        { to: '/admin/negocios', label: 'Negocios' },
        { to: '/admin/planes', label: 'Planes' },
        { to: '/admin/suscripciones', label: 'Suscripciones' },
        { to: '/admin/operaciones', label: 'Operaciones' },
      ];
    }
    return [];
  };

  const navLinks = getNavLinks();

  const styles: Record<string, React.CSSProperties> = {
    nav: {
      background: 'linear-gradient(135deg, #e91e8c, #9c27b0)',
      padding: '0 2rem',
      boxShadow: '0 4px 20px rgba(233, 30, 140, 0.3)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    },
    container: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      maxWidth: '1200px',
      margin: '0 auto',
      height: '64px',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      textDecoration: 'none',
      color: '#ffffff',
      fontSize: '1.5rem',
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    desktopLinks: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.2rem',
    },
    link: {
      color: '#ffffff',
      textDecoration: 'none',
      fontSize: '0.84rem',
      fontWeight: 500,
      padding: '0.35rem 0.45rem',
      borderRadius: '8px',
      transition: 'background 0.2s ease',
    },
    logoutBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem',
      background: 'rgba(255,255,255,0.15)',
      border: '1px solid rgba(255,255,255,0.3)',
      color: '#ffffff',
      padding: '0.4rem 1rem',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 500,
      transition: 'background 0.2s ease',
    },
    hamburger: {
      display: 'none',
      background: 'none',
      border: 'none',
      color: '#ffffff',
      cursor: 'pointer',
      padding: '0.5rem',
    },
    mobileMenu: {
      position: 'absolute',
      top: '64px',
      left: 0,
      right: 0,
      background: 'linear-gradient(135deg, #e91e8c, #9c27b0)',
      padding: '1rem 2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.8rem',
      boxShadow: '0 8px 20px rgba(233, 30, 140, 0.3)',
    },
    mobileLink: {
      color: '#ffffff',
      textDecoration: 'none',
      fontSize: '1rem',
      fontWeight: 500,
      padding: '0.6rem 1rem',
      borderRadius: '8px',
      transition: 'background 0.2s ease',
    },
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          <Scissors size={24} />
          <span>GlamBook</span>
        </Link>

        {/* Desktop Navigation */}
        <div style={styles.desktopLinks} className="navbar-desktop">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} style={styles.link}>
              {link.label}
            </Link>
          ))}
          {user && (
            <button style={styles.logoutBtn} onClick={handleLogout}>
              <LogOut size={16} />
              Salir
            </button>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          style={styles.hamburger}
          className="navbar-hamburger"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={styles.mobileMenu} className="navbar-mobile-menu">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={styles.mobileLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <button style={styles.logoutBtn} onClick={handleLogout}>
              <LogOut size={16} />
              Salir
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 1100px) {
          .navbar-desktop { display: none !important; }
          .navbar-hamburger { display: block !important; }
        }
        @media (min-width: 1101px) {
          .navbar-hamburger { display: none !important; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
