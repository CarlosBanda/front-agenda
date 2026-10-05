import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, Compass } from 'lucide-react';
import Button from '../components/ui/Button';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Calendar size={48} color="#e91e8c" />,
      title: 'Fácil de usar',
      description: 'Encuentra y reserva citas en pocos clics, sin complicaciones.',
    },
    {
      icon: <Clock size={48} color="#9c27b0" />,
      title: 'Horarios flexibles',
      description: 'Consulta disponibilidad en tiempo real y elige el horario que mejor te convenga.',
    },
    {
      icon: <CheckCircle size={48} color="#e91e8c" />,
      title: 'Confirmación instantánea',
      description: 'Recibe la confirmación de tu cita al instante, sin esperas.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fdf2f8' }}>
      {/* Hero Section */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '100px 20px',
          background: 'linear-gradient(135deg, #e91e8c 0%, #9c27b0 100%)',
          color: '#ffffff',
        }}
      >
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, margin: '0 0 16px 0' }}>
          GlamBook
        </h1>
        <p style={{ fontSize: '1.4rem', margin: '0 0 40px 0', opacity: 0.9 }}>
          Reserva tu cita perfecta en segundos
        </p>
        <Button
          variant="contrast"
          className="hero-explore-button"
          onClick={() => navigate('/explorar')}
          style={{
            fontSize: '1.05rem',
            padding: '14px 32px',
            borderRadius: '14px',
            fontWeight: 750,
            letterSpacing: '0.01em',
          }}
        >
          <Compass size={20} aria-hidden="true" />
          Explorar negocios
        </Button>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        <h2
          style={{
            textAlign: 'center',
            fontSize: '2rem',
            color: '#1a1a2e',
            marginBottom: '50px',
            fontWeight: 700,
          }}
        >
          ¿Por qué GlamBook?
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '30px',
          }}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '40px 30px',
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ marginBottom: '20px' }}>{feature.icon}</div>
              <h3 style={{ fontSize: '1.3rem', color: '#1a1a2e', marginBottom: '12px' }}>
                {feature.title}
              </h3>
              <p style={{ color: '#555', lineHeight: 1.6, margin: 0 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section for Businesses */}
      <section
        style={{
          padding: '80px 20px',
          textAlign: 'center',
          backgroundColor: '#1a1a2e',
          color: '#ffffff',
        }}
      >
        <h2 style={{ fontSize: '2rem', marginBottom: '16px', fontWeight: 700 }}>
          ¿Tienes un negocio?
        </h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '30px', opacity: 0.85 }}>
          Únete a GlamBook y llega a más clientes. Gestiona tus citas de forma sencilla.
        </p>
        <Button
          onClick={() => navigate('/register')}
          style={{
            backgroundColor: '#e91e8c',
            color: '#ffffff',
            fontSize: '1.1rem',
            padding: '14px 36px',
            borderRadius: '30px',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Registrar mi Negocio
        </Button>
      </section>
    </div>
  );
};

export default HomePage;
