import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as businessesApi from '../api/businesses';
import * as servicesApi from '../api/services';
import * as staffApi from '../api/staff';
import * as appointmentsApi from '../api/appointments';
import * as policiesApi from '../api/policies';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type {
  AvailableSlot as Slot,
  Business,
  BusinessPolicy,
  Service,
  Staff,
} from '../types';

type BookingStep = 'service' | 'staff' | 'date' | 'slots' | 'confirm';

const formatMxn = (value: number): string =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value);

const policyAmount = (
  type: BusinessPolicy['depositType'],
  value: string,
  servicePrice: number,
): number => {
  if (type === 'NONE') return 0;
  const configured = Number(value) || 0;
  return type === 'PERCENT'
    ? Math.min(servicePrice, (servicePrice * configured) / 100)
    : Math.min(servicePrice, configured);
};

const BusinessDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [policy, setPolicy] = useState<BusinessPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking state
  const [showModal, setShowModal] = useState(false);
  const [bookingStep, setBookingStep] = useState<BookingStep>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const businessId = Number(id);
        const [bizRes, svcRes, staffRes, policyRes] = await Promise.all([
          businessesApi.getOne(businessId),
          servicesApi.getByBusiness(businessId),
          staffApi.getByBusiness(businessId),
          policiesApi.getPublicPolicy(businessId),
        ]);
        setBusiness(bizRes);
        setServices(svcRes);
        setStaffList(staffRes);
        setPolicy(policyRes);
      } catch (error) {
        console.error('Error fetching business details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleStartBooking = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowModal(true);
    setBookingStep('service');
    setSelectedService(null);
    setSelectedStaff(null);
    setSelectedDate('');
    setAvailableSlots([]);
    setSelectedSlot(null);
    setNotes('');
  };

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setBookingStep('staff');
  };

  const handleSelectStaff = (staff: Staff | null) => {
    setSelectedStaff(staff);
    setBookingStep('date');
  };

  const handleSelectDate = async (date: string) => {
    setSelectedDate(date);
    setSlotsLoading(true);
    try {
      const res = await appointmentsApi.getAvailableSlots(
        Number(id),
        date,
        selectedService!.id,
        selectedStaff?.id,
      );
      setAvailableSlots(res);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
    setBookingStep('slots');
  };

  const handleSelectSlot = (slot: Slot) => {
    setSelectedSlot(slot);
    setBookingStep('confirm');
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedSlot || !id) return;
    setBookingLoading(true);
    try {
      await appointmentsApi.create({
        date: selectedDate,
        startTime: selectedSlot.startTime,
        businessId: Number(id),
        serviceId: selectedService.id,
        staffId: selectedStaff?.id,
        notes: notes || undefined,
      });
      showToast('¡Cita reservada exitosamente!', 'success');
      setShowModal(false);
    } catch (error) {
      console.error('Error creating appointment:', error);
      showToast('Error al reservar la cita', 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0', backgroundColor: '#fdf2f8', minHeight: '100vh' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!business) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', backgroundColor: '#fdf2f8', minHeight: '100vh' }}>
        <h2 style={{ color: '#1a1a2e' }}>Negocio no encontrado</h2>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fdf2f8', padding: '40px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Business Info */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '40px', marginBottom: '30px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <h1 style={{ fontSize: '2.2rem', color: '#1a1a2e', margin: '0 0 12px 0' }}>{business.name}</h1>
          {business.description && <p style={{ color: '#555', lineHeight: 1.6, margin: '0 0 16px 0' }}>{business.description}</p>}
          {business.address && <p style={{ color: '#777', margin: '0 0 8px 0' }}>📍 {business.address}</p>}
          {business.phone && <p style={{ color: '#777', margin: '0 0 20px 0' }}>📞 {business.phone}</p>}
          <Button
            onClick={handleStartBooking}
            style={{ backgroundColor: '#e91e8c', color: '#fff', padding: '12px 32px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
          >
            Reservar Cita
          </Button>
        </div>

        {policy &&
          (policy.policyText ||
            policy.depositType !== 'NONE' ||
            policy.cancellationFeeType !== 'NONE') && (
            <div
              style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '12px',
                padding: '18px 20px',
                marginBottom: '30px',
                color: '#78350f',
              }}
            >
              <h2 style={{ fontSize: '1.1rem', margin: '0 0 8px' }}>
                Políticas de reserva
              </h2>
              {policy.policyText && (
                <p style={{ margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>
                  {policy.policyText}
                </p>
              )}
              <p style={{ margin: 0, fontSize: '0.88rem' }}>
                Los anticipos y posibles cargos se pagan fuera de la plataforma
                y el negocio los registra manualmente. No realizamos cobros
                automáticos.
              </p>
            </div>
          )}

        {/* Services */}
        <h2 style={{ fontSize: '1.6rem', color: '#1a1a2e', marginBottom: '16px' }}>Servicios</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '30px' }}>
          {services.map((service) => (
            <Card key={service.id} style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h4 style={{ margin: '0 0 6px 0', color: '#1a1a2e' }}>{service.name}</h4>
              {service.description && <p style={{ margin: '0 0 6px 0', color: '#555', fontSize: '0.9rem' }}>{service.description}</p>}
              {service.duration && <p style={{ margin: '0 0 4px 0', color: '#777', fontSize: '0.85rem' }}>⏱ {service.duration} min</p>}
              {service.price != null && <p style={{ margin: 0, color: '#e91e8c', fontWeight: 600 }}>${service.price}</p>}
            </Card>
          ))}
          {services.length === 0 && <p style={{ color: '#777' }}>No hay servicios registrados.</p>}
        </div>

        {/* Staff */}
        <h2 style={{ fontSize: '1.6rem', color: '#1a1a2e', marginBottom: '16px' }}>Staff</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {staffList.map((member) => (
            <Card key={member.id} style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h4 style={{ margin: '0 0 4px 0', color: '#1a1a2e' }}>{member.name}</h4>
              {member.specialty && <p style={{ margin: 0, color: '#9c27b0', fontSize: '0.85rem' }}>{member.specialty}</p>}
            </Card>
          ))}
          {staffList.length === 0 && <p style={{ color: '#777' }}>No hay staff registrado.</p>}
        </div>
      </div>

      {/* Booking Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div style={{ padding: '24px', minWidth: '340px' }}>
          <h2 style={{ color: '#1a1a2e', margin: '0 0 20px 0' }}>Reservar Cita</h2>

          {bookingStep === 'service' && (
            <div>
              <h3 style={{ color: '#555', margin: '0 0 12px 0' }}>Selecciona un servicio</h3>
              {services.map((svc) => (
                <div
                  key={svc.id}
                  onClick={() => handleSelectService(svc)}
                  style={{ padding: '12px', marginBottom: '8px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer', backgroundColor: '#fdf2f8' }}
                >
                  <strong style={{ color: '#1a1a2e' }}>{svc.name}</strong>
                  {svc.price != null && <span style={{ float: 'right', color: '#e91e8c' }}>${svc.price}</span>}
                </div>
              ))}
            </div>
          )}

          {bookingStep === 'staff' && (
            <div>
              <h3 style={{ color: '#555', margin: '0 0 12px 0' }}>Selecciona staff (opcional)</h3>
              <div
                onClick={() => handleSelectStaff(null)}
                style={{ padding: '12px', marginBottom: '8px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer', backgroundColor: '#fdf2f8' }}
              >
                <em style={{ color: '#777' }}>Sin preferencia</em>
              </div>
              {staffList.map((member) => (
                <div
                  key={member.id}
                  onClick={() => handleSelectStaff(member)}
                  style={{ padding: '12px', marginBottom: '8px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer', backgroundColor: '#fdf2f8' }}
                >
                  <strong style={{ color: '#1a1a2e' }}>{member.name}</strong>
                </div>
              ))}
            </div>
          )}

          {bookingStep === 'date' && (
            <div>
              <h3 style={{ color: '#555', margin: '0 0 12px 0' }}>Selecciona una fecha</h3>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleSelectDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
              />
            </div>
          )}

          {bookingStep === 'slots' && (
            <div>
              <h3 style={{ color: '#555', margin: '0 0 12px 0' }}>Horarios disponibles - {selectedDate}</h3>
              {slotsLoading ? (
                <LoadingSpinner />
              ) : availableSlots.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {availableSlots.map((slot, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectSlot(slot)}
                      style={{ padding: '10px', textAlign: 'center', borderRadius: '8px', border: '1px solid #9c27b0', cursor: 'pointer', color: '#9c27b0', fontWeight: 600 }}
                    >
                      {slot.startTime}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#777' }}>No hay horarios disponibles para esta fecha.</p>
              )}
            </div>
          )}

          {bookingStep === 'confirm' && (
            <div>
              <h3 style={{ color: '#555', margin: '0 0 12px 0' }}>Confirmar Reserva</h3>
              <div style={{ backgroundColor: '#fdf2f8', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <p style={{ margin: '0 0 6px 0' }}><strong>Servicio:</strong> {selectedService?.name}</p>
                <p style={{ margin: '0 0 6px 0' }}><strong>Staff:</strong> {selectedStaff?.name || 'Sin preferencia'}</p>
                <p style={{ margin: '0 0 6px 0' }}><strong>Fecha:</strong> {selectedDate}</p>
                <p style={{ margin: 0 }}><strong>Hora:</strong> {selectedSlot?.startTime}</p>
              </div>
              {policy && selectedService && (
                <div
                  style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    color: '#78350f',
                    fontSize: '0.88rem',
                  }}
                >
                  <strong>Condiciones de reserva</strong>
                  <p style={{ margin: '6px 0 0' }}>
                    Anticipo requerido:{' '}
                    {policy.depositType === 'NONE'
                      ? 'No requerido'
                      : `${formatMxn(
                          policyAmount(
                            policy.depositType,
                            policy.depositValue,
                            Number(selectedService.price),
                          ),
                        )} MXN`}
                    .{' '}
                    {policy.cancellationFeeType === 'NONE'
                      ? 'Sin cargo configurado por cancelación.'
                      : `Cancelación sin cargo hasta ${policy.cancellationWindowHours} horas antes; después puede aplicar el cargo configurado por el negocio.`}
                  </p>
                  <p style={{ margin: '6px 0 0' }}>
                    Registro manual; GlamBook no realizará ningún cobro
                    automático.
                  </p>
                </div>
              )}
              <textarea
                placeholder="Notas adicionales (opcional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '60px', marginBottom: '16px', resize: 'vertical' }}
              />
              <Button
                onClick={handleConfirmBooking}
                disabled={bookingLoading}
                style={{ width: '100%', backgroundColor: '#e91e8c', color: '#fff', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: bookingLoading ? 'not-allowed' : 'pointer' }}
              >
                {bookingLoading ? 'Reservando...' : 'Confirmar Cita'}
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default BusinessDetailPage;
