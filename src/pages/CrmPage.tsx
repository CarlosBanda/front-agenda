import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as businessesApi from '../api/businesses';
import * as crmApi from '../api/crm';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import type {
  Appointment,
  BusinessMetrics,
  Client,
  ClientMetrics,
  ClientNote,
  ClientTag,
} from '../types';
import { format } from 'date-fns';
import {
  Mail,
  Phone,
  Plus,
  Search,
  Tag as TagIcon,
  User,
  Users,
} from 'lucide-react';

const formatMoney = (value?: string | null): string =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(Number(value ?? 0) || 0);

const SOURCE_LABEL: Record<string, string> = {
  MANUAL: 'Manual',
  IMPORTED: 'Importado',
  LINKED: 'Vinculado',
};

const CrmPage: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<number | ''>('');
  const [tags, setTags] = useState<ClientTag[]>([]);
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const limit = 10;

  const loadClients = useCallback(
    async (bid: number) => {
      const res = await crmApi.listClients(bid, {
        page,
        limit,
        search: search.trim() || undefined,
        tagId: tagFilter === '' ? undefined : tagFilter,
      });
      setClients(res.data);
      setTotal(res.total);
    },
    [page, search, tagFilter],
  );

  const init = useCallback(async () => {
    try {
      const businesses = await businessesApi.getMine();
      if (businesses.length > 0) {
        const bid = businesses[0].id;
        setBusinessId(bid);
        const [tg, mt] = await Promise.all([
          crmApi.listTags(bid),
          crmApi.getBusinessMetrics(bid),
        ]);
        setTags(tg);
        setMetrics(mt);
      }
    } catch (error) {
      console.error('Error initializing CRM:', error);
      showToast('No se pudo cargar el CRM', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (businessId) void loadClients(businessId);
  }, [businessId, loadClients]);

  const refreshAll = useCallback(async () => {
    if (!businessId) return;
    const [tg, mt] = await Promise.all([
      crmApi.listTags(businessId),
      crmApi.getBusinessMetrics(businessId),
    ]);
    setTags(tg);
    setMetrics(mt);
    await loadClients(businessId);
  }, [businessId, loadClients]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (loading) return <LoadingSpinner />;

  if (!businessId) {
    return (
      <div style={styles.container}>
        <Card>
          <div style={styles.emptyState}>
            <Users size={48} color="#e91e8c" />
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
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Clientes (CRM)</h1>
          <p style={styles.subtitle}>Gestiona tu base de clientes</p>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={() => setTagModalOpen(true)}>
            <TagIcon size={16} /> Etiquetas
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Nuevo cliente
          </Button>
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div style={styles.metricsGrid}>
          <MetricCard label="Total clientes" value={metrics.clients.total} />
          <MetricCard
            label="Nuevos este mes"
            value={metrics.clients.newThisMonth}
          />
          <MetricCard label="Importados" value={metrics.clients.imported} />
          <MetricCard label="Vinculados" value={metrics.clients.linked} />
          <MetricCard
            label="Tasa no-show"
            value={`${(metrics.appointments.noShowRate * 100).toFixed(1)}%`}
          />
        </div>
      )}

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.searchBox}>
          <Search size={18} color="#9ca3af" />
          <input
            style={styles.searchInput}
            placeholder="Buscar por nombre, teléfono o email…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            aria-label="Buscar clientes"
          />
        </div>
        <select
          style={styles.select}
          value={tagFilter}
          onChange={(e) => {
            setPage(1);
            setTagFilter(e.target.value === '' ? '' : Number(e.target.value));
          }}
          aria-label="Filtrar por etiqueta"
        >
          <option value="">Todas las etiquetas</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      {clients.length === 0 ? (
        <Card>
          <div style={styles.emptyState}>
            <User size={48} color="#e91e8c" />
            <p style={styles.emptyText}>No se encontraron clientes</p>
          </div>
        </Card>
      ) : (
        <div style={styles.list}>
          {clients.map((c) => (
            <Card key={c.id} onClick={() => setSelectedId(c.id)}>
              <div style={styles.clientRow}>
                <div style={styles.avatar} aria-hidden>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div style={styles.clientInfo}>
                  <span style={styles.clientName}>{c.name}</span>
                  <div style={styles.clientMeta}>
                    {c.phone && (
                      <span style={styles.metaItem}>
                        <Phone size={13} /> {c.phone}
                      </span>
                    )}
                    {c.email && (
                      <span style={styles.metaItem}>
                        <Mail size={13} /> {c.email}
                      </span>
                    )}
                  </div>
                  <div style={styles.tagRow}>
                    <span style={styles.sourceBadge}>
                      {SOURCE_LABEL[c.source]}
                    </span>
                    {(c.tags ?? []).map((t) => (
                      <TagPill key={t.id} tag={t} />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <Button
            size="sm"
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span style={styles.pageInfo}>
            Página {page} de {totalPages}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente
          </Button>
        </div>
      )}

      {selectedId && (
        <ClientDetailModal
          clientId={selectedId}
          tags={tags}
          onClose={() => setSelectedId(null)}
          onChanged={refreshAll}
        />
      )}

      {createOpen && (
        <CreateClientModal
          businessId={businessId}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            showToast('Cliente creado', 'success');
            void refreshAll();
          }}
        />
      )}

      {tagModalOpen && (
        <TagManagerModal
          businessId={businessId}
          tags={tags}
          onClose={() => setTagModalOpen(false)}
          onChanged={refreshAll}
        />
      )}
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: number | string }> = ({
  label,
  value,
}) => (
  <Card style={{ padding: '0.85rem 1rem' }}>
    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>{label}</p>
    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
      {value}
    </p>
  </Card>
);

const TagPill: React.FC<{ tag: ClientTag; onRemove?: () => void }> = ({
  tag,
  onRemove,
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
      background: tag.color ?? '#f3e8ff',
      color: '#4a1d5f',
      padding: '0.15rem 0.6rem',
      borderRadius: '20px',
      fontSize: '0.72rem',
      fontWeight: 600,
    }}
  >
    {tag.name}
    {onRemove && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label={`Quitar etiqueta ${tag.name}`}
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: 'inherit',
          padding: 0,
          fontSize: '0.85rem',
          lineHeight: 1,
        }}
      >
        ×
      </button>
    )}
  </span>
);

// --- Client detail ----------------------------------------------------------
const ClientDetailModal: React.FC<{
  clientId: number;
  tags: ClientTag[];
  onClose: () => void;
  onChanged: () => void;
}> = ({ clientId, tags, onClose, onChanged }) => {
  const { showToast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [metrics, setMetrics] = useState<ClientMetrics | null>(null);
  const [history, setHistory] = useState<Appointment[]>([]);
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [tagToAdd, setTagToAdd] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [c, m, h, n] = await Promise.all([
        crmApi.getClient(clientId),
        crmApi.getClientMetrics(clientId),
        crmApi.getClientHistory(clientId),
        crmApi.listNotes(clientId),
      ]);
      setClient(c);
      setMetrics(m);
      setHistory(h);
      setNotes(n);
    } catch (error) {
      console.error('Error loading client:', error);
      showToast('No se pudo cargar la ficha', 'error');
    } finally {
      setLoading(false);
    }
  }, [clientId, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    try {
      const note = await crmApi.addNote(clientId, newNote.trim());
      setNotes((prev) => [note, ...prev]);
      setNewNote('');
      showToast('Nota agregada', 'success');
    } catch {
      showToast('Error al agregar la nota', 'error');
    }
  };

  const assignTag = async () => {
    if (tagToAdd === '') return;
    try {
      const updated = await crmApi.assignTags(clientId, [Number(tagToAdd)]);
      setClient(updated);
      setTagToAdd('');
      onChanged();
    } catch {
      showToast('Error al asignar etiqueta', 'error');
    }
  };

  const removeTag = async (tagId: number) => {
    try {
      const updated = await crmApi.removeTag(clientId, tagId);
      setClient(updated);
      onChanged();
    } catch {
      showToast('Error al quitar etiqueta', 'error');
    }
  };

  const availableTags = useMemo(() => {
    const assigned = new Set((client?.tags ?? []).map((t) => t.id));
    return tags.filter((t) => !assigned.has(t.id));
  }, [tags, client]);

  return (
    <Modal isOpen onClose={onClose} title={client?.name ?? 'Ficha de cliente'}>
      {loading || !client ? (
        <LoadingSpinner />
      ) : (
        <div style={styles.detailCol}>
          {/* Contact */}
          <div style={styles.detailContact}>
            {client.phone && (
              <span style={styles.metaItem}>
                <Phone size={14} /> {client.phone}
              </span>
            )}
            {client.email && (
              <span style={styles.metaItem}>
                <Mail size={14} /> {client.email}
              </span>
            )}
            <span style={styles.sourceBadge}>{SOURCE_LABEL[client.source]}</span>
          </div>

          {/* Metrics */}
          {metrics && (
            <div style={styles.detailMetrics}>
              <DetailStat label="Citas" value={metrics.appointments.total} />
              <DetailStat
                label="Completadas"
                value={metrics.appointments.completed}
              />
              <DetailStat
                label="No-show"
                value={metrics.appointments.noShow}
              />
              <DetailStat
                label="Próximas"
                value={metrics.appointments.upcoming}
              />
              <DetailStat
                label="Gastado"
                value={formatMoney(metrics.totalSpent)}
              />
              <DetailStat
                label="Última visita"
                value={metrics.lastVisit ?? '—'}
              />
            </div>
          )}

          {/* Tags */}
          <section>
            <h3 style={styles.sectionTitle}>Etiquetas</h3>
            <div style={styles.tagRow}>
              {(client.tags ?? []).length === 0 && (
                <span style={styles.hint}>Sin etiquetas</span>
              )}
              {(client.tags ?? []).map((t) => (
                <TagPill key={t.id} tag={t} onRemove={() => removeTag(t.id)} />
              ))}
            </div>
            {availableTags.length > 0 && (
              <div style={styles.inlineForm}>
                <select
                  style={styles.select}
                  value={tagToAdd}
                  onChange={(e) =>
                    setTagToAdd(
                      e.target.value === '' ? '' : Number(e.target.value),
                    )
                  }
                  aria-label="Agregar etiqueta"
                >
                  <option value="">Agregar etiqueta…</option>
                  {availableTags.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <Button size="sm" onClick={assignTag}>
                  Agregar
                </Button>
              </div>
            )}
          </section>

          {/* History */}
          <section>
            <h3 style={styles.sectionTitle}>Historial de citas</h3>
            {history.length === 0 ? (
              <span style={styles.hint}>Sin historial</span>
            ) : (
              <div style={styles.historyList}>
                {history.slice(0, 20).map((a) => (
                  <div key={a.id} style={styles.historyItem}>
                    <span style={styles.historyDate}>
                      {a.date} {a.startTime?.slice(0, 5)}
                    </span>
                    <span style={styles.historySvc}>
                      {a.service?.name ?? `Servicio #${a.serviceId}`}
                    </span>
                    <span style={styles.historyStatus}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Notes */}
          <section>
            <h3 style={styles.sectionTitle}>Notas</h3>
            <div style={styles.inlineForm}>
              <input
                style={styles.searchInput}
                placeholder="Nueva nota…"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                aria-label="Nueva nota"
              />
              <Button size="sm" onClick={addNote}>
                Guardar
              </Button>
            </div>
            <div style={styles.notesList}>
              {notes.map((n) => (
                <div key={n.id} style={styles.noteItem}>
                  <p style={styles.noteBody}>{n.body}</p>
                  <span style={styles.noteDate}>
                    {format(new Date(n.createdAt), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
};

const DetailStat: React.FC<{ label: string; value: number | string }> = ({
  label,
  value,
}) => (
  <div style={styles.detailStat}>
    <span style={styles.detailStatValue}>{value}</span>
    <span style={styles.detailStatLabel}>{label}</span>
  </div>
);

// --- Create client ----------------------------------------------------------
const CreateClientModal: React.FC<{
  businessId: number;
  onClose: () => void;
  onCreated: () => void;
}> = ({ businessId, onClose, onCreated }) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      showToast('El nombre es obligatorio', 'warning');
      return;
    }
    setSaving(true);
    try {
      await crmApi.createClient(businessId, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onCreated();
    } catch (error) {
      console.error('Error creating client:', error);
      showToast('No se pudo crear el cliente', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Nuevo cliente">
      <div style={styles.detailCol}>
        <Input
          label="Nombre *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={150}
        />
        <Input
          label="Teléfono"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={20}
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label style={styles.fieldLabel}>
          Notas
          <textarea
            style={styles.textarea}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <div style={styles.modalActions}>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            Crear
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// --- Tag manager ------------------------------------------------------------
const TagManagerModal: React.FC<{
  businessId: number;
  tags: ClientTag[];
  onClose: () => void;
  onChanged: () => void;
}> = ({ businessId, tags, onClose, onChanged }) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#f3e8ff');
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await crmApi.createTag(businessId, { name: name.trim(), color });
      setName('');
      showToast('Etiqueta creada', 'success');
      onChanged();
    } catch (error) {
      console.error('Error creating tag:', error);
      showToast('No se pudo crear la etiqueta', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Etiquetas">
      <div style={styles.detailCol}>
        <div style={styles.tagRow}>
          {tags.length === 0 && <span style={styles.hint}>Sin etiquetas</span>}
          {tags.map((t) => (
            <TagPill key={t.id} tag={t} />
          ))}
        </div>
        <div style={styles.inlineForm}>
          <input
            style={styles.searchInput}
            placeholder="Nombre de la etiqueta"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            aria-label="Nombre de la etiqueta"
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={styles.colorInput}
            aria-label="Color de la etiqueta"
          />
          <Button size="sm" onClick={create} disabled={saving}>
            Crear
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '1.25rem',
  },
  headerActions: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  title: { fontSize: '2rem', fontWeight: 700, color: '#1a1a2e', margin: 0 },
  subtitle: { fontSize: '0.95rem', color: '#6b7280', marginTop: '0.2rem' },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  filters: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '1.25rem',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    padding: '0.4rem 0.75rem',
    flex: 1,
    minWidth: '220px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '0.95rem',
    color: '#1a1a2e',
    flex: 1,
    background: 'transparent',
  },
  select: {
    padding: '0.5rem 0.75rem',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '0.9rem',
    color: '#1a1a2e',
    outline: 'none',
    background: '#fff',
  },
  colorInput: {
    width: '44px',
    height: '40px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    background: '#fff',
    cursor: 'pointer',
    padding: '2px',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  clientRow: { display: 'flex', alignItems: 'center', gap: '1rem' },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #e91e8c, #9c27b0)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '1.1rem',
    flexShrink: 0,
  },
  clientInfo: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  clientName: { fontSize: '1rem', fontWeight: 600, color: '#1a1a2e' },
  clientMeta: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    color: '#6b7280',
    fontSize: '0.82rem',
  },
  metaItem: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem' },
  tagRow: {
    display: 'flex',
    gap: '0.4rem',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: '0.2rem',
  },
  sourceBadge: {
    background: '#eef2ff',
    color: '#4338ca',
    padding: '0.15rem 0.6rem',
    borderRadius: '20px',
    fontSize: '0.72rem',
    fontWeight: 600,
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    marginTop: '1.25rem',
  },
  pageInfo: { fontSize: '0.9rem', color: '#6b7280' },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    padding: '3rem 1rem',
  },
  emptyText: { fontSize: '1rem', color: '#6b7280', margin: 0 },
  detailCol: { display: 'flex', flexDirection: 'column', gap: '1.1rem' },
  detailContact: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    alignItems: 'center',
    color: '#6b7280',
    fontSize: '0.85rem',
  },
  detailMetrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
    gap: '0.6rem',
  },
  detailStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: '#fdf2f8',
    borderRadius: '10px',
    padding: '0.6rem 0.4rem',
  },
  detailStatValue: { fontSize: '1.05rem', fontWeight: 700, color: '#1a1a2e' },
  detailStatLabel: { fontSize: '0.72rem', color: '#6b7280', textAlign: 'center' },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: '0.5rem',
  },
  inlineForm: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    marginTop: '0.5rem',
    flexWrap: 'wrap',
  },
  historyList: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    background: '#fafafa',
    borderRadius: '8px',
    fontSize: '0.82rem',
    flexWrap: 'wrap',
  },
  historyDate: { color: '#1a1a2e', fontWeight: 600 },
  historySvc: { color: '#6b7280', flex: 1, textAlign: 'center' },
  historyStatus: { color: '#9c27b0', fontWeight: 600, fontSize: '0.72rem' },
  notesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  noteItem: {
    background: '#fafafa',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
  },
  noteBody: { fontSize: '0.88rem', color: '#1a1a2e', margin: 0 },
  noteDate: { fontSize: '0.72rem', color: '#9ca3af' },
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
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  },
  hint: { fontSize: '0.8rem', color: '#9ca3af' },
};

export default CrmPage;
