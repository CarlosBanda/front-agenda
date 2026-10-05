import React, { useEffect, useState } from 'react';
import * as businessesApi from '../api/businesses';
import * as servicesApi from '../api/services';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import type { Service, CreateServiceDto } from '../types';
import { Scissors, Plus, Edit3, Trash2, DollarSign, Clock, FileText } from 'lucide-react';

const ServicesPage: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', duration: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const businesses = await businessesApi.getMine();
      if (businesses.length > 0) {
        const bizId = businesses[0].id;
        setBusinessId(bizId);
        const svcList = await servicesApi.getByBusiness(bizId);
        setServices(svcList);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingService(null);
    setForm({ name: '', description: '', price: '', duration: '' });
    setModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setForm({ name: service.name, description: service.description || '', price: service.price.toString(), duration: service.duration.toString() });
    setModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    setSaving(true);
    try {
      const dto: CreateServiceDto = { name: form.name, description: form.description, price: parseFloat(form.price), duration: parseInt(form.duration), businessId };
      if (editingService) {
        const updated = await servicesApi.update(editingService.id, dto);
        setServices(services.map((s) => (s.id === updated.id ? updated : s)));
        showToast('Servicio actualizado exitosamente', 'success');
      } else {
        const created = await servicesApi.create(dto);
        setServices([...services, created]);
        showToast('Servicio creado exitosamente', 'success');
      }
      setModalOpen(false);
    } catch (error) {
      console.error('Error saving service:', error);
      showToast('Error al procesar la operación', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return;
    try {
      await servicesApi.remove(id);
      setServices(services.filter((s) => s.id !== id));
      showToast('Servicio eliminado', 'success');
    } catch (error) {
      console.error('Error deleting service:', error);
      showToast('Error al procesar la operación', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Servicios</h1>
        <Button onClick={openCreateModal}><Plus size={16} /> Agregar Servicio</Button>
      </div>

      {services.length === 0 ? (
        <Card>
          <div style={styles.emptyState}>
            <Scissors size={48} color="#e91e8c" />
            <p style={styles.emptyText}>No tienes servicios registrados</p>
          </div>
        </Card>
      ) : (
        <div style={styles.list}>
          {services.map((service) => (
            <Card key={service.id}>
              <div style={styles.serviceItem}>
                <div style={styles.serviceInfo}>
                  <h3 style={styles.serviceName}>{service.name}</h3>
                  {service.description && <p style={styles.serviceDesc}>{service.description}</p>}
                  <div style={styles.meta}>
                    <span style={styles.metaItem}><DollarSign size={14} color="#e91e8c" />${service.price.toFixed(2)}</span>
                    <span style={styles.metaItem}><Clock size={14} color="#9c27b0" />{service.duration} min</span>
                  </div>
                </div>
                <div style={styles.actions}>
                  <button style={styles.iconBtn} onClick={() => openEditModal(service)} aria-label="Editar servicio"><Edit3 size={18} color="#9c27b0" /></button>
                  <button style={styles.iconBtn} onClick={() => handleDelete(service.id)} aria-label="Eliminar servicio"><Trash2 size={18} color="#dc2626" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingService ? 'Editar Servicio' : 'Agregar Servicio'}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <Input label="Nombre" name="name" icon={Scissors} value={form.name} onChange={handleChange} placeholder="Nombre del servicio" required />
          <Input label="Descripción" name="description" icon={FileText} value={form.description} onChange={handleChange} placeholder="Descripción breve" />
          <Input label="Precio" name="price" icon={DollarSign} type="number" step="0.01" min="0" value={form.price} onChange={handleChange} placeholder="0.00" required />
          <Input label="Duración (minutos)" name="duration" icon={Clock} type="number" min="1" value={form.duration} onChange={handleChange} placeholder="30" required />
          <Button type="submit" fullWidth disabled={saving}>
            {saving ? 'Guardando...' : editingService ? 'Actualizar Servicio' : 'Crear Servicio'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '2rem', maxWidth: '900px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '2rem', fontWeight: 700, color: '#1a1a2e', margin: 0 },
  list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  serviceItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: '1.1rem', fontWeight: 600, color: '#1a1a2e', margin: 0 },
  serviceDesc: { fontSize: '0.9rem', color: '#6b7280', margin: '0.3rem 0 0 0' },
  meta: { display: 'flex', gap: '1rem', marginTop: '0.5rem' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: '#4b5563', fontWeight: 500 },
  actions: { display: 'flex', gap: '0.5rem' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem 1rem' },
  emptyText: { fontSize: '1rem', color: '#6b7280', margin: 0 },
};

export default ServicesPage;
