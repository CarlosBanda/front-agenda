import React, { useCallback, useEffect, useState } from 'react';
import * as businessesApi from '../api/businesses';
import * as policiesApi from '../api/policies';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import type { ChargeType } from '../types';
import { FileText } from 'lucide-react';

const CHARGE_OPTIONS: { value: ChargeType; label: string }[] = [
  { value: 'NONE', label: 'Sin cargo' },
  { value: 'FIXED', label: 'Monto fijo (MXN)' },
  { value: 'PERCENT', label: 'Porcentaje (%)' },
];

const PoliciesPage: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessId, setBusinessId] = useState<number | null>(null);

  const [depositType, setDepositType] = useState<ChargeType>('NONE');
  const [depositValue, setDepositValue] = useState('0');
  const [currency, setCurrency] = useState('MXN');
  const [cancellationWindowHours, setCancellationWindowHours] = useState(24);
  const [cancellationFeeType, setCancellationFeeType] =
    useState<ChargeType>('NONE');
  const [cancellationFeeValue, setCancellationFeeValue] = useState('0');
  const [policyText, setPolicyText] = useState('');

  const init = useCallback(async () => {
    try {
      const businesses = await businessesApi.getMine();
      if (businesses.length > 0) {
        const bid = businesses[0].id;
        setBusinessId(bid);
        const p = await policiesApi.getPolicy(bid);
        setDepositType(p.depositType);
        setDepositValue(p.depositValue);
        setCurrency(p.currency);
        setCancellationWindowHours(p.cancellationWindowHours);
        setCancellationFeeType(p.cancellationFeeType);
        setCancellationFeeValue(p.cancellationFeeValue);
        setPolicyText(p.policyText ?? '');
      }
    } catch (error) {
      console.error('Error loading policy:', error);
      showToast('No se pudo cargar la política', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void init();
  }, [init]);

  const save = async () => {
    if (!businessId) return;
    setSaving(true);
    try {
      await policiesApi.upsertPolicy(businessId, {
        depositType,
        depositValue: Number(depositValue) || 0,
        currency: currency.trim().toUpperCase() || 'MXN',
        cancellationWindowHours,
        cancellationFeeType,
        cancellationFeeValue: Number(cancellationFeeValue) || 0,
        policyText: policyText.trim(),
      });
      showToast('Política guardada', 'success');
    } catch (error) {
      console.error('Error saving policy:', error);
      showToast('Error al guardar la política', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!businessId) {
    return (
      <div style={styles.container}>
        <Card>
          <div style={styles.emptyState}>
            <FileText size={48} color="#e91e8c" />
            <p style={styles.emptyText}>
              No tienes un negocio registrado todavía.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const depositUnit =
    depositType === 'PERCENT' ? '%' : depositType === 'FIXED' ? 'MXN' : '';
  const cancelUnit =
    cancellationFeeType === 'PERCENT'
      ? '%'
      : cancellationFeeType === 'FIXED'
        ? 'MXN'
        : '';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Políticas de anticipo y cancelación</h1>
        <p style={styles.subtitle}>
          Define los anticipos y condiciones que comunicarás al cliente. Por
          ahora, los pagos y cargos se reciben por efectivo o transferencia y
          se registran manualmente en la cita; no se realizan cobros
          automáticos.
        </p>
      </div>

      <Card>
        <h2 style={styles.sectionTitle}>Anticipo requerido</h2>
        <div style={styles.grid}>
          <label style={styles.fieldLabel}>
            Tipo de anticipo
            <select
              style={styles.select}
              value={depositType}
              onChange={(e) => setDepositType(e.target.value as ChargeType)}
            >
              {CHARGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {depositType !== 'NONE' && (
            <Input
              label={`Valor del anticipo (${depositUnit})`}
              type="number"
              min="0"
              max={depositType === 'PERCENT' ? 100 : undefined}
              step="0.01"
              value={depositValue}
              onChange={(e) => setDepositValue(e.target.value)}
            />
          )}
          <Input label="Moneda" value={currency} disabled />
        </div>
      </Card>

      <Card style={{ marginTop: '1rem' }}>
        <h2 style={styles.sectionTitle}>Cancelación</h2>
        <div style={styles.grid}>
          <Input
            label="Ventana de cancelación (horas)"
            type="number"
            min={0}
            max={720}
            value={cancellationWindowHours}
            onChange={(e) =>
              setCancellationWindowHours(Number(e.target.value))
            }
          />
          <label style={styles.fieldLabel}>
            Tipo de cargo por cancelación
            <select
              style={styles.select}
              value={cancellationFeeType}
              onChange={(e) =>
                setCancellationFeeType(e.target.value as ChargeType)
              }
            >
              {CHARGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {cancellationFeeType !== 'NONE' && (
            <Input
              label={`Valor del cargo (${cancelUnit})`}
              type="number"
              min="0"
              max={cancellationFeeType === 'PERCENT' ? 100 : undefined}
              step="0.01"
              value={cancellationFeeValue}
              onChange={(e) => setCancellationFeeValue(e.target.value)}
            />
          )}
        </div>
      </Card>

      <Card style={{ marginTop: '1rem' }}>
        <label style={styles.fieldLabel}>
          Texto de la política (visible para tus clientes)
          <textarea
            style={styles.textarea}
            rows={5}
            maxLength={5000}
            value={policyText}
            onChange={(e) => setPolicyText(e.target.value)}
            placeholder="Ej. Se requiere un anticipo del 20% para reservar. Las cancelaciones con menos de 24 horas de anticipación tienen un cargo…"
          />
        </label>
      </Card>

      <div style={styles.actions}>
        <Button onClick={save} disabled={saving}>
          Guardar políticas
        </Button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '760px', margin: '0 auto' },
  header: { marginBottom: '1.25rem' },
  title: { fontSize: '2rem', fontWeight: 700, color: '#1a1a2e', margin: 0 },
  subtitle: { fontSize: '0.95rem', color: '#6b7280', marginTop: '0.2rem' },
  sectionTitle: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: '1rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    alignItems: 'end',
  },
  fieldLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#1a1a2e',
  },
  select: {
    padding: '0.7rem 1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '0.95rem',
    color: '#1a1a2e',
    outline: 'none',
    background: '#fff',
  },
  textarea: {
    padding: '0.7rem 1rem',
    fontSize: '0.95rem',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    color: '#1a1a2e',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '1.25rem',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    padding: '3rem 1rem',
  },
  emptyText: { fontSize: '0.95rem', color: '#6b7280', margin: 0 },
};

export default PoliciesPage;
