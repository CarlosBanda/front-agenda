import React, { useEffect, useState } from 'react';
import * as subscriptionsApi from '../../api/subscriptions';
import * as adminApi from '../../api/admin';
import type { Subscription, CreateSubscriptionDto, Plan } from '../../api/subscriptions';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { Business, PaginatedResponse } from '../../types';
import { CreditCard, Plus, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';

type SubscriptionStatus =
  | 'INCOMPLETE'
  | 'ACTIVE'
  | 'TRIAL'
  | 'PAST_DUE'
  | 'EXPIRED'
  | 'CANCELLED';

const statusColors: Record<SubscriptionStatus, { bg: string; color: string }> = {
  INCOMPLETE: { bg: '#fef3c7', color: '#92400e' },
  ACTIVE: { bg: '#d1fae5', color: '#065f46' },
  TRIAL: { bg: '#dbeafe', color: '#1e40af' },
  PAST_DUE: { bg: '#ffedd5', color: '#9a3412' },
  EXPIRED: { bg: '#f3f4f6', color: '#6b7280' },
  CANCELLED: { bg: '#fee2e2', color: '#991b1b' },
};

const AdminSubscriptionsPage: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState<number | null>(null);

  // For the create modal
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState<CreateSubscriptionDto>({
    businessId: 0,
    planId: 0,
    startDate: new Date().toISOString().split('T')[0],
  });

  const limit = 10;

  useEffect(() => {
    loadSubscriptions();
  }, [page]);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const res: PaginatedResponse<Subscription> = await subscriptionsApi.getSubscriptions(page, limit);
      setSubscriptions(res.data);
      setTotalPages(res.totalPages);
    } catch {
      showToast('Error al cargar suscripciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = async () => {
    try {
      const [bizRes, plansData] = await Promise.all([
        adminApi.getBusinesses(1, 100),
        subscriptionsApi.getPlansAdmin(),
      ]);
      setBusinesses(bizRes.data);
      setPlans(plansData);
      setForm({
        businessId: 0,
        planId: 0,
        startDate: new Date().toISOString().split('T')[0],
      });
      setModalOpen(true);
    } catch {
      showToast('Error al cargar datos para asignación', 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessId || !form.planId) {
      showToast('Selecciona un negocio y un plan', 'error');
      return;
    }
    setSaving(true);
    try {
      await subscriptionsApi.createSubscription(form);
      showToast('Suscripción asignada exitosamente', 'success');
      setModalOpen(false);
      loadSubscriptions();
    } catch {
      showToast('Error al asignar suscripción', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('¿Estás seguro de cancelar esta suscripción?')) return;
    setCancelling(id);
    try {
      await subscriptionsApi.cancelSubscription(id);
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'CANCELLED' as SubscriptionStatus } : s))
      );
      showToast('Suscripción cancelada exitosamente', 'success');
    } catch {
      showToast('Error al cancelar suscripción', 'error');
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const s = statusColors[status as SubscriptionStatus] || statusColors.EXPIRED;
    return {
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      backgroundColor: s.bg,
      color: s.color,
    } as React.CSSProperties;
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1.5rem',
    },
    title: {
      fontSize: '1.75rem',
      fontWeight: 700,
      color: '#1a1a2e',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.06)',
    },
    th: {
      textAlign: 'left',
      padding: '1rem',
      backgroundColor: '#fdf2f8',
      fontSize: '0.85rem',
      fontWeight: 600,
      color: '#1a1a2e',
      borderBottom: '1px solid #f3e8ff',
    },
    td: {
      padding: '1rem',
      fontSize: '0.9rem',
      color: '#374151',
      borderBottom: '1px solid #f3f4f6',
    },
    pagination: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      marginTop: '1.5rem',
    },
    pageBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '36px',
      height: '36px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      backgroundColor: '#ffffff',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    pageBtnDisabled: {
      opacity: 0.4,
      cursor: 'not-allowed',
    },
    pageInfo: {
      fontSize: '0.9rem',
      color: '#6b7280',
    },
    formGroup: {
      marginBottom: '1rem',
    },
    formLabel: {
      display: 'block',
      fontSize: '0.9rem',
      fontWeight: 600,
      color: '#1a1a2e',
      marginBottom: '0.4rem',
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '10px',
      border: '1px solid #e5e7eb',
      fontSize: '0.9rem',
      color: '#1a1a2e',
      backgroundColor: '#ffffff',
      outline: 'none',
      appearance: 'none',
    },
    cancelBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.3rem',
      padding: '0.35rem 0.75rem',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: '#fee2e2',
      color: '#dc2626',
      fontSize: '0.8rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'opacity 0.2s ease',
    },
    emptyState: {
      textAlign: 'center',
      padding: '3rem',
      color: '#6b7280',
    },
  };

  if (loading && subscriptions.length === 0) return <LoadingSpinner />;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Suscripciones</h1>
        <Button onClick={openAssignModal}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={18} /> Asignar Suscripción
          </span>
        </Button>
      </div>

      {subscriptions.length === 0 ? (
        <div style={styles.emptyState}>
          <CreditCard size={48} color="#d1d5db" />
          <p>No hay suscripciones registradas.</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Negocio</th>
                  <th style={styles.th}>Plan</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Fecha Inicio</th>
                  <th style={styles.th}>Fecha Fin</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td style={styles.td}>{(sub as any).business?.name ?? sub.businessId}</td>
                    <td style={styles.td}>{(sub as any).plan?.name ?? sub.planId}</td>
                    <td style={styles.td}>
                      <span style={getStatusBadge(sub.status)}>
                        {sub.status}
                      </span>
                    </td>
                    <td style={styles.td}>{formatDate(sub.startDate)}</td>
                    <td style={styles.td}>{sub.endDate ? formatDate(sub.endDate) : '—'}</td>
                    <td style={styles.td}>
                      {sub.status !== 'CANCELLED' && sub.status !== 'EXPIRED' && (
                        <button
                          style={styles.cancelBtn}
                          onClick={() => handleCancel(sub.id)}
                          disabled={cancelling === sub.id}
                        >
                          <XCircle size={14} />
                          {cancelling === sub.id ? '...' : 'Cancelar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.pagination}>
            <button
              style={{
                ...styles.pageBtn,
                ...(page <= 1 ? styles.pageBtnDisabled : {}),
              }}
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={18} color="#1a1a2e" />
            </button>
            <span style={styles.pageInfo}>
              Página {page} de {totalPages}
            </span>
            <button
              style={{
                ...styles.pageBtn,
                ...(page >= totalPages ? styles.pageBtnDisabled : {}),
              }}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={18} color="#1a1a2e" />
            </button>
          </div>
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Asignar Suscripción">
        <form onSubmit={handleCreate}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Negocio</label>
            <select
              style={styles.select}
              value={form.businessId}
              onChange={(e) => setForm({ ...form, businessId: Number(e.target.value) })}
              required
            >
              <option value="">Seleccionar negocio...</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Plan</label>
            <select
              style={styles.select}
              value={form.planId}
              onChange={(e) => setForm({ ...form, planId: Number(e.target.value) })}
              required
            >
              <option value="">Seleccionar plan...</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${p.price.toLocaleString('es-MX')}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.formGroup}>
            <Input
              label="Fecha de Inicio"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="submit" disabled={saving} fullWidth>
              {saving ? 'Asignando...' : 'Asignar Suscripción'}
            </Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)} fullWidth>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminSubscriptionsPage;
