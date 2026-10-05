import React, { useEffect, useState } from 'react';
import * as subscriptionsApi from '../../api/subscriptions';
import type { Plan, CreatePlanDto } from '../../api/subscriptions';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Plus, Edit, Trash2, Package } from 'lucide-react';

const emptyForm: CreatePlanDto = {
  slug: '',
  name: '',
  description: '',
  price: 0,
  currency: 'MXN',
  billingInterval: 'MONTH',
  duration: 30,
  features: [],
  maxServices: 10,
  maxStaff: 5,
  maxAppointmentsPerMonth: 100,
  providerPriceId: '',
  sortOrder: 0,
};

const AdminPlansPage: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState<CreatePlanDto>(emptyForm);
  const [featuresText, setFeaturesText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await subscriptionsApi.getPlansAdmin();
      setPlans(data);
    } catch {
      showToast('Error al cargar planes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setForm(emptyForm);
    setFeaturesText('');
    setModalOpen(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({
      slug: plan.slug,
      name: plan.name,
      description: plan.description || '',
      price: Number(plan.price),
      currency: plan.currency,
      billingInterval: plan.billingInterval,
      duration: plan.duration,
      features: plan.features ?? [],
      maxServices: plan.maxServices,
      maxStaff: plan.maxStaff,
      maxAppointmentsPerMonth: plan.maxAppointmentsPerMonth,
      providerPriceId: plan.providerPriceId ?? '',
      sortOrder: plan.sortOrder || 0,
    });
    setFeaturesText((plan.features ?? []).join('\n'));
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const dto: CreatePlanDto = {
      ...form,
      providerPriceId: form.providerPriceId?.trim() || undefined,
      features: featuresText.split('\n').filter((f) => f.trim() !== ''),
    };

    try {
      if (editingPlan) {
        const updated = await subscriptionsApi.updatePlan(editingPlan.id, dto);
        setPlans((prev) => prev.map((p) => (p.id === editingPlan.id ? updated : p)));
        showToast('Plan actualizado exitosamente', 'success');
      } else {
        const created = await subscriptionsApi.createPlan(dto);
        setPlans((prev) => [...prev, created]);
        showToast('Plan creado exitosamente', 'success');
      }
      setModalOpen(false);
    } catch {
      showToast(editingPlan ? 'Error al actualizar plan' : 'Error al crear plan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`¿Estás seguro de eliminar el plan "${plan.name}"?`)) return;
    try {
      await subscriptionsApi.removePlan(plan.id);
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      showToast('Plan eliminado exitosamente', 'success');
    } catch {
      showToast('Error al eliminar plan', 'error');
    }
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
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '1.5rem',
    },
    planHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '0.75rem',
    },
    planName: {
      fontSize: '1.1rem',
      fontWeight: 700,
      color: '#1a1a2e',
    },
    planPrice: {
      fontSize: '1.25rem',
      fontWeight: 700,
      color: '#e91e8c',
    },
    planMeta: {
      fontSize: '0.85rem',
      color: '#6b7280',
      marginBottom: '0.5rem',
    },
    planLimits: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem',
      marginBottom: '0.75rem',
    },
    limitBadge: {
      display: 'inline-block',
      padding: '0.2rem 0.6rem',
      borderRadius: '8px',
      fontSize: '0.75rem',
      backgroundColor: '#fdf2f8',
      color: '#9c27b0',
      fontWeight: 500,
    },
    featuresList: {
      listStyle: 'none',
      padding: 0,
      margin: '0.5rem 0',
    },
    featureItem: {
      fontSize: '0.85rem',
      color: '#374151',
      padding: '0.2rem 0',
    },
    planActions: {
      display: 'flex',
      gap: '0.5rem',
      marginTop: '1rem',
    },
    iconBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '34px',
      height: '34px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      transition: 'opacity 0.2s ease',
    },
    badgeActive: {
      display: 'inline-block',
      padding: '0.2rem 0.6rem',
      borderRadius: '9999px',
      fontSize: '0.7rem',
      fontWeight: 600,
      backgroundColor: '#d1fae5',
      color: '#065f46',
    },
    badgeInactive: {
      display: 'inline-block',
      padding: '0.2rem 0.6rem',
      borderRadius: '9999px',
      fontSize: '0.7rem',
      fontWeight: 600,
      backgroundColor: '#fee2e2',
      color: '#991b1b',
    },
    formGroup: {
      marginBottom: '1rem',
    },
    textarea: {
      width: '100%',
      minHeight: '80px',
      padding: '0.75rem',
      borderRadius: '10px',
      border: '1px solid #e5e7eb',
      fontSize: '0.9rem',
      fontFamily: 'inherit',
      resize: 'vertical',
      outline: 'none',
    },
    formLabel: {
      display: 'block',
      fontSize: '0.9rem',
      fontWeight: 600,
      color: '#1a1a2e',
      marginBottom: '0.4rem',
    },
    row: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '0.75rem',
    },
    emptyState: {
      textAlign: 'center',
      padding: '3rem',
      color: '#6b7280',
    },
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Gestión de Planes</h1>
        <Button onClick={openCreateModal}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={18} /> Crear Plan
          </span>
        </Button>
      </div>

      {plans.length === 0 ? (
        <div style={styles.emptyState}>
          <Package size={48} color="#d1d5db" />
          <p>No hay planes creados aún.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {plans.map((plan) => (
            <Card key={plan.id}>
              <div style={styles.planHeader}>
                <span style={styles.planName}>{plan.name}</span>
                <span style={plan.isActive !== false ? styles.badgeActive : styles.badgeInactive}>
                  {plan.isActive !== false ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div style={styles.planPrice}>
                ${plan.price.toLocaleString('es-MX')}
                <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 400 }}>
                  {' '}/ {plan.billingInterval === 'YEAR' ? 'año' : 'mes'}
                </span>
              </div>
              <div style={styles.planLimits}>
                <span style={styles.limitBadge}>Servicios: {plan.maxServices}</span>
                <span style={styles.limitBadge}>Staff: {plan.maxStaff}</span>
                <span style={styles.limitBadge}>Citas/mes: {plan.maxAppointmentsPerMonth}</span>
              </div>
              {(plan.features ?? []).length > 0 && (
                <ul style={styles.featuresList}>
                  {(plan.features ?? []).map((f, i) => (
                    <li key={i} style={styles.featureItem}>
                      • {f}
                    </li>
                  ))}
                </ul>
              )}
              <div style={styles.planActions}>
                <button
                  style={{ ...styles.iconBtn, backgroundColor: '#fdf2f8' }}
                  onClick={() => openEditModal(plan)}
                  title="Editar"
                >
                  <Edit size={16} color="#9c27b0" />
                </button>
                <button
                  style={{ ...styles.iconBtn, backgroundColor: '#fee2e2' }}
                  onClick={() => handleDelete(plan)}
                  title="Eliminar"
                >
                  <Trash2 size={16} color="#dc2626" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingPlan ? 'Editar Plan' : 'Crear Plan'}>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <Input
              label="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div style={{ ...styles.row, ...styles.formGroup }}>
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
              placeholder="plan-profesional"
              required
            />
            <Input
              label="Moneda"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
              placeholder="MXN"
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Periodicidad</label>
            <select
              style={styles.select}
              value={form.billingInterval}
              onChange={(e) =>
                setForm({
                  ...form,
                  billingInterval: e.target.value as 'MONTH' | 'YEAR',
                  duration: e.target.value === 'YEAR' ? 365 : 30,
                })
              }
            >
              <option value="MONTH">Mensual</option>
              <option value="YEAR">Anual</option>
            </select>
          </div>
          <div style={styles.formGroup}>
            <Input
              label="Stripe Price ID"
              value={form.providerPriceId ?? ''}
              onChange={(e) =>
                setForm({ ...form, providerPriceId: e.target.value.trim() })
              }
              placeholder="price_..."
            />
            <small style={{ color: '#6b7280' }}>
              Usa un Price recurrente en MXN creado en Stripe Dashboard.
            </small>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Descripción</label>
            <textarea
              style={styles.textarea}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descripción del plan..."
            />
          </div>
          <div style={{ ...styles.row, ...styles.formGroup }}>
            <Input
              label="Precio"
              type="number"
              min="0"
              step="0.01"
              value={String(form.price)}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              required
            />
            <Input
              label="Duración (días)"
              type="number"
              min="1"
              value={String(form.duration)}
              onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Features (una por línea)</label>
            <textarea
              style={styles.textarea}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
            />
          </div>
          <div style={{ ...styles.row, ...styles.formGroup }}>
            <Input
              label="Max Servicios"
              type="number"
              min="1"
              value={String(form.maxServices)}
              onChange={(e) => setForm({ ...form, maxServices: Number(e.target.value) })}
            />
            <Input
              label="Max Staff"
              type="number"
              min="1"
              value={String(form.maxStaff)}
              onChange={(e) => setForm({ ...form, maxStaff: Number(e.target.value) })}
            />
          </div>
          <div style={{ ...styles.row, ...styles.formGroup }}>
            <Input
              label="Max Citas/Mes"
              type="number"
              min="1"
              value={String(form.maxAppointmentsPerMonth)}
              onChange={(e) => setForm({ ...form, maxAppointmentsPerMonth: Number(e.target.value) })}
            />
            <Input
              label="Sort Order"
              type="number"
              min="0"
              value={String(form.sortOrder)}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="submit" disabled={saving} fullWidth>
              {saving ? 'Guardando...' : editingPlan ? 'Actualizar' : 'Crear Plan'}
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

export default AdminPlansPage;
