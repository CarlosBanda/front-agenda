import React, { useEffect, useState } from 'react';
import * as businessesApi from '../api/businesses';
import * as schedulesApi from '../api/schedules';
import type { CreateScheduleDto, CreateBlockedSlotDto } from '../api/schedules';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import type { Schedule, BlockedSlot } from '../types';
import { DayOfWeek } from '../types';
import { format } from 'date-fns';
import { Clock, Plus, Trash2, Calendar, Ban } from 'lucide-react';

const DAYS_ORDER: DayOfWeek[] = [
  DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY,
];

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Lunes', TUESDAY: 'Martes', WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves', FRIDAY: 'Viernes', SATURDAY: 'Sábado', SUNDAY: 'Domingo',
};

const SchedulesPage: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [blockedDate, setBlockedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Schedule modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '18:00' });
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Blocked modal
  const [blockedModalOpen, setBlockedModalOpen] = useState(false);
  const [blockedForm, setBlockedForm] = useState({ date: '', startTime: '09:00', endTime: '10:00', reason: '' });
  const [savingBlocked, setSavingBlocked] = useState(false);

  useEffect(() => { loadBusiness(); }, []);
  useEffect(() => { if (businessId) loadBlocked(); }, [businessId, blockedDate]);

  const loadBusiness = async () => {
    try {
      const businesses = await businessesApi.getMine();
      if (businesses.length > 0) {
        const bizId = businesses[0].id;
        setBusinessId(bizId);
        const scheds = await schedulesApi.getByBusiness(bizId);
        setSchedules(scheds);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBlocked = async () => {
    if (!businessId) return;
    try {
      const blocked = await schedulesApi.getBlocked(businessId, blockedDate);
      setBlockedSlots(blocked);
    } catch (error) {
      console.error('Error loading blocked slots:', error);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    setSavingSchedule(true);
    try {
      const dto: CreateScheduleDto = { dayOfWeek: scheduleForm.dayOfWeek, startTime: scheduleForm.startTime, endTime: scheduleForm.endTime, businessId };
      const created = await schedulesApi.create(dto);
      setSchedules([...schedules, created]);
      setScheduleModalOpen(false);
      showToast('Horario agregado exitosamente', 'success');
    } catch (error) {
      console.error('Error creating schedule:', error);
      showToast('Error al procesar la operación', 'error');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm('¿Eliminar este horario?')) return;
    try {
      await schedulesApi.remove(id);
      setSchedules(schedules.filter((s) => s.id !== id));
      showToast('Horario eliminado', 'success');
    } catch (error) {
      console.error('Error deleting schedule:', error);
      showToast('Error al procesar la operación', 'error');
    }
  };

  const handleCreateBlocked = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    setSavingBlocked(true);
    try {
      const dto: CreateBlockedSlotDto = { date: blockedForm.date, startTime: blockedForm.startTime, endTime: blockedForm.endTime, reason: blockedForm.reason, businessId };
      const created = await schedulesApi.createBlocked(dto);
      setBlockedSlots([...blockedSlots, created]);
      setBlockedModalOpen(false);
      showToast('Bloqueo creado exitosamente', 'success');
    } catch (error) {
      console.error('Error creating blocked slot:', error);
      showToast('Error al procesar la operación', 'error');
    } finally {
      setSavingBlocked(false);
    }
  };

  const handleDeleteBlocked = async (id: number) => {
    if (!confirm('¿Eliminar este bloqueo?')) return;
    try {
      await schedulesApi.removeBlocked(id);
      setBlockedSlots(blockedSlots.filter((b) => b.id !== id));
      showToast('Bloqueo eliminado', 'success');
    } catch (error) {
      console.error('Error deleting blocked slot:', error);
      showToast('Error al procesar la operación', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;

  const groupedSchedules = DAYS_ORDER.map((day) => ({
    day,
    label: DAY_LABELS[day],
    items: schedules.filter((s) => s.dayOfWeek === day),
  }));

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Horarios</h1>

      {/* Sección 1: Horarios semanales */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}><Clock size={20} color="#e91e8c" /> Horarios Semanales</h2>
          <Button size="sm" onClick={() => { setScheduleForm({ dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '18:00' }); setScheduleModalOpen(true); }}>
            <Plus size={14} /> Agregar
          </Button>
        </div>
        <div style={styles.scheduleTable}>
          {groupedSchedules.map(({ day, label, items }) => (
            <div key={day} style={styles.dayRow}>
              <span style={styles.dayLabel}>{label}</span>
              <div style={styles.daySlots}>
                {items.length === 0 ? (
                  <span style={styles.noSlot}>Sin horario</span>
                ) : (
                  items.map((item) => (
                    <div key={item.id} style={styles.slot}>
                      <span style={styles.slotTime}>{item.startTime} - {item.endTime}</span>
                      <button style={styles.deleteBtn} onClick={() => handleDeleteSchedule(item.id)} aria-label="Eliminar horario">
                        <Trash2 size={14} color="#dc2626" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sección 2: Bloqueos */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}><Ban size={20} color="#9c27b0" /> Bloqueos</h2>
          <Button size="sm" onClick={() => { setBlockedForm({ date: blockedDate, startTime: '09:00', endTime: '10:00', reason: '' }); setBlockedModalOpen(true); }}>
            <Plus size={14} /> Agregar
          </Button>
        </div>
        <div style={styles.filterRow}>
          <Calendar size={16} color="#e91e8c" />
          <input type="date" value={blockedDate} onChange={(e) => setBlockedDate(e.target.value)} style={styles.dateInput} />
        </div>
        {blockedSlots.length === 0 ? (
          <p style={styles.noBlocked}>No hay bloqueos para esta fecha</p>
        ) : (
          <div style={styles.blockedList}>
            {blockedSlots.map((slot) => (
              <Card key={slot.id}>
                <div style={styles.blockedItem}>
                  <div>
                    <p style={styles.blockedTime}>{slot.startTime} - {slot.endTime}</p>
                    <p style={styles.blockedReason}>{slot.reason || 'Sin razón'}</p>
                  </div>
                  <button style={styles.deleteBtn} onClick={() => handleDeleteBlocked(slot.id)} aria-label="Eliminar bloqueo">
                    <Trash2 size={16} color="#dc2626" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal Horario */}
      <Modal isOpen={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} title="Agregar Horario">
        <form onSubmit={handleCreateSchedule} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Día de la semana</label>
            <select value={scheduleForm.dayOfWeek} onChange={(e) => setScheduleForm({ ...scheduleForm, dayOfWeek: e.target.value })} style={styles.select}>
              {DAYS_ORDER.map((d) => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
            </select>
          </div>
          <Input label="Hora inicio" type="time" value={scheduleForm.startTime} onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })} required />
          <Input label="Hora fin" type="time" value={scheduleForm.endTime} onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })} required />
          <Button type="submit" fullWidth disabled={savingSchedule}>{savingSchedule ? 'Guardando...' : 'Crear Horario'}</Button>
        </form>
      </Modal>

      {/* Modal Bloqueo */}
      <Modal isOpen={blockedModalOpen} onClose={() => setBlockedModalOpen(false)} title="Agregar Bloqueo">
        <form onSubmit={handleCreateBlocked} style={styles.form}>
          <Input label="Fecha" type="date" value={blockedForm.date} onChange={(e) => setBlockedForm({ ...blockedForm, date: e.target.value })} required />
          <Input label="Hora inicio" type="time" value={blockedForm.startTime} onChange={(e) => setBlockedForm({ ...blockedForm, startTime: e.target.value })} required />
          <Input label="Hora fin" type="time" value={blockedForm.endTime} onChange={(e) => setBlockedForm({ ...blockedForm, endTime: e.target.value })} required />
          <Input label="Razón" value={blockedForm.reason} onChange={(e) => setBlockedForm({ ...blockedForm, reason: e.target.value })} placeholder="Motivo del bloqueo" />
          <Button type="submit" fullWidth disabled={savingBlocked}>{savingBlocked ? 'Guardando...' : 'Crear Bloqueo'}</Button>
        </form>
      </Modal>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '2rem', maxWidth: '900px', margin: '0 auto' },
  title: { fontSize: '2rem', fontWeight: 700, color: '#1a1a2e', margin: '0 0 2rem 0' },
  section: { marginBottom: '2.5rem' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  sectionTitle: { fontSize: '1.3rem', fontWeight: 600, color: '#1a1a2e', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' },
  scheduleTable: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  dayRow: { display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: '#fdf2f8', borderRadius: '10px', gap: '1rem' },
  dayLabel: { width: '100px', fontWeight: 600, color: '#1a1a2e', fontSize: '0.9rem' },
  daySlots: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 },
  noSlot: { fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic' },
  slot: { display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#ffffff', padding: '0.3rem 0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb' },
  slotTime: { fontSize: '0.85rem', color: '#1a1a2e', fontWeight: 500 },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' },
  filterRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' },
  dateInput: { padding: '0.5rem 1rem', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '0.95rem', color: '#1a1a2e', outline: 'none' },
  noBlocked: { fontSize: '0.9rem', color: '#9ca3af', fontStyle: 'italic' },
  blockedList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  blockedItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  blockedTime: { fontSize: '0.95rem', fontWeight: 600, color: '#1a1a2e', margin: 0 },
  blockedReason: { fontSize: '0.85rem', color: '#6b7280', margin: '0.2rem 0 0 0' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.9rem', fontWeight: 600, color: '#1a1a2e' },
  select: { padding: '0.7rem 1rem', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '0.95rem', color: '#1a1a2e', outline: 'none', backgroundColor: '#ffffff' },
};

export default SchedulesPage;
