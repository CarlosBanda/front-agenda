import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as businessesApi from '../api/businesses';
import * as agendaApi from '../api/agenda';
import * as appointmentsApi from '../api/appointments';
import * as servicesApi from '../api/services';
import * as staffApi from '../api/staff';
import * as crmApi from '../api/crm';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import type {
  Appointment,
  Client,
  Service,
  Staff,
} from '../types';
import { AppointmentStatus, DepositStatus, QuickAction } from '../types';
import { addDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Plus,
  Scissors,
  User,
  UserX,
  Users,
  XCircle,
} from 'lucide-react';

type ViewMode = 'day' | 'week';

const STATUS_META: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  PENDING: { label: 'Pendiente', bg: '#fef3c7', color: '#92400e' },
  CONFIRMED: { label: 'Confirmada', bg: '#dbeafe', color: '#1e40af' },
  COMPLETED: { label: 'Completada', bg: '#d1fae5', color: '#065f46' },
  CANCELLED: { label: 'Cancelada', bg: '#fee2e2', color: '#991b1b' },
  NO_SHOW: { label: 'No asistió', bg: '#f3f4f6', color: '#374151' },
};

const DEPOSIT_META: Record<string, { label: string; color: string }> = {
  NOT_REQUIRED: { label: 'Sin anticipo', color: '#6b7280' },
  PENDING: { label: 'Anticipo pendiente', color: '#92400e' },
  PAID: { label: 'Anticipo pagado', color: '#065f46' },
  WAIVED: { label: 'Anticipo exonerado', color: '#1e40af' },
  REFUNDED: { label: 'Anticipo reembolsado', color: '#7c2d12' },
};

const formatMoney = (value?: string | null): string => {
  if (value == null) return '$0.00';
  const n = Number(value);
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(Number.isFinite(n) ? n : 0);
};

const clientName = (apt: Appointment): string =>
  apt.clientRecord?.name ||
  apt.client?.name ||
  (apt.clientRecordId
    ? `Cliente #${apt.clientRecordId}`
    : apt.clientId
      ? `Cliente #${apt.clientId}`
      : 'Cliente');

