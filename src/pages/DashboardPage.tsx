import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as businessesApi from '../api/businesses';
import * as appointmentsApi from '../api/appointments';
import * as servicesApi from '../api/services';
import * as staffApi from '../api/staff';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import type { Business, Appointment, Service, Staff } from '../types';
import { AppointmentStatus } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CalendarDays,
  Clock,
  Scissors,
  Users,
  Store,
  Calendar,
  LayoutGrid,
  Contact,
  FileText,
  MessageCircle,
  Rocket,
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const businesses = await businessesApi.getMine();
      if (businesses.length > 0) {
        const biz = businesses[0];
        setBusiness(biz);
        const today = format(new Date(), 'yyyy-MM-dd');
        const [aptsRes, svcRes, stfRes] = await Promise.all([
          appointmentsApi.getByBusiness(biz.id, today),
          servicesApi.getByBusiness(biz.id),
          staffApi.getByBusiness(biz.id),
        ]);
        setTodayAppointments(aptsRes.data);
        setServices(svcRes);
        setStaffList(stfRes);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!business) {
    return (
      <div style={styles.container}>
        <Card>
          <div style={styles.noBusiness}>
            <Store size={48} color="#e91e8c" />
            <h2 style={styles.noBusinessTitle}>No tienes un negocio registrado</h2>
            <p style={styles.noBusinessText}>Crea tu negocio para empezar a gestionar tus citas y servicios.</p>
            <button style={styles.ctaButton} onClick={() => navigate('/mi-negocio')}>Configura tu Negocio</button>
          </div>
        </Card>
      </div>
    );
  }

  const pendingCount = todayAppointments.filter((a) => a.status === AppointmentStatus.PENDING).length;
  const activeServices = services.filter((s) => s.isActive).length;
  const activeStaff = staffList.filter((s) => s.isActive).length;

  const summaryCards = [
    { title: 'Total citas hoy', value: todayAppointments.length, icon: CalendarDays, color: '#e91e8c' },
    { title: 'Citas pendientes', value: pendingCount, icon: Clock, color: '#9c27b0' },
    { title: 'Servicios activos', value: activeServices, icon: Scissors, color: '#e91e8c' },
    { title: 'Staff activo', value: activeStaff, icon: Users, color: '#9c27b0' },
  ];

  const quickLinks = [
    { label: 'Agenda', path: '/citas', icon: Calendar },
    { label: 'Clientes', path: '/clientes', icon: Contact },
    { label: 'Servicios', path: '/servicios', icon: Scissors },
    { label: 'Staff', path: '/staff', icon: Users },
    { label: 'Horarios', path: '/horarios', icon: LayoutGrid },
    { label: 'Políticas', path: '/politicas', icon: FileText },
    { label: 'Recordatorios', path: '/recordatorios', icon: MessageCircle },
    { label: 'Mi Negocio', path: '/mi-negocio', icon: Store },
    { label: 'Primeros pasos', path: '/onboarding', icon: Rocket },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>Bienvenido, {user?.name} — {business.name}</p>
        <p style={styles.dateText}>{format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}</p>
      </div>
      <div style={styles.cardsGrid}>
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <div style={styles.summaryCard}>
              <div style={{ ...styles.iconContainer, backgroundColor: `${card.color}15` }}>
                <card.icon size={24} color={card.color} />
              </div>
              <div>
                <p style={styles.cardLabel}>{card.title}</p>
                <p style={styles.cardValue}>{card.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div style={styles.quickLinksSection}>
        <h2 style={styles.sectionTitle}>Accesos rápidos</h2>
        <div style={styles.quickLinksGrid}>
          {quickLinks.map((link) => (
            <Card key={link.path} onClick={() => navigate(link.path)}>
              <div style={styles.quickLinkCard}>
                <link.icon size={28} color="#e91e8c" />
                <span style={styles.quickLinkLabel}>{link.label}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
  header: { marginBottom: '2rem' },
  title: { fontSize: '2rem', fontWeight: 700, color: '#1a1a2e', margin: 0 },
  subtitle: { fontSize: '1.1rem', color: '#6b7280', marginTop: '0.3rem' },
  dateText: { fontSize: '0.95rem', color: '#9ca3af', marginTop: '0.2rem', textTransform: 'capitalize' },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' },
  summaryCard: { display: 'flex', alignItems: 'center', gap: '1rem' },
  iconContainer: { width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: '0.85rem', color: '#6b7280', margin: 0 },
  cardValue: { fontSize: '1.8rem', fontWeight: 700, color: '#1a1a2e', margin: 0 },
  quickLinksSection: { marginTop: '1rem' },
  sectionTitle: { fontSize: '1.3rem', fontWeight: 600, color: '#1a1a2e', marginBottom: '1rem' },
  quickLinksGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' },
  quickLinkCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' },
  quickLinkLabel: { fontSize: '0.9rem', fontWeight: 600, color: '#1a1a2e' },
  noBusiness: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem 1rem', textAlign: 'center' },
  noBusinessTitle: { fontSize: '1.4rem', fontWeight: 700, color: '#1a1a2e', margin: 0 },
  noBusinessText: { fontSize: '1rem', color: '#6b7280', margin: 0 },
  ctaButton: { marginTop: '0.5rem', padding: '0.7rem 2rem', background: 'linear-gradient(135deg, #e91e8c, #9c27b0)', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 15px rgba(233, 30, 140, 0.3)' },
};

export default DashboardPage;
