import React, { useCallback, useEffect, useState } from 'react';
import * as businessesApi from '../api/businesses';
import * as remindersApi from '../api/reminders';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import type { ReminderSetting, WhatsappReminderAttempt } from '../types';
import { format } from 'date-fns';
import { MessageCircle, ShieldCheck } from 'lucide-react';

const ATTEMPT_META: Record<string, { label: string; bg: string; color: string }> =
  {
    PENDING: { label: 'Pendiente', bg: '#fef3c7', color: '#92400e' },
    SENT: { label: 'Enviado', bg: '#d1fae5', color: '#065f46' },
    FAILED: { label: 'Fallido', bg: '#fee2e2', color: '#991b1b' },
    SKIPPED: { label: 'Omitido', bg: '#f3f4f6', color: '#374151' },
  };

const DEFAULT_TEMPLATE =
  'Hola {cliente}, te recordamos tu cita en {negocio} el {fecha} a las {hora}. ¡Te esperamos!';

const RemindersPage: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [settings, setSettings] = useState<ReminderSetting | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [hoursBefore, setHoursBefore] = useState(24);
  const [template, setTemplate] = useState('');
  const [attempts, setAttempts] = useState<WhatsappReminderAttempt[]>([]);
  const [saving, setSaving] = useState(false);

  const init = useCallback(async () => {
    try {
      const businesses = await businessesApi.getMine();
      if (businesses.length > 0) {
        const bid = businesses[0].id;
        setBusinessId(bid);
        const [s, a] = await Promise.all([
          remindersApi.getSettings(bid),
          remindersApi.listAttempts(bid, 1, 20),
        ]);
        setSettings(s);
        setEnabled(s.whatsappEnabled);
        setHoursBefore(s.hoursBefore);
        setTemplate(s.messageTemplate ?? '');
        setAttempts(a.data);
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
      showToast('No se pudieron cargar los recordatorios', 'error');
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
      const updated = await remindersApi.upsertSettings(businessId, {
        whatsappEnabled: enabled,
        hoursBefore,
        messageTemplate: template.trim() || undefined,
      });
      setSettings(updated);
      showToast('Configuración guardada', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Error al guardar la configuración', 'error');
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
            <MessageCircle size={48} color="#e91e8c" />
            <p style={styles.emptyText}>
              No tienes un negocio registrado todavía.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Recordatorios por WhatsApp</h1>
        <p style={styles.subtitle}>
          Configura los recordatorios automáticos para tus clientes.
        </p>
      </div>

      {/* Privacy notice */}
      <Card style={{ background: '#f0fdf4', marginBottom: '1.25rem' }}>
        <div style={styles.notice}>
          <ShieldCheck size={22} color="#065f46" />
          <p style={styles.noticeText}>
            La conexión con el proveedor de WhatsApp la gestiona la plataforma
            de forma segura. Aquí no se solicitan ni se muestran credenciales ni
            tokens. El envío sólo ocurre cuando tu negocio y el proveedor global
            están habilitados.
          </p>
        </div>
      </Card>

      <Card>
        <div style={styles.form}>
          <label style={styles.switchRow}>
            <span style={styles.switchLabel}>
              Activar recordatorios por WhatsApp
            </span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              style={styles.checkbox}
              aria-label="Activar recordatorios por WhatsApp"
            />
          </label>

          <Input
            label="Horas de anticipación (1-168)"
            type="number"
            min={1}
            max={168}
            value={hoursBefore}
            onChange={(e) => setHoursBefore(Number(e.target.value))}
          />

          <label style={styles.fieldLabel}>
            Plantilla del mensaje
            <textarea
              style={styles.textarea}
              rows={4}
              maxLength={1000}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder={DEFAULT_TEMPLATE}
            />
            <span style={styles.hint}>
              Puedes usar variables como {'{cliente}'}, {'{negocio}'},{' '}
              {'{fecha}'} y {'{hora}'}. Máx. 1000 caracteres.
            </span>
          </label>

          <div style={styles.statusRow}>
            <span
              style={{
                ...styles.statusPill,
                background: settings?.whatsappEnabled ? '#d1fae5' : '#f3f4f6',
                color: settings?.whatsappEnabled ? '#065f46' : '#374151',
              }}
            >
              Negocio:{' '}
              {settings?.whatsappEnabled ? 'Activado' : 'Desactivado'}
            </span>
            <span
              style={{
                ...styles.statusPill,
                background: settings?.providerEnabled ? '#d1fae5' : '#fef3c7',
                color: settings?.providerEnabled ? '#065f46' : '#92400e',
              }}
            >
              Proveedor:{' '}
              {settings?.providerEnabled ? 'Disponible' : 'No configurado'}
            </span>
          </div>
          {settings?.whatsappEnabled && !settings.providerEnabled && (
            <p style={styles.providerWarning} role="status">
              Tu preferencia quedó guardada, pero no se enviarán mensajes hasta
              que el operador habilite el proveedor global.
            </p>
          )}

          <div style={styles.actions}>
            <Button onClick={save} disabled={saving}>
              Guardar configuración
            </Button>
          </div>
        </div>
      </Card>

      {/* Attempts log */}
      <div style={styles.logSection}>
        <h2 style={styles.sectionTitle}>Últimos envíos</h2>
        {attempts.length === 0 ? (
          <Card>
            <p style={styles.emptyText}>Aún no hay intentos de envío.</p>
          </Card>
        ) : (
          <div style={styles.logList}>
            {attempts.map((a) => {
              const meta = ATTEMPT_META[a.status] ?? ATTEMPT_META.PENDING;
              return (
                <Card key={a.id} style={{ padding: '0.85rem 1rem' }}>
                  <div style={styles.logRow}>
                    <span style={styles.logAppt}>Cita #{a.appointmentId}</span>
                    <span
                      style={{
                        ...styles.attemptBadge,
                        background: meta.bg,
                        color: meta.color,
                      }}
                    >
                      {meta.label}
                    </span>
                    <span style={styles.logDate}>
                      {format(new Date(a.createdAt), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                  {a.sanitizedError && (
                    <p style={styles.logError}>{a.sanitizedError}</p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '760px', margin: '0 auto' },
  header: { marginBottom: '1.25rem' },
  title: { fontSize: '2rem', fontWeight: 700, color: '#1a1a2e', margin: 0 },
  subtitle: { fontSize: '0.95rem', color: '#6b7280', marginTop: '0.2rem' },
  notice: { display: 'flex', gap: '0.75rem', alignItems: 'flex-start' },
  noticeText: { fontSize: '0.88rem', color: '#065f46', margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  switchRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },
  switchLabel: { fontSize: '0.95rem', fontWeight: 600, color: '#1a1a2e' },
  checkbox: { width: '20px', height: '20px', cursor: 'pointer' },
  fieldLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#1a1a2e',
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
  hint: { fontSize: '0.78rem', color: '#9ca3af', fontWeight: 400 },
  statusRow: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  providerWarning: {
    margin: 0,
    padding: '0.65rem 0.8rem',
    borderRadius: '8px',
    background: '#fffbeb',
    color: '#92400e',
    fontSize: '0.82rem',
  },
  statusPill: {
    padding: '0.3rem 0.8rem',
    borderRadius: '20px',
    fontSize: '0.82rem',
    fontWeight: 600,
  },
  actions: { display: 'flex', justifyContent: 'flex-end' },
  logSection: { marginTop: '1.75rem' },
  sectionTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: '0.75rem',
  },
  logList: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  logRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  logAppt: { fontSize: '0.9rem', fontWeight: 600, color: '#1a1a2e' },
  attemptBadge: {
    padding: '0.15rem 0.6rem',
    borderRadius: '20px',
    fontSize: '0.72rem',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  logDate: { marginLeft: 'auto', fontSize: '0.8rem', color: '#9ca3af' },
  logError: { fontSize: '0.8rem', color: '#991b1b', marginTop: '0.4rem' },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    padding: '3rem 1rem',
  },
  emptyText: { fontSize: '0.95rem', color: '#6b7280', margin: 0 },
};

export default RemindersPage;