const BusinessAppointmentsPage: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [view, setView] = useState<ViewMode>('day');
  const [anchor, setAnchor] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staffFilter, setStaffFilter] = useState<number | ''>('');
  const [fetching, setFetching] = useState(false);

  // Deposit modal
  const [depositApt, setDepositApt] = useState<Appointment | null>(null);
  // Create modal
  const [createOpen, setCreateOpen] = useState(false);

  const loadBusiness = useCallback(async () => {
    try {
      const businesses = await businessesApi.getMine();
      if (businesses.length > 0) {
        const biz = businesses[0];
        setBusinessId(biz.id);
        const [stf, svc] = await Promise.all([
          staffApi.getByBusiness(biz.id),
          servicesApi.getByBusiness(biz.id),
        ]);
        setStaffList(stf);
        setServices(svc);
      }
    } catch (error) {
      console.error('Error loading business:', error);
      showToast('No se pudo cargar el negocio', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadAgenda = useCallback(async () => {
    if (!businessId) return;
    setFetching(true);
    try {
      const staffId = staffFilter === '' ? undefined : staffFilter;
      const res =
        view === 'day'
          ? await agendaApi.getDay(businessId, anchor, staffId)
          : await agendaApi.getWeek(businessId, anchor, staffId);
      setAppointments(res.appointments);
    } catch (error) {
      console.error('Error loading agenda:', error);
      showToast('No se pudo cargar la agenda', 'error');
    } finally {
      setFetching(false);
    }
  }, [businessId, anchor, view, staffFilter, showToast]);

  useEffect(() => {
    void loadBusiness();
  }, [loadBusiness]);

  useEffect(() => {
    void loadAgenda();
  }, [loadAgenda]);

  const handleQuickAction = async (id: number, action: QuickAction) => {
    try {
      const updated = await agendaApi.quickAction(id, action);
      setAppointments((prev) =>
        prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)),
      );
      showToast('Cita actualizada', 'success');
    } catch (error) {
      console.error('Error updating appointment:', error);
      showToast('Error al actualizar la cita', 'error');
    }
  };

  const upsertLocal = (updated: Appointment) => {
    setAppointments((prev) => {
      const exists = prev.some((a) => a.id === updated.id);
      return exists
        ? prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
        : [...prev, updated];
    });
  };

  const weekDays = useMemo(() => {
    const base = parseISO(anchor);
    const dow = base.getDay(); // 0 = Sunday
    const offsetToMonday = (dow + 6) % 7;
    const monday = addDays(base, -offsetToMonday);
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [anchor]);

  const summary = useMemo(() => {
    const acc = {
      total: appointments.length,
      PENDING: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      NO_SHOW: 0,
      depositsPending: 0,
      depositsPaid: 0,
    };
    for (const a of appointments) {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      if (a.depositStatus === DepositStatus.PENDING) acc.depositsPending++;
      if (a.depositStatus === DepositStatus.PAID) acc.depositsPaid++;
    }
    return acc;
  }, [appointments]);

  const shiftAnchor = (delta: number) => {
    const step = view === 'day' ? delta : delta * 7;
    setAnchor(format(addDays(parseISO(anchor), step), 'yyyy-MM-dd'));
  };

  if (loading) return <LoadingSpinner />;

  if (!businessId) {
    return (
      <div style={styles.container}>
        <Card>
          <div style={styles.emptyState}>
            <Calendar size={48} color="#e91e8c" />
            <p style={styles.emptyText}>
              No tienes un negocio registrado todavía.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const rangeLabel =
    view === 'day'
      ? format(parseISO(anchor), "EEEE, d 'de' MMMM yyyy", { locale: es })
      : `${format(weekDays[0], "d MMM", { locale: es })} — ${format(
          weekDays[6],
          "d MMM yyyy",
          { locale: es },
        )}`;

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Agenda</h1>
          <p style={styles.subtitle} aria-live="polite">
            {rangeLabel}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Nueva cita
        </Button>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <div style={styles.viewToggle} role="tablist" aria-label="Modo de vista">
          <button
            role="tab"
            aria-selected={view === 'day'}
            style={{
              ...styles.toggleBtn,
              ...(view === 'day' ? styles.toggleBtnActive : {}),
            }}
            onClick={() => setView('day')}
          >
            Día
          </button>
          <button
            role="tab"
            aria-selected={view === 'week'}
            style={{
              ...styles.toggleBtn,
              ...(view === 'week' ? styles.toggleBtnActive : {}),
            }}
            onClick={() => setView('week')}
          >
            Semana
          </button>
        </div>

        <div style={styles.navGroup}>
          <button
            style={styles.iconBtn}
            onClick={() => shiftAnchor(-1)}
            aria-label={view === 'day' ? 'Día anterior' : 'Semana anterior'}
          >
            <ChevronLeft size={18} />
          </button>
          <input
            type="date"
            value={anchor}
            onChange={(e) => setAnchor(e.target.value || anchor)}
            style={styles.dateInput}
            aria-label="Fecha de referencia"
          />
          <button
            style={styles.iconBtn}
            onClick={() => shiftAnchor(1)}
            aria-label={view === 'day' ? 'Día siguiente' : 'Semana siguiente'}
          >
            <ChevronRight size={18} />
          </button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setAnchor(format(new Date(), 'yyyy-MM-dd'))}
          >
            Hoy
          </Button>
        </div>

        <select
          value={staffFilter}
          onChange={(e) =>
            setStaffFilter(e.target.value === '' ? '' : Number(e.target.value))
          }
          style={styles.select}
          aria-label="Filtrar por miembro del staff"
        >
          <option value="">Todo el staff</option>
          {staffList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div style={styles.summaryGrid}>
        <SummaryChip label="Total" value={summary.total} color="#e91e8c" />
        <SummaryChip
          label="Pendientes"
          value={summary.PENDING}
          color="#92400e"
        />
        <SummaryChip
          label="Confirmadas"
          value={summary.CONFIRMED}
          color="#1e40af"
        />
        <SummaryChip
          label="Completadas"
          value={summary.COMPLETED}
          color="#065f46"
        />
        <SummaryChip
          label="Anticipos pend."
          value={summary.depositsPending}
          color="#b45309"
        />
      </div>

      {fetching && <LoadingSpinner size={28} />}

      {/* Content */}
      {view === 'day' ? (
        <DayColumn
          date={anchor}
          appointments={[...appointments].sort((a, b) =>
            a.startTime.localeCompare(b.startTime),
          )}
          onQuickAction={handleQuickAction}
          onDeposit={setDepositApt}
        />
      ) : (
        <div style={styles.weekGrid}>
          {weekDays.map((day) => {
            const dstr = format(day, 'yyyy-MM-dd');
            const dayApts = appointments
              .filter((a) => a.date === dstr)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            return (
              <div key={dstr} style={styles.weekCol}>
                <div style={styles.weekColHeader}>
                  <span style={styles.weekColDay}>
                    {format(day, 'EEE', { locale: es })}
                  </span>
                  <span style={styles.weekColDate}>{format(day, 'd')}</span>
                  <span style={styles.weekColCount}>{dayApts.length}</span>
                </div>
                <div style={styles.weekColBody}>
                  {dayApts.length === 0 ? (
                    <p style={styles.weekEmpty}>—</p>
                  ) : (
                    dayApts.map((apt) => (
                      <CompactCard
                        key={apt.id}
                        apt={apt}
                        onQuickAction={handleQuickAction}
                        onDeposit={setDepositApt}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {depositApt && (
        <DepositModal
          apt={depositApt}
          onClose={() => setDepositApt(null)}
          onSaved={(updated) => {
            upsertLocal(updated);
            setDepositApt(null);
          }}
        />
      )}

      {createOpen && (
        <CreateAppointmentModal
          businessId={businessId}
          services={services}
          staffList={staffList}
          defaultDate={anchor}
          onClose={() => setCreateOpen(false)}
          onCreated={(apt) => {
            setCreateOpen(false);
            showToast('Cita creada', 'success');
            void loadAgenda();
            void apt;
          }}
        />
      )}
    </div>
  );
};

// --- Summary chip -----------------------------------------------------------
const SummaryChip: React.FC<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => (
  <Card style={{ padding: '0.85rem 1rem' }}>
    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>{label}</p>
    <p style={{ fontSize: '1.5rem', fontWeight: 700, color, margin: 0 }}>
      {value}
    </p>
  </Card>
);

// --- Status badge -----------------------------------------------------------
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const meta = STATUS_META[status] ?? STATUS_META.PENDING;
  return (
    <span
      style={{
        backgroundColor: meta.bg,
        color: meta.color,
        padding: '0.2rem 0.6rem',
        borderRadius: '20px',
        fontSize: '0.7rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
      }}
    >
      {meta.label}
    </span>
  );
};

// --- Quick actions ----------------------------------------------------------
const QuickActions: React.FC<{
  apt: Appointment;
  onQuickAction: (id: number, action: QuickAction) => void;
  onDeposit: (apt: Appointment) => void;
}> = ({ apt, onQuickAction, onDeposit }) => {
  const isPending = apt.status === AppointmentStatus.PENDING;
  const isConfirmed = apt.status === AppointmentStatus.CONFIRMED;
  const open = isPending || isConfirmed;
  return (
    <div style={styles.actions}>
      {isPending && (
        <Button
          size="sm"
          onClick={() => onQuickAction(apt.id, QuickAction.CONFIRM)}
        >
          <CheckCircle size={14} /> Confirmar
        </Button>
      )}
      {isConfirmed && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onQuickAction(apt.id, QuickAction.COMPLETE)}
        >
          <CheckCircle size={14} /> Completar
        </Button>
      )}
      {open && (
        <>
          <Button
            size="sm"
            variant="danger"
            onClick={() => onQuickAction(apt.id, QuickAction.CANCEL)}
          >
            <XCircle size={14} /> Cancelar
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onQuickAction(apt.id, QuickAction.NO_SHOW)}
          >
            <UserX size={14} /> No asistió
          </Button>
        </>
      )}
      <Button size="sm" variant="secondary" onClick={() => onDeposit(apt)}>
        <DollarSign size={14} /> Anticipo
      </Button>
    </div>
  );
};

// --- Day column (full cards) ------------------------------------------------
const DayColumn: React.FC<{
  date: string;
  appointments: Appointment[];
  onQuickAction: (id: number, action: QuickAction) => void;
  onDeposit: (apt: Appointment) => void;
}> = ({ appointments, onQuickAction, onDeposit }) => {
  if (appointments.length === 0) {
    return (
      <Card>
        <div style={styles.emptyState}>
          <Calendar size={48} color="#e91e8c" />
          <p style={styles.emptyText}>No hay citas para esta fecha</p>
        </div>
      </Card>
    );
  }
  return (
    <div style={styles.list}>
      {appointments.map((apt) => (
        <Card key={apt.id}>
          <div style={styles.aptItem}>
            <div style={styles.aptInfo}>
              <div style={styles.aptRow}>
                <Clock size={16} color="#6b7280" />
                <strong style={styles.aptTime}>
                  {apt.startTime?.slice(0, 5)} - {apt.endTime?.slice(0, 5)}
                </strong>
                <StatusBadge status={apt.status} />
              </div>
              <div style={styles.aptRow}>
                <User size={16} color="#e91e8c" />
                <span style={styles.aptLabel}>{clientName(apt)}</span>
              </div>
              <div style={styles.aptRow}>
                <Scissors size={16} color="#9c27b0" />
                <span style={styles.aptLabel}>
                  {apt.service?.name || `Servicio #${apt.serviceId}`}
                </span>
              </div>
              <div style={styles.aptRow}>
                <Users size={16} color="#6b7280" />
                <span style={styles.aptLabel}>
                  {apt.staff?.name || 'Sin asignar'}
                </span>
              </div>
              {apt.depositStatus &&
                apt.depositStatus !== DepositStatus.NOT_REQUIRED && (
                  <div style={styles.aptRow}>
                    <DollarSign size={16} color="#b45309" />
                    <span
                      style={{
                        ...styles.aptLabel,
                        color: DEPOSIT_META[apt.depositStatus]?.color,
                        fontWeight: 600,
                      }}
                    >
                      {DEPOSIT_META[apt.depositStatus]?.label} ·{' '}
                      {formatMoney(apt.depositAmount)}
                    </span>
                  </div>
                )}
            </div>
            <QuickActions
              apt={apt}
              onQuickAction={onQuickAction}
              onDeposit={onDeposit}
            />
          </div>
        </Card>
      ))}
    </div>
  );
};

// --- Compact card (week view) ----------------------------------------------
const CompactCard: React.FC<{
  apt: Appointment;
  onQuickAction: (id: number, action: QuickAction) => void;
  onDeposit: (apt: Appointment) => void;
}> = ({ apt, onQuickAction, onDeposit }) => {
  const meta = STATUS_META[apt.status] ?? STATUS_META.PENDING;
  return (
    <div style={{ ...styles.compact, borderLeft: `4px solid ${meta.color}` }}>
      <div style={styles.compactTime}>{apt.startTime?.slice(0, 5)}</div>
      <div style={styles.compactName}>{clientName(apt)}</div>
      <div style={styles.compactSvc}>
        {apt.service?.name || `Servicio #${apt.serviceId}`}
      </div>
      <div style={styles.compactActions}>
        {apt.status === AppointmentStatus.PENDING && (
          <button
            style={styles.miniBtn}
            title="Confirmar"
            aria-label="Confirmar"
            onClick={() => onQuickAction(apt.id, QuickAction.CONFIRM)}
          >
            <CheckCircle size={14} color="#065f46" />
          </button>
        )}
        {(apt.status === AppointmentStatus.PENDING ||
          apt.status === AppointmentStatus.CONFIRMED) && (
          <>
            {apt.status === AppointmentStatus.CONFIRMED && (
              <button
                style={styles.miniBtn}
                title="Completar"
                aria-label="Completar"
                onClick={() => onQuickAction(apt.id, QuickAction.COMPLETE)}
              >
                <CheckCircle size={14} color="#1e40af" />
              </button>
            )}
            <button
              style={styles.miniBtn}
              title="Cancelar"
              aria-label="Cancelar"
              onClick={() => onQuickAction(apt.id, QuickAction.CANCEL)}
            >
              <XCircle size={14} color="#991b1b" />
            </button>
          </>
        )}
        <button
          style={styles.miniBtn}
          title="Anticipo"
          aria-label="Gestionar anticipo"
          onClick={() => onDeposit(apt)}
        >
          <DollarSign size={14} color="#b45309" />
        </button>
      </div>
    </div>
  );
};

// --- Deposit modal ----------------------------------------------------------
const DepositModal: React.FC<{
  apt: Appointment;
  onClose: () => void;
  onSaved: (updated: Appointment) => void;
}> = ({ apt, onClose, onSaved }) => {
  const { showToast } = useToast();
  const [status, setStatus] = useState<DepositStatus>(
    apt.depositStatus ?? DepositStatus.PENDING,
  );
  const [amount, setAmount] = useState(apt.depositAmount ?? '');
  const [paidAmount, setPaidAmount] = useState(apt.depositPaidAmount ?? '');
  const [method, setMethod] = useState(apt.depositMethod ?? '');
  const [note, setNote] = useState(apt.depositNote ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await agendaApi.setDeposit(apt.id, {
        status,
        amount: amount === '' ? undefined : Number(amount),
        paidAmount: paidAmount === '' ? undefined : Number(paidAmount),
        method: method.trim(),
        note: note.trim(),
      });
      showToast('Anticipo actualizado', 'success');
      onSaved(updated);
    } catch (error) {
      console.error('Error saving deposit:', error);
      showToast('Error al guardar el anticipo', 'error');
    } finally {
      setSaving(false);
    }
  };

  const applyPolicy = async () => {
    setSaving(true);
    try {
      const updated = await agendaApi.applyPolicyDeposit(apt.id);
      showToast('Anticipo calculado según política', 'success');
      setStatus(updated.depositStatus ?? DepositStatus.PENDING);
      setAmount(updated.depositAmount ?? '');
    } catch (error) {
      console.error('Error applying policy:', error);
      showToast('Error al aplicar la política', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Registrar anticipo">
      <div style={styles.formCol}>
        <p style={styles.modalMeta}>
          {clientName(apt)} · {apt.date} {apt.startTime?.slice(0, 5)}
        </p>
        <label style={styles.fieldLabel}>
          Estado del anticipo
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as DepositStatus)}
            style={styles.select}
          >
            <option value={DepositStatus.NOT_REQUIRED}>No requerido</option>
            <option value={DepositStatus.PENDING}>Pendiente</option>
            <option value={DepositStatus.PAID}>Pagado</option>
            <option value={DepositStatus.WAIVED}>Exonerado</option>
            <option value={DepositStatus.REFUNDED}>Reembolsado</option>
          </select>
        </label>
        <Input
          label="Monto requerido (MXN)"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {status === DepositStatus.PAID && (
          <Input
            label="Monto pagado (MXN)"
            type="number"
            min="0.01"
            max={amount === '' ? undefined : amount}
            step="0.01"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
          />
        )}
        <Input
          label="Método (efectivo, transferencia...)"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          maxLength={40}
        />
        <label style={styles.fieldLabel}>
          Nota
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={styles.textarea}
            maxLength={255}
            rows={2}
          />
        </label>
        <div style={styles.modalActions}>
          <Button
            variant="secondary"
            onClick={applyPolicy}
            disabled={
              saving ||
              apt.depositStatus === DepositStatus.PAID ||
              apt.depositStatus === DepositStatus.REFUNDED
            }
          >
            Aplicar política
          </Button>
          <Button onClick={save} disabled={saving}>
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// --- Create appointment modal ----------------------------------------------
const CreateAppointmentModal: React.FC<{
  businessId: number;
  services: Service[];
  staffList: Staff[];
  defaultDate: string;
  onClose: () => void;
  onCreated: (apt: Appointment) => void;
}> = ({ businessId, services, staffList, defaultDate, onClose, onCreated }) => {
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientRecordId, setClientRecordId] = useState<number | ''>('');
  const [serviceId, setServiceId] = useState<number | ''>('');
  const [staffId, setStaffId] = useState<number | ''>('');
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    crmApi
      .listClients(businessId, { limit: 100 })
      .then((res) => setClients(res.data))
      .catch(() => setClients([]));
  }, [businessId]);

  const submit = async () => {
    if (clientRecordId === '' || serviceId === '') {
      showToast('Selecciona cliente y servicio', 'warning');
      return;
    }
    setSaving(true);
    try {
      const apt = await appointmentsApi.createByBusiness({
        date,
        startTime,
        businessId,
        serviceId: Number(serviceId),
        staffId: staffId === '' ? undefined : Number(staffId),
        notes: notes.trim() || undefined,
        clientRecordId: Number(clientRecordId),
      });
      onCreated(apt);
    } catch (error) {
      console.error('Error creating appointment:', error);
      showToast('No se pudo crear la cita', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Nueva cita">
      <div style={styles.formCol}>
        <label style={styles.fieldLabel}>
          Cliente (CRM)
          <select
            value={clientRecordId}
            onChange={(e) =>
              setClientRecordId(
                e.target.value === '' ? '' : Number(e.target.value),
              )
            }
            style={styles.select}
          >
            <option value="">Selecciona un cliente…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.phone ? ` · ${c.phone}` : ''}
              </option>
            ))}
          </select>
          {clients.length === 0 && (
            <span style={styles.hint}>
              No hay clientes en el CRM. Agrégalos desde la sección Clientes.
            </span>
          )}
        </label>
        <label style={styles.fieldLabel}>
          Servicio
          <select
            value={serviceId}
            onChange={(e) =>
              setServiceId(e.target.value === '' ? '' : Number(e.target.value))
            }
            style={styles.select}
          >
            <option value="">Selecciona un servicio…</option>
            {services
              .filter((s) => s.isActive)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {formatMoney(String(s.price))}
                </option>
              ))}
          </select>
        </label>
        <label style={styles.fieldLabel}>
          Staff (opcional)
          <select
            value={staffId}
            onChange={(e) =>
              setStaffId(e.target.value === '' ? '' : Number(e.target.value))
            }
            style={styles.select}
          >
            <option value="">Sin asignar</option>
            {staffList
              .filter((s) => s.isActive)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </label>
        <div style={styles.formRow}>
          <Input
            label="Fecha"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            label="Hora"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <label style={styles.fieldLabel}>
          Notas
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={styles.textarea}
            rows={2}
          />
        </label>
        <div style={styles.modalActions}>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            Crear cita
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '1rem',
  },
  title: { fontSize: '2rem', fontWeight: 700, color: '#1a1a2e', margin: 0 },
  subtitle: {
    fontSize: '0.95rem',
    color: '#6b7280',
    marginTop: '0.2rem',
    textTransform: 'capitalize',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '1.25rem',
  },
  viewToggle: {
    display: 'inline-flex',
    background: '#fff',
    borderRadius: '10px',
    padding: '0.25rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  toggleBtn: {
    border: 'none',
    background: 'transparent',
    padding: '0.4rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#6b7280',
  },
  toggleBtnActive: {
    background: 'linear-gradient(135deg, #e91e8c, #9c27b0)',
    color: '#fff',
  },
  navGroup: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  iconBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
    background: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#1a1a2e',
  },
  dateInput: {
    padding: '0.5rem 0.75rem',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '0.9rem',
    color: '#1a1a2e',
    outline: 'none',
  },
  select: {
    padding: '0.5rem 0.75rem',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '0.9rem',
    color: '#1a1a2e',
    outline: 'none',
    background: '#fff',
    width: '100%',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  aptItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  aptInfo: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  aptRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  aptTime: { fontSize: '0.95rem', color: '#1a1a2e' },
  aptLabel: { fontSize: '0.9rem', color: '#1a1a2e' },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    alignItems: 'flex-end',
  },
  weekGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '0.75rem',
    alignItems: 'start',
  },
  weekCol: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    minHeight: '120px',
  },
  weekColHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.6rem 0.75rem',
    background: '#fdf2f8',
    borderBottom: '1px solid #f3d4e6',
  },
  weekColDay: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#9c27b0',
    textTransform: 'capitalize',
  },
  weekColDate: { fontSize: '0.9rem', fontWeight: 700, color: '#1a1a2e' },
  weekColCount: {
    marginLeft: 'auto',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#fff',
    background: '#e91e8c',
    borderRadius: '20px',
    padding: '0.05rem 0.5rem',
  },
  weekColBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.5rem',
  },
  weekEmpty: {
    textAlign: 'center',
    color: '#d1d5db',
    fontSize: '0.85rem',
    margin: '0.5rem 0',
  },
  compact: {
    background: '#fafafa',
    borderRadius: '8px',
    padding: '0.5rem 0.6rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  compactTime: { fontSize: '0.8rem', fontWeight: 700, color: '#1a1a2e' },
  compactName: { fontSize: '0.85rem', color: '#1a1a2e', fontWeight: 600 },
  compactSvc: { fontSize: '0.75rem', color: '#6b7280' },
  compactActions: { display: 'flex', gap: '0.3rem', marginTop: '0.2rem' },
  miniBtn: {
    border: '1px solid #e5e7eb',
    background: '#fff',
    borderRadius: '6px',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    padding: '3rem 1rem',
  },
  emptyText: { fontSize: '1rem', color: '#6b7280', margin: 0 },
  formCol: { display: 'flex', flexDirection: 'column', gap: '0.9rem' },
  formRow: { display: 'flex', gap: '0.75rem' },
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
  modalMeta: { fontSize: '0.85rem', color: '#6b7280', margin: 0 },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  hint: { fontSize: '0.78rem', color: '#9ca3af', fontWeight: 400 },
};

export default BusinessAppointmentsPage;
