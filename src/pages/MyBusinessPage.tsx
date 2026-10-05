import React, { useEffect, useState } from 'react';
import * as businessesApi from '../api/businesses';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import type { Business, CreateBusinessDto } from '../types';
import { Store, MapPin, Phone, Image, FileText, Edit3, Save } from 'lucide-react';

const MyBusinessPage: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CreateBusinessDto>({
    name: '',
    description: '',
    address: '',
    phone: '',
    imageUrl: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadBusiness();
  }, []);

  const loadBusiness = async () => {
    try {
      const businesses = await businessesApi.getMine();
      if (businesses.length > 0) {
        const biz = businesses[0];
        setBusiness(biz);
        setForm({
          name: biz.name,
          description: biz.description || '',
          address: biz.address || '',
          phone: biz.phone || '',
          imageUrl: biz.imageUrl || '',
        });
      }
    } catch (err) {
      console.error('Error loading business:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('El nombre del negocio es requerido');
      return;
    }
    setSaving(true);
    try {
      if (business) {
        const updated = await businessesApi.update(business.id, form);
        setBusiness(updated);
        setEditing(false);
        showToast('Negocio actualizado exitosamente', 'success');
      } else {
        const created = await businessesApi.create(form);
        setBusiness(created);
        showToast('Negocio creado exitosamente', 'success');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el negocio');
      showToast('Error al guardar el negocio', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (business && !editing) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Mi Negocio</h1>
          <Button onClick={() => setEditing(true)}><Edit3 size={16} /> Editar</Button>
        </div>
        <Card>
          <div style={styles.businessInfo}>
            {business.imageUrl && (
              <img src={business.imageUrl} alt={business.name} style={styles.businessImage} />
            )}
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <Store size={18} color="#e91e8c" />
                <div>
                  <p style={styles.infoLabel}>Nombre</p>
                  <p style={styles.infoValue}>{business.name}</p>
                </div>
              </div>
              <div style={styles.infoItem}>
                <FileText size={18} color="#e91e8c" />
                <div>
                  <p style={styles.infoLabel}>Descripción</p>
                  <p style={styles.infoValue}>{business.description || 'Sin descripción'}</p>
                </div>
              </div>
              <div style={styles.infoItem}>
                <MapPin size={18} color="#e91e8c" />
                <div>
                  <p style={styles.infoLabel}>Dirección</p>
                  <p style={styles.infoValue}>{business.address || 'Sin dirección'}</p>
                </div>
              </div>
              <div style={styles.infoItem}>
                <Phone size={18} color="#e91e8c" />
                <div>
                  <p style={styles.infoLabel}>Teléfono</p>
                  <p style={styles.infoValue}>{business.phone || 'Sin teléfono'}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>{business ? 'Editar Negocio' : 'Configura tu Negocio'}</h1>
        {business && <Button variant="secondary" onClick={() => setEditing(false)}>Cancelar</Button>}
      </div>
      <Card>
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <p style={styles.error}>{error}</p>}
          <Input label="Nombre del negocio" name="name" icon={Store} value={form.name} onChange={handleChange} placeholder="Ej: GlamBook Salón" required />
          <Input label="Descripción" name="description" icon={FileText} value={form.description} onChange={handleChange} placeholder="Descripción breve de tu negocio" />
          <Input label="Dirección" name="address" icon={MapPin} value={form.address} onChange={handleChange} placeholder="Dirección del local" />
          <Input label="Teléfono" name="phone" icon={Phone} value={form.phone} onChange={handleChange} placeholder="+1 234 567 890" />
          <Input label="URL de imagen" name="imageUrl" icon={Image} value={form.imageUrl} onChange={handleChange} placeholder="https://ejemplo.com/imagen.jpg" />
          <Button type="submit" fullWidth disabled={saving}>
            <Save size={16} />
            {saving ? 'Guardando...' : business ? 'Actualizar Negocio' : 'Guardar Negocio'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '2rem', maxWidth: '800px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '2rem', fontWeight: 700, color: '#1a1a2e', margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '1.2rem' },
  error: { color: '#dc2626', backgroundColor: '#fef2f2', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem', margin: 0 },
  businessInfo: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  businessImage: { width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '12px' },
  infoGrid: { display: 'flex', flexDirection: 'column', gap: '1.2rem' },
  infoItem: { display: 'flex', alignItems: 'flex-start', gap: '0.75rem' },
  infoLabel: { fontSize: '0.8rem', color: '#9ca3af', margin: 0, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' },
  infoValue: { fontSize: '1rem', color: '#1a1a2e', margin: 0, marginTop: '0.1rem' },
};

export default MyBusinessPage;
