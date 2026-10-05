import React, { useEffect, useState } from 'react';
import * as businessesApi from '../api/businesses';
import * as staffApi from '../api/staff';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import type { Staff, CreateStaffDto } from '../types';
import { Users, Plus, Edit3, Trash2, Phone, Image, Award } from 'lucide-react';

const StaffPage: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', specialty: '', phone: '', imageUrl: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const businesses = await businessesApi.getMine();
      if (businesses.length > 0) {
        const bizId = businesses[0].id;
        setBusinessId(bizId);
        const list = await staffApi.getByBusiness(bizId);
        setStaffList(list);
      }
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingStaff(null);
    setForm({ name: '', specialty: '', phone: '', imageUrl: '' });
    setModalOpen(true);
  };

  const openEditModal = (member: Staff) => {
    setEditingStaff(member);
    setForm({ name: member.name, specialty: member.specialty || '', phone: member.phone || '', imageUrl: member.imageUrl || '' });
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
      const dto: CreateStaffDto = { name: form.name, specialty: form.specialty, phone: form.phone, imageUrl: form.imageUrl, businessId };
      if (editingStaff) {
        const updated = await staffApi.update(editingStaff.id, dto);
        setStaffList(staffList.map((s) => (s.id === updated.id ? updated : s)));
        showToast('Staff actualizado exitosamente', 'success');
      } else {
        const created = await staffApi.create(dto);
        setStaffList([...staffList, created]);
        showToast('Miembro de staff creado exitosamente', 'success');
      }
      setModalOpen(false);
    } catch (error) {
      console.error('Error saving staff:', error);
      showToast('Error al procesar la operación', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este miembro del staff?')) return;
    try {
      await staffApi.remove(id);
      setStaffList(staffList.filter((s) => s.id !== id));
      showToast('Miembro de staff eliminado', 'success');
    } catch (error) {
      console.error('Error deleting staff:', error);
      showToast('Error al procesar la operación', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Staff</h1>
        <Button onClick={openCreateModal}><Plus size={16} /> Agregar Staff</Button>
      </div>

      {staffList.length === 0 ? (
        <Card>
          <div style={styles.emptyState}>
            <Users size={48} color="#e91e8c" />
            <p style={styles.emptyText}>No tienes staff registrado</p>
          </div>
        </Card>
      ) : (
        <div style={styles.list}>
          {staffList.map((member) => (
            <Card key={member.id}>
              <div style={styles.staffItem}>
                <div style={styles.staffLeft}>
                  {member.imageUrl ? (
                    <img src={member.imageUrl} alt={member.name} style={styles.avatar} />
                  ) : (
                    <div style={styles.avatarPlaceholder}><Users size={20} color="#e91e8c" /></div>
                  )}
                  <div style={styles.staffInfo}>
                    <h3 style={styles.staffName}>{member.name}</h3>
                    {member.specialty && <p style={styles.staffSpecialty}><Award size={14} color="#9c27b0" /> {member.specialty}</p>}
                    {member.phone && <p style={styles.staffPhone}><Phone size={14} color="#6b7280" /> {member.phone}</p>}
                  </div>
                </div>
                <div style={styles.actions}>
                  <button style={styles.iconBtn} onClick={() => openEditModal(member)} aria-label="Editar staff"><Edit3 size={18} color="#9c27b0" /></button>
                  <button style={styles.iconBtn} onClick={() => handleDelete(member.id)} aria-label="Eliminar staff"><Trash2 size={18} color="#dc2626" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingStaff ? 'Editar Staff' : 'Agregar Staff'}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <Input label="Nombre" name="name" icon={Users} value={form.name} onChange={handleChange} placeholder="Nombre completo" required />
          <Input label="Especialidad" name="specialty" icon={Award} value={form.specialty} onChange={handleChange} placeholder="Ej: Estilista, Manicurista" />
          <Input label="Teléfono" name="phone" icon={Phone} value={form.phone} onChange={handleChange} placeholder="+1 234 567 890" />
          <Input label="URL de imagen" name="imageUrl" icon={Image} value={form.imageUrl} onChange={handleChange} placeholder="https://ejemplo.com/foto.jpg" />
          <Button type="submit" fullWidth disabled={saving}>
            {saving ? 'Guardando...' : editingStaff ? 'Actualizar Staff' : 'Crear Staff'}
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
  staffItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  staffLeft: { display: 'flex', alignItems: 'center', gap: '1rem' },
  avatar: { width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' },
  avatarPlaceholder: { width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  staffInfo: { display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  staffName: { fontSize: '1.1rem', fontWeight: 600, color: '#1a1a2e', margin: 0 },
  staffSpecialty: { fontSize: '0.85rem', color: '#9c27b0', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' },
  staffPhone: { fontSize: '0.85rem', color: '#6b7280', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' },
  actions: { display: 'flex', gap: '0.5rem' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem 1rem' },
  emptyText: { fontSize: '1rem', color: '#6b7280', margin: 0 },
};

export default StaffPage;
