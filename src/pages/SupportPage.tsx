import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  LifeBuoy,
  MessageCircle,
  Plus,
  Send,
  X,
} from 'lucide-react';
import * as businessesApi from '../api/businesses';
import * as supportApi from '../api/support';
import type { SupportCase, SupportCaseDetail } from '../api/support';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Business } from '../types';

const statusLabels: Record<supportApi.SupportCaseStatus, string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En atención',
  WAITING_USER: 'Esperando tu respuesta',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
};

const priorityLabels: Record<supportApi.SupportCasePriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

const statusColors: Record<supportApi.SupportCaseStatus, { background: string; color: string }> = {
  OPEN: { background: '#dbeafe', color: '#1d4ed8' },
  IN_PROGRESS: { background: '#fef3c7', color: '#92400e' },
  WAITING_USER: { background: '#fce7f3', color: '#9d174d' },
  RESOLVED: { background: '#d1fae5', color: '#065f46' },
  CLOSED: { background: '#e5e7eb', color: '#374151' },
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  border: '2px solid #e5e7eb',
  borderRadius: '10px',
  background: '#fff',
  color: '#1a1a2e',
  fontSize: '0.95rem',
};

const formatDate = (value: string | null): string => {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const SupportPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedCase, setSelectedCase] = useState<SupportCaseDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const response = await supportApi.getMyCases(page, 10);
      setCases(response.data);
      setTotalPages(Math.max(response.totalPages, 1));
    } catch {
      showToast('No fue posible cargar tus solicitudes de soporte.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  useEffect(() => {
    void loadCases();
  }, [loadCases]);

  useEffect(() => {
    if (user?.role !== 'BUSINESS') return;
    const loadBusinesses = async () => {
      try {
        setBusinesses(await businessesApi.getMine());
      } catch {
        showToast('No fue posible cargar tus negocios.', 'error');
      }
    };
    void loadBusinesses();
  }, [user?.role, showToast]);

  const openDetail = async (supportCase: SupportCase) => {
    setDetailLoading(true);
    setSelectedCase({ ...supportCase, messages: [] });
    try {
      setSelectedCase(await supportApi.getCase(supportCase.id));
    } catch {
      setSelectedCase(null);
      showToast('No fue posible abrir la solicitud.', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const resetCreateForm = () => {
    setSubject('');
    setDescription('');
    setBusinessId('');
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!subject.trim() || !description.trim()) {
      showToast('Escribe el asunto y la descripción.', 'warning');
      return;
    }
    setCreating(true);
    try {
      const created = await supportApi.createCase({
        subject: subject.trim(),
        description: description.trim(),
        ...(businessId ? { businessId: Number(businessId) } : {}),
      });
      resetCreateForm();
      setIsCreateOpen(false);
      setPage(1);
      await loadCases();
      showToast(`Solicitud ${created.folio} creada correctamente.`, 'success');
      await openDetail(created);
    } catch {
      showToast('No fue posible crear la solicitud.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCase || !reply.trim()) return;
    setSending(true);
    try {
      await supportApi.addCaseMessage(selectedCase.id, reply.trim());
      setReply('');
      setSelectedCase(await supportApi.getCase(selectedCase.id));
      showToast('Respuesta enviada.', 'success');
    } catch {
      showToast('No fue posible enviar la respuesta.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="support-page">
      <header className="support-header">
        <div>
          <span className="support-kicker"><LifeBuoy size={17} /> Centro de ayuda</span>
          <h1>Soporte</h1>
          <p>Consulta tus solicitudes o cuéntanos cómo podemos ayudarte.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus size={18} /> Nueva solicitud
        </Button>
      </header>

      <div className="security-notice" role="note">
        <AlertTriangle size={21} />
        <div>
          <strong>Protege tu información.</strong>
          <p>No compartas contraseñas, claves de acceso, códigos de verificación ni datos completos de tarjetas.</p>
        </div>
      </div>

      {loading && cases.length === 0 ? (
        <LoadingSpinner />
      ) : cases.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <MessageCircle size={42} color="#e91e8c" />
          <h2 style={{ margin: '0.8rem 0 0.4rem' }}>Aún no tienes solicitudes</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.2rem' }}>Crea una solicitud si necesitas ayuda con GlamBook.</p>
          <Button onClick={() => setIsCreateOpen(true)}>Crear solicitud</Button>
        </Card>
      ) : (
        <>
          <section className="case-grid" aria-label="Solicitudes de soporte">
            {cases.map((supportCase) => (
              <Card key={supportCase.id} onClick={() => void openDetail(supportCase)}>
                <div className="case-card-header">
                  <span className="folio">{supportCase.folio}</span>
                  <span className="badge" style={statusColors[supportCase.status]}>
                    {statusLabels[supportCase.status]}
                  </span>
                </div>
                <h2 className="case-subject">{supportCase.subject}</h2>
                <p className="case-description">{supportCase.description}</p>
                <div className="case-meta">
                  <span>Prioridad: <strong>{priorityLabels[supportCase.priority]}</strong></span>
                  <span>Creada: {formatDate(supportCase.createdAt)}</span>
                  <span>Actualizada: {formatDate(supportCase.updatedAt)}</span>
                  {supportCase.business && <span>Negocio: {supportCase.business.name}</span>}
                </div>
              </Card>
            ))}
          </section>
          <nav className="pagination" aria-label="Paginación">
            <button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} aria-label="Página anterior">
              <ChevronLeft size={18} />
            </button>
            <span>Página {page} de {totalPages}</span>
            <button disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} aria-label="Página siguiente">
              <ChevronRight size={18} />
            </button>
          </nav>
        </>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nueva solicitud">
        <form className="support-form" onSubmit={handleCreate}>
          <Input
            label="Asunto"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            maxLength={200}
            placeholder="Describe brevemente el problema"
            required
          />
          {user?.role === 'BUSINESS' && (
            <label className="field-label">
              Negocio (opcional)
              <select style={fieldStyle} value={businessId} onChange={(event) => setBusinessId(event.target.value)}>
                <option value="">Sin asociar a un negocio</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>{business.name}</option>
                ))}
              </select>
            </label>
          )}
          <label className="field-label">
            Descripción
            <textarea
              style={{ ...fieldStyle, minHeight: '150px', resize: 'vertical' }}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={10000}
              placeholder="Incluye pasos, fechas y mensajes de error, sin datos sensibles."
              required
            />
          </label>
          <div className="inline-warning"><AlertTriangle size={17} /> Nunca incluyas contraseñas, claves ni tarjetas.</div>
          <Button type="submit" fullWidth disabled={creating}>
            {creating ? 'Creando…' : 'Crear solicitud'}
          </Button>
        </form>
      </Modal>

      {selectedCase && (
        <div className="detail-overlay" role="dialog" aria-modal="true" aria-label={`Solicitud ${selectedCase.folio}`}>
          <aside className="detail-panel">
            <button className="detail-close" onClick={() => { setSelectedCase(null); setReply(''); }} aria-label="Cerrar detalle">
              <X size={22} />
            </button>
            {detailLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                <div className="detail-heading">
                  <span className="folio">{selectedCase.folio}</span>
                  <h2>{selectedCase.subject}</h2>
                  <div className="detail-badges">
                    <span className="badge" style={statusColors[selectedCase.status]}>{statusLabels[selectedCase.status]}</span>
                    <span className="priority-badge">Prioridad {priorityLabels[selectedCase.priority]}</span>
                  </div>
                </div>
                <div className="detail-dates">
                  <span>Creada: {formatDate(selectedCase.createdAt)}</span>
                  <span>Actualizada: {formatDate(selectedCase.updatedAt)}</span>
                  {selectedCase.resolvedAt && <span>Resuelta: {formatDate(selectedCase.resolvedAt)}</span>}
                </div>
                <section className="conversation">
                  <article className="message requester-message">
                    <strong>{selectedCase.requester?.name ?? 'Tú'}</strong>
                    <p>{selectedCase.description}</p>
                    <time>{formatDate(selectedCase.createdAt)}</time>
                  </article>
                  {selectedCase.messages.map((message) => {
                    const ownMessage = message.authorId === user?.id;
                    return (
                      <article key={message.id} className={`message ${ownMessage ? 'requester-message' : 'support-message'}`}>
                        <strong>{ownMessage ? 'Tú' : message.author?.name ?? 'Equipo de soporte'}</strong>
                        <p>{message.body}</p>
                        <time>{formatDate(message.createdAt)}</time>
                      </article>
                    );
                  })}
                  {selectedCase.messages.length === 0 && <p className="empty-conversation">Aún no hay respuestas adicionales.</p>}
                </section>
                <form className="reply-form" onSubmit={handleReply}>
                  <label className="field-label">
                    Responder
                    <textarea
                      style={{ ...fieldStyle, minHeight: '100px', resize: 'vertical' }}
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      maxLength={10000}
                      placeholder="Escribe información adicional sin datos sensibles."
                      required
                      disabled={selectedCase.status === 'CLOSED'}
                    />
                  </label>
                  <div className="reply-actions">
                    <small>
                      {selectedCase.status === 'CLOSED'
                        ? 'Esta solicitud está cerrada. Crea una nueva si necesitas más ayuda.'
                        : 'No compartas contraseñas, claves ni tarjetas.'}
                    </small>
                    <Button
                      type="submit"
                      disabled={
                        sending || !reply.trim() || selectedCase.status === 'CLOSED'
                      }
                    >
                      <Send size={17} /> {sending ? 'Enviando…' : 'Enviar'}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </aside>
        </div>
      )}

      <style>{`
        .support-page { max-width: 1180px; margin: 0 auto; padding: 2rem; }
        .support-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
        .support-header h1 { font-size: 2rem; margin: .25rem 0; }
        .support-header p, .case-description { color: #6b7280; }
        .support-kicker { display: inline-flex; align-items: center; gap: .4rem; color: #e91e8c; font-weight: 700; font-size: .85rem; text-transform: uppercase; letter-spacing: .06em; }
        .security-notice { display: flex; gap: .8rem; padding: 1rem 1.2rem; margin-bottom: 1.5rem; border: 1px solid #fbbf24; border-radius: 12px; color: #78350f; background: #fffbeb; }
        .security-notice p { font-size: .9rem; }
        .case-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 1rem; }
        .case-card-header, .detail-badges, .reply-actions { display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
        .folio { font: 700 .8rem ui-monospace, SFMono-Regular, Menlo, monospace; color: #7c3aed; overflow-wrap: anywhere; }
        .badge, .priority-badge { display: inline-flex; padding: .25rem .65rem; border-radius: 999px; font-size: .75rem; font-weight: 700; }
        .priority-badge { color: #374151; background: #f3f4f6; }
        .case-subject { font-size: 1.1rem; margin: .8rem 0 .35rem; }
        .case-description { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; font-size: .9rem; }
        .case-meta { display: grid; gap: .2rem; margin-top: 1rem; padding-top: .8rem; border-top: 1px solid #f3f4f6; color: #6b7280; font-size: .78rem; }
        .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1.5rem; color: #6b7280; font-size: .9rem; }
        .pagination button { display: grid; place-items: center; width: 38px; height: 38px; border: 1px solid #e5e7eb; border-radius: 9px; background: #fff; cursor: pointer; }
        .pagination button:disabled { opacity: .4; cursor: not-allowed; }
        .support-form, .field-label { display: flex; flex-direction: column; gap: .45rem; }
        .support-form { gap: 1rem; }
        .field-label { color: #1a1a2e; font-size: .9rem; font-weight: 600; }
        .inline-warning { display: flex; align-items: center; gap: .4rem; color: #92400e; font-size: .82rem; }
        .detail-overlay { position: fixed; inset: 0; z-index: 1900; background: rgba(17,24,39,.5); display: flex; justify-content: flex-end; }
        .detail-panel { width: min(680px, 100%); height: 100%; overflow-y: auto; background: #fff; padding: 2rem; box-shadow: -10px 0 35px rgba(0,0,0,.16); position: relative; }
        .detail-close { position: absolute; top: 1rem; right: 1rem; display: grid; place-items: center; border: 0; background: #f3f4f6; border-radius: 50%; width: 38px; height: 38px; cursor: pointer; }
        .detail-heading { padding-right: 3rem; }
        .detail-heading h2 { margin: .5rem 0 .8rem; font-size: 1.5rem; }
        .detail-badges { justify-content: flex-start; }
        .detail-dates { display: flex; flex-wrap: wrap; gap: .35rem 1rem; color: #6b7280; font-size: .78rem; margin: 1rem 0; }
        .conversation { display: flex; flex-direction: column; gap: .8rem; padding: 1rem; min-height: 220px; max-height: 48vh; overflow-y: auto; background: #f9fafb; border-radius: 14px; }
        .message { max-width: 85%; padding: .8rem 1rem; border-radius: 13px; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
        .message strong { font-size: .82rem; }
        .message p { white-space: pre-wrap; overflow-wrap: anywhere; margin: .2rem 0; }
        .message time { color: #6b7280; font-size: .7rem; }
        .requester-message { align-self: flex-end; background: #fce7f3; }
        .support-message { align-self: flex-start; background: #fff; border: 1px solid #e5e7eb; }
        .empty-conversation { margin: auto; color: #9ca3af; font-size: .9rem; }
        .reply-form { margin-top: 1rem; }
        .reply-actions { margin-top: .7rem; }
        .reply-actions small { color: #92400e; }
        @media (max-width: 640px) {
          .support-page { padding: 1.2rem 1rem; }
          .support-header { align-items: flex-start; flex-direction: column; }
          .support-header button { width: 100% !important; }
          .detail-panel { padding: 1.3rem 1rem; }
          .reply-actions { align-items: stretch; flex-direction: column; }
          .reply-actions button { width: 100% !important; }
          .message { max-width: 94%; }
        }
      `}</style>
    </main>
  );
};

export default SupportPage;
