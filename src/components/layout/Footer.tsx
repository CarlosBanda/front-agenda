import React from 'react';
import { Link } from 'react-router-dom';
import { Scissors } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const styles: Record<string, React.CSSProperties> = {
    footer: {
      background: 'linear-gradient(135deg, #e91e8c, #9c27b0)',
      color: '#ffffff',
      padding: '2rem 1rem',
      marginTop: 'auto',
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
    },
    brand: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '1.2rem',
      fontWeight: 700,
    },
    links: {
      display: 'flex',
      gap: '1.5rem',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    link: {
      color: 'rgba(255,255,255,0.85)',
      textDecoration: 'none',
      fontSize: '0.9rem',
      transition: 'color 0.2s ease',
    },
    copyright: {
      fontSize: '0.85rem',
      color: 'rgba(255,255,255,0.7)',
      textAlign: 'center',
    },
  };

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.brand}>
          <Scissors size={20} />
          <span>GlamBook</span>
        </div>
        <div style={styles.links}>
          <Link to="/" style={styles.link}>Inicio</Link>
          <Link to="/explorar" style={styles.link}>Explorar</Link>
          <Link to="/terminos" style={styles.link}>Términos</Link>
          <Link to="/privacidad" style={styles.link}>Privacidad</Link>
          <Link to="/contacto" style={styles.link}>Contacto</Link>
        </div>
        <p style={styles.copyright}>
          © {currentYear} GlamBook. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
