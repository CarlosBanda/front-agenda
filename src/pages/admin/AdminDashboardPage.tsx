import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as adminApi from '../../api/admin';
import * as subscriptionsApi from '../../api/subscriptions';
import type { AdminStats } from '../../api/admin';
import type { SubscriptionStats } from '../../api/subscriptions';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  Building2,
  CheckCircle,
  Users,
  CreditCard,
  ArrowRight,
} from 'lucide-react';

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [subStats, setSubStats] = useState<SubscriptionStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [adminStats, subscriptionStats] = await Promise.all([
        adminApi.getStats(),
        subscriptionsApi.getSubscriptionStats(),
      ]);
      setStats(adminStats);
      setSubStats(subscriptionStats);
    } catch {
      showToast('Error al cargar estadísticas', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const statCards = [
    {
      label: 'Total Negocios',
      value: stats?.totalBusinesses ?? 0,
      icon: Building2,
      color: '#e91e8c',
      path: '/admin/negocios',
    },
    {
      label: 'Negocios Activos',
      value: stats?.activeBusinesses ?? 0,
      icon: CheckCircle,
      color: '#10b981',
      path: '/admin/negocios',
    },
    {
      label: 'Total Usuarios',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: '#9c27b0',
      path: null,
    },
    {
      label: 'Suscripciones Activas',
      value: subStats?.activeSubscriptions ?? 0,
      icon: CreditCard,
      color: '#06b6d4',
      path: '/admin/suscripciones',
    },
  ];

  const quickLinks = [
    { label: 'Gestión de Negocios', path: '/admin/negocios' },
    { label: 'Gestión de Planes', path: '/admin/planes' },
    { label: 'Suscripciones', path: '/admin/suscripciones' },
    { label: 'Centro de Operaciones', path: '/admin/operaciones' },
  ];

  const styles: Record<string, React.CSSProperties> = {
    container: {
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    title: {
      fontSize: '1.75rem',
      fontWeight: 700,
      color: '#1a1a2e',
      marginBottom: '2rem',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2.5rem',
    },
    statCard: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
    },
    iconBox: {
      width: '50px',
      height: '50px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statInfo: {
      display: 'flex',
      flexDirection: 'column',
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: '#1a1a2e',
    },
    statLabel: {
      fontSize: '0.85rem',
      color: '#6b7280',
    },
    linksSection: {
      marginTop: '1rem',
    },
    linksTitle: {
      fontSize: '1.1rem',
      fontWeight: 600,
      color: '#1a1a2e',
      marginBottom: '1rem',
    },
    linksList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    },
    linkItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 1.25rem',
      backgroundColor: '#fdf2f8',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      border: 'none',
      width: '100%',
      textAlign: 'left',
    },
    linkLabel: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#1a1a2e',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Panel de Administración</h1>

      <div style={styles.grid}>
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            onClick={stat.path ? () => navigate(stat.path) : undefined}
            style={stat.path ? { cursor: 'pointer' } : undefined}
          >
            <div style={styles.statCard}>
              <div
                style={{
                  ...styles.iconBox,
                  backgroundColor: `${stat.color}15`,
                }}
              >
                <stat.icon size={24} color={stat.color} />
              </div>
              <div style={styles.statInfo}>
                <span style={styles.statValue}>{stat.value}</span>
                <span style={styles.statLabel}>{stat.label}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={styles.linksSection}>
        <h2 style={styles.linksTitle}>Accesos Rápidos</h2>
        <div style={styles.linksList}>
          {quickLinks.map((link) => (
            <button
              key={link.path}
              style={styles.linkItem}
              onClick={() => navigate(link.path)}
            >
              <span style={styles.linkLabel}>{link.label}</span>
              <ArrowRight size={18} color="#e91e8c" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
