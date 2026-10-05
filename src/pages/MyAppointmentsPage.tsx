import React, { useEffect, useState } from 'react';
import * as appointmentsApi from '../api/appointments';
import { useToast } from '../context/ToastContext';
import type { Appointment, AppointmentStatus } from '../types';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, X as XIcon } from 'lucide-react';

const statusConfig: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pendiente', color: '#856404', bg: '#fff3cd' },
  CONFIRMED: { label: 'Confirmada', color: '#155724', bg: '#d4edda' },
  CANCELLED: { label: 'Cancelada', color: '#721c24', bg: '#f8d7da' },
  COMPLETED: { label: 'Completada', color: '#004085', bg: '#cce5ff' },
  NO_SHOW: { label: 'No asistió', color: '#374151', bg: '#f3f4f6' },
};

const MyAppointmentsPage: React.FC = () => {
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAppointments = async (currentPage: number) => {
    setLoading(true);
    try {
      const response = await appointmentsApi.getMy(currentPage, 10);
      setAppointments(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(page);
  }, [page]);

  const handleCancel = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta cita?')) return;
    setCancellingId(id);
    try {
      await appointmentsApi.cancel(id);
      await fetchAppointments(page);
      showToast('Cita cancelada exitosamente', 'success');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      showToast('Error al cancelar la cita', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const canCancel = (status: AppointmentStatus) =>
    status === 'PENDING' || status === 'CONFIRMED';

  if (loading && appointments.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#1a1a2e',
          marginBottom: '1.5rem',
        }}
      >
        Mis Citas
      </h1>

      {appointments.length === 0 && !loading ? (
        <Card>
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            No tienes citas registradas.
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {appointments.map((appointment) => {
            const status = statusConfig[appointment.status];
            return (
              <Card key={appointment.id}>
                <div
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <h3
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: '#1a1a2e',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {appointment.business?.name || 'Negocio'}
                    </h3>
                    <p
                      style={{
                        fontSize: '0.95rem',
                        color: '#9c27b0',
                        fontWeight: 500,
                        marginBottom: '0.75rem',
                      }}
                    >
                      {appointment.service?.name || 'Servicio'}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: '#555' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={15} color="#e91e8c" />
                        {format(new Date(appointment.date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={15} color="#e91e8c" />
                        {appointment.startTime} - {appointment.endTime}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '0.75rem',
                    }}
                  >
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: status.color,
                        backgroundColor: status.bg,
                      }}
                    >
                      {status.label}
                    </span>

                    {canCancel(appointment.status) && (
                      <Button
                        onClick={() => handleCancel(appointment.id)}
                        disabled={cancellingId === appointment.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          backgroundColor: 'transparent',
                          color: '#dc3545',
                          border: '1px solid #dc3545',
                          padding: '0.4rem 0.75rem',
                          fontSize: '0.8rem',
                          borderRadius: '0.375rem',
                          cursor: cancellingId === appointment.id ? 'not-allowed' : 'pointer',
                          opacity: cancellingId === appointment.id ? 0.6 : 1,
                        }}
                      >
                        <XIcon size={14} />
                        {cancellingId === appointment.id ? 'Cancelando...' : 'Cancelar'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '2rem',
          }}
        >
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              backgroundColor: page === 1 ? '#ccc' : '#e91e8c',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            Anterior
          </Button>
          <span style={{ fontSize: '0.875rem', color: '#1a1a2e', fontWeight: 500 }}>
            Página {page} de {totalPages}
          </span>
          <Button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              backgroundColor: page === totalPages ? '#ccc' : '#e91e8c',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            Siguiente
          </Button>
        </div>
      )}

      {loading && appointments.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

export default MyAppointmentsPage;
