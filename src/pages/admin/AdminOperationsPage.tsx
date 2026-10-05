import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  Ticket,
  UserCheck,
  X,
} from 'lucide-react';
import * as supportApi from '../../api/support';
import type {
  AdminAuditLog,
  BillingEvent,
  BillingEventState,
  BusinessSupportContext,
  PaginatedSupportResponse,
  PlatformError,
  SupportCase,
  SupportCaseDetail,
  SupportCasePriority,
  SupportCaseStatus,
  SupportOverview,
  SupportSearchResult,
  UserSupportContext,
} from '../../api/support';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

type OperationsTab = 'overview' | 'cases' | 'search' | 'errors' | 'billing' | 'audits';

const tabs: { id: OperationsTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Resumen', icon: LayoutDashboard },
  { id: 'cases', label: 'Tickets', icon: Ticket },
  { id: 'search', label: 'Usuarios y negocios', icon: Search },
  { id: 'errors', label: 'Errores 5xx', icon: AlertCircle },
  { id: 'billing', label: 'Eventos Stripe', icon: CreditCard },
  { id: 'audits', label: 'Auditoría', icon: ShieldCheck },
];

const statuses = Object.values(supportApi.SupportCaseStatus);
const priorities = Object.values(supportApi.SupportCasePriority);

const statusLabels: Record<SupportCaseStatus, string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En atención',
  WAITING_USER: 'Esperando usuario',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
};

const priorityLabels: Record<SupportCasePriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '.65rem .8rem',
  border: '1px solid #d1d5db',
  borderRadius: '9px',
  background: '#fff',
  color: '#1f2937',
  fontSize: '.9rem',
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const getBillingState = (event: BillingEvent): string => {
  if (event.failedAt) return 'Fallido';
  if (event.processedAt) return 'Procesado';
  if (event.processingStartedAt) return 'Procesando';
  return 'Pendiente';
};

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}


interface NewAdminCaseTarget {
  requesterId: number;
  businessId?: number;
  label: string;
}
const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onChange }) => (
  <div className="ops-pagination">
    <button disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Página anterior"><ChevronLeft size={17} /></button>
    <span>Página {page} de {Math.max(totalPages, 1)}</span>
    <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Página siguiente"><ChevronRight size={17} /></button>
  </div>
);

const AdminOperationsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState<OperationsTab>('overview');
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<SupportOverview | null>(null);

  const [caseResult, setCaseResult] = useState<PaginatedSupportResponse<SupportCase> | null>(null);
  const [casePage, setCasePage] = useState(1);
  const [caseStatus, setCaseStatus] = useState<SupportCaseStatus | ''>('');
  const [casePriority, setCasePriority] = useState<SupportCasePriority | ''>('');
  const [selectedCase, setSelectedCase] = useState<SupportCaseDetail | null>(null);
  const [caseDetailLoading, setCaseDetailLoading] = useState(false);
  const [updatingCase, setUpdatingCase] = useState(false);
  const [message, setMessage] = useState('');
  const [internalMessage, setInternalMessage] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SupportSearchResult[]>([]);
  const [userContext, setUserContext] = useState<UserSupportContext | null>(null);
  const [businessContext, setBusinessContext] = useState<BusinessSupportContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [newCaseTarget, setNewCaseTarget] = useState<NewAdminCaseTarget | null>(null);
  const [newCaseSubject, setNewCaseSubject] = useState('');
  const [newCaseDescription, setNewCaseDescription] = useState('');
  const [newCasePriority, setNewCasePriority] = useState<SupportCasePriority>('MEDIUM');
  const [creatingCase, setCreatingCase] = useState(false);

  const [errorsResult, setErrorsResult] = useState<PaginatedSupportResponse<PlatformError> | null>(null);
  const [errorsPage, setErrorsPage] = useState(1);
  const [errorFilter, setErrorFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const [resolvingError, setResolvingError] = useState<number | null>(null);

  const [billingResult, setBillingResult] = useState<PaginatedSupportResponse<BillingEvent> | null>(null);
  const [billingPage, setBillingPage] = useState(1);
  const [billingState, setBillingState] = useState<BillingEventState | ''>('');

  const [auditResult, setAuditResult] = useState<PaginatedSupportResponse<AdminAuditLog> | null>(null);
  const [auditPage, setAuditPage] = useState(1);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      setOverview(await supportApi.getAdminOverview());
    } catch {
      showToast('No fue posible cargar el resumen operativo.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      setCaseResult(await supportApi.getAdminCases({
        page: casePage,
        limit: 12,
        ...(caseStatus ? { status: caseStatus } : {}),
        ...(casePriority ? { priority: casePriority } : {}),
      }));
    } catch {
      showToast('No fue posible cargar los tickets.', 'error');
    } finally {
      setLoading(false);
    }
  }, [casePage, casePriority, caseStatus, showToast]);

  const loadErrors = useCallback(async () => {
    setLoading(true);
    try {
      const unresolved = errorFilter === 'all' ? undefined : errorFilter === 'unresolved';
      setErrorsResult(await supportApi.getAdminErrors(errorsPage, 12, unresolved));
    } catch {
      showToast('No fue posible cargar los errores.', 'error');
    } finally {
      setLoading(false);
    }
  }, [errorFilter, errorsPage, showToast]);

  const loadBilling = useCallback(async () => {
    setLoading(true);
    try {
      setBillingResult(await supportApi.getAdminBillingEvents(
        billingPage,
        12,
        billingState || undefined,
      ));
    } catch {
      showToast('No fue posible cargar los eventos de facturación.', 'error');
    } finally {
      setLoading(false);
    }
  }, [billingPage, billingState, showToast]);

  const loadAudits = useCallback(async () => {
    setLoading(true);
    try {
      setAuditResult(await supportApi.getAdminAudits(auditPage, 15));
    } catch {
      showToast('No fue posible cargar la auditoría.', 'error');
    } finally {
      setLoading(false);
    }
  }, [auditPage, showToast]);

  useEffect(() => {
    if (tab === 'overview') void loadOverview();
    if (tab === 'cases') void loadCases();
    if (tab === 'errors') void loadErrors();
    if (tab === 'billing') void loadBilling();
    if (tab === 'audits') void loadAudits();
  }, [tab, loadOverview, loadCases, loadErrors, loadBilling, loadAudits]);

  const openCase = async (supportCase: SupportCase) => {
    setCaseDetailLoading(true);
    setSelectedCase({ ...supportCase, messages: [] });
    try {
      setSelectedCase(await supportApi.getAdminCase(supportCase.id));
    } catch {
      setSelectedCase(null);
      showToast('No fue posible abrir el ticket.', 'error');
    } finally {
      setCaseDetailLoading(false);
    }
  };

  const updateCase = async (input: supportApi.UpdateSupportCaseInput) => {
    if (!selectedCase) return;
    setUpdatingCase(true);
    try {
      await supportApi.updateAdminCase(selectedCase.id, input);
      setSelectedCase(await supportApi.getAdminCase(selectedCase.id));
      await loadCases();
      showToast('Ticket actualizado.', 'success');
    } catch {
      showToast('No fue posible actualizar el ticket.', 'error');
    } finally {
      setUpdatingCase(false);
    }
  };

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCase || !message.trim()) return;
    setSendingMessage(true);
    try {
      await supportApi.addAdminCaseMessage(selectedCase.id, message.trim(), internalMessage);
      setMessage('');
      setInternalMessage(false);
      setSelectedCase(await supportApi.getAdminCase(selectedCase.id));
      showToast(internalMessage ? 'Nota interna guardada.' : 'Respuesta enviada al usuario.', 'success');
    } catch {
      showToast('No fue posible guardar el mensaje.', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim().length < 2) {
      showToast('Escribe al menos dos caracteres.', 'warning');
      return;
    }
    setSearching(true);
    setUserContext(null);
    setBusinessContext(null);
    try {
      const response = await supportApi.searchAdminSupport(query.trim());
      setSearchResults(response.results);
      if (response.results.length === 0) showToast('No se encontraron coincidencias.', 'info');
    } catch {
      showToast('No fue posible realizar la búsqueda.', 'error');
    } finally {
      setSearching(false);
    }
  };

  const loadContext = async (result: SupportSearchResult) => {
    setContextLoading(true);
    setUserContext(null);
    setBusinessContext(null);
    try {
      if (result.type === 'USER') {
        setUserContext(await supportApi.getAdminUserContext(result.id));
      } else {
        setBusinessContext(await supportApi.getAdminBusinessContext(result.id));
      }
    } catch {
      showToast('No fue posible cargar el contexto consolidado.', 'error');
    } finally {
      setContextLoading(false);
    }
  };

  const openNewAdminCase = (target: NewAdminCaseTarget) => {
    setNewCaseTarget(target);
    setNewCaseSubject('');
    setNewCaseDescription('');
    setNewCasePriority('MEDIUM');
  };

  const createProactiveCase = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newCaseTarget || !newCaseSubject.trim() || !newCaseDescription.trim()) return;
    setCreatingCase(true);
    try {
      const created = await supportApi.createAdminCase({
        requesterId: newCaseTarget.requesterId,
        businessId: newCaseTarget.businessId,
        subject: newCaseSubject.trim(),
        description: newCaseDescription.trim(),
        priority: newCasePriority,
      });
      setNewCaseTarget(null);
      setTab('cases');
      await Promise.all([loadCases(), loadOverview(), openCase(created)]);
      showToast(`Ticket ${created.folio} abierto correctamente.`, 'success');
    } catch {
      showToast('No fue posible abrir el ticket.', 'error');
    } finally {
      setCreatingCase(false);
    }
  };

  const resolveError = async (id: number) => {
    setResolvingError(id);
    try {
      await supportApi.resolveAdminError(id);
      await Promise.all([loadErrors(), loadOverview()]);
      showToast('Error marcado como resuelto.', 'success');
    } catch {
      showToast('No fue posible resolver el error.', 'error');
    } finally {
      setResolvingError(null);
    }
  };

  const refreshTab = () => {
    if (tab === 'overview') void loadOverview();
    if (tab === 'cases') void loadCases();
    if (tab === 'errors') void loadErrors();
    if (tab === 'billing') void loadBilling();
    if (tab === 'audits') void loadAudits();
  };

  const renderOverview = () => {
    if (loading && !overview) return <LoadingSpinner />;
    if (!overview) return <p className="ops-empty">Sin datos disponibles.</p>;
    const cards = [
      ...statuses.map((status) => ({ label: statusLabels[status], value: overview.cases[status] ?? 0, color: '#e91e8c' })),
      { label: 'Errores sin resolver', value: overview.unresolvedErrors, color: '#dc2626' },
      { label: 'Eventos fallidos', value: overview.failedBillingEvents, color: '#f59e0b' },
      { label: 'Eventos procesando', value: overview.processingBillingEvents, color: '#2563eb' },
    ];
    return (
      <>
        <div className="overview-grid">
          {cards.map((card) => (
            <Card key={card.label}>
              <span className="metric-label">{card.label}</span>
              <strong className="metric-value" style={{ color: card.color }}>{card.value}</strong>
            </Card>
          ))}
        </div>
        <Card style={{ marginTop: '1rem' }}>
          <h2 className="section-title">Flujo operativo</h2>
          <p className="muted">Prioriza errores no resueltos y eventos fallidos; después atiende tickets urgentes o sin asignar. Nunca solicites secretos ni datos completos de tarjetas.</p>
        </Card>
      </>
    );
  };

  const renderCases = () => (
    <>
      <div className="toolbar">
        <label>Estado
          <select style={inputStyle} value={caseStatus} onChange={(event) => { setCaseStatus(event.target.value as SupportCaseStatus | ''); setCasePage(1); }}>
            <option value="">Todos</option>
            {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
          </select>
        </label>
        <label>Prioridad
          <select style={inputStyle} value={casePriority} onChange={(event) => { setCasePriority(event.target.value as SupportCasePriority | ''); setCasePage(1); }}>
            <option value="">Todas</option>
            {priorities.map((priority) => <option key={priority} value={priority}>{priorityLabels[priority]}</option>)}
          </select>
        </label>
      </div>
      {loading && !caseResult ? <LoadingSpinner /> : (
        <>
          <div className="responsive-table">
            <table>
              <thead><tr><th>Folio / asunto</th><th>Solicitante</th><th>Negocio</th><th>Estado</th><th>Prioridad</th><th>Asignado</th><th>Actualización</th></tr></thead>
              <tbody>
                {caseResult?.data.map((item) => (
                  <tr key={item.id} onClick={() => void openCase(item)} className="clickable-row">
                    <td><span className="mono">{item.folio}</span><strong className="cell-title">{item.subject}</strong></td>
                    <td>{item.requester?.name ?? `Usuario #${item.requesterId}`}</td>
                    <td>{item.business?.name ?? '—'}</td>
                    <td><span className="table-badge">{statusLabels[item.status]}</span></td>
                    <td>{priorityLabels[item.priority]}</td>
                    <td>{item.assignedAdmin?.name ?? 'Sin asignar'}</td>
                    <td>{formatDate(item.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {caseResult?.data.length === 0 && <p className="ops-empty">No hay tickets con estos filtros.</p>}
          </div>
          {caseResult && <Pagination page={casePage} totalPages={caseResult.totalPages} onChange={setCasePage} />}
        </>
      )}
    </>
  );

  const renderSearch = () => (
    <>
      <form className="search-form" onSubmit={handleSearch}>
        <input style={inputStyle} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, correo, teléfono o negocio" aria-label="Buscar usuario o negocio" />
        <Button type="submit" disabled={searching}><Search size={17} /> {searching ? 'Buscando…' : 'Buscar'}</Button>
      </form>
      <div className="search-layout">
        <Card style={{ padding: '1rem' }}>
          <h2 className="section-title">Resultados</h2>
          <div className="result-list">
            {searchResults.map((result) => (
              <button key={`${result.type}-${result.id}`} onClick={() => void loadContext(result)}>
                <strong>{result.name}</strong>
                <span>{result.type === 'USER' ? `${result.email} · ${result.role}` : `Negocio #${result.id} · ${result.phone ?? 'sin teléfono'}`}</span>
              </button>
            ))}
            {searchResults.length === 0 && <p className="muted">Busca para consultar contexto operativo consolidado.</p>}
          </div>
        </Card>
        <div>
          {contextLoading && <LoadingSpinner />}
          {userContext && (
            <Card>
              <div className="context-heading"><div><span className="eyebrow">Usuario</span><h2>{userContext.user.name}</h2></div><span className="table-badge">{userContext.user.role}</span></div>
              <p className="muted">{userContext.user.email} · {userContext.user.phone} · {userContext.user.isActive ? 'Activo' : 'Inactivo'}</p>
              <div className="context-metrics">
                <span><strong>{userContext.businesses.length}</strong> negocios</span>
                <span><strong>{userContext.clientAppointments.length + userContext.businessAppointments.length}</strong> citas</span>
                <span><strong>{userContext.subscriptions.length}</strong> suscripciones</span>
                <span><strong>{userContext.cases.length}</strong> tickets</span>
              </div>
              <Button size="sm" onClick={() => openNewAdminCase({ requesterId: userContext.user.id, label: userContext.user.name })}><Ticket size={16} /> Abrir ticket para este usuario</Button>
              <h3 className="subheading">Negocios</h3>
              {userContext.businesses.map((business) => <div className="context-row" key={business.id}><strong>{business.name}</strong><span>#{business.id} · {business.isActive ? 'Activo' : 'Inactivo'}</span></div>)}
              <h3 className="subheading">Tickets recientes</h3>
              {userContext.cases.slice(0, 8).map((item) => <button className="context-row context-button" key={item.id} onClick={() => { setTab('cases'); void openCase(item); }}><strong>{item.folio}</strong><span>{statusLabels[item.status]} · {item.subject}</span></button>)}
              <h3 className="subheading">Citas recientes</h3>
              {[...userContext.clientAppointments, ...userContext.businessAppointments].slice(0, 8).map((appointment) => <div className="context-row" key={`${appointment.clientId}-${appointment.id}`}><strong>{appointment.date} {appointment.startTime}</strong><span>{appointment.status} · {appointment.business?.name ?? `Negocio #${appointment.businessId}`}</span></div>)}
              <h3 className="subheading">Suscripciones</h3>
              {userContext.subscriptions.map((subscription) => <div className="context-row" key={subscription.id}><strong>{subscription.plan?.name ?? `Plan #${subscription.planId}`}</strong><span>{subscription.status} · hasta {subscription.endDate}</span></div>)}
            </Card>
          )}
          {businessContext && (
            <Card>
              <div className="context-heading"><div><span className="eyebrow">Negocio #{businessContext.business.id}</span><h2>{businessContext.business.name}</h2></div><span className="table-badge">{businessContext.business.isActive ? 'Activo' : 'Inactivo'}</span></div>
              <p className="muted">Propietario: {businessContext.business.owner?.name ?? `#${businessContext.business.ownerId}`} · {businessContext.business.phone ?? 'Sin teléfono'}</p>
              <div className="context-metrics">
                <span><strong>{businessContext.appointments.length}</strong> citas</span>
                <span><strong>{businessContext.subscriptions.length}</strong> suscripciones</span>
                <span><strong>{businessContext.checkoutAttempts.length}</strong> intentos</span>
                <span><strong>{businessContext.billingEvents.length}</strong> eventos</span>
              </div>
              <Button size="sm" onClick={() => openNewAdminCase({ requesterId: businessContext.business.ownerId, businessId: businessContext.business.id, label: businessContext.business.name })}><Ticket size={16} /> Abrir ticket para este negocio</Button>
              <h3 className="subheading">Suscripciones</h3>
              {businessContext.subscriptions.map((subscription) => <div className="context-row" key={subscription.id}><strong>{subscription.plan?.name ?? `Plan #${subscription.planId}`}</strong><span>{subscription.status} · {subscription.startDate} a {subscription.endDate}</span></div>)}
              <h3 className="subheading">Intentos de checkout (sin URL)</h3>
              {businessContext.checkoutAttempts.slice(0, 8).map((attempt) => <div className="context-row" key={attempt.attemptId}><strong>{attempt.attemptId}</strong><span>Plan #{attempt.planId} · {formatDate(attempt.createdAt)}</span></div>)}
              <h3 className="subheading">Eventos de facturación</h3>
              {businessContext.billingEvents.slice(0, 10).map((event) => <div className="context-row" key={event.eventId}><strong>{event.type}</strong><span>{getBillingState(event)} · {event.attempts} intento(s)</span></div>)}
              <h3 className="subheading">Citas recientes</h3>
              {businessContext.appointments.slice(0, 8).map((appointment) => <div className="context-row" key={appointment.id}><strong>{appointment.date} {appointment.startTime}</strong><span>{appointment.status} · {appointment.client?.name ?? `Cliente #${appointment.clientId}`}</span></div>)}
            </Card>
          )}
        </div>
      </div>
    </>
  );

  const renderErrors = () => (
    <>
      <div className="toolbar">
        <label>Resolución
          <select style={inputStyle} value={errorFilter} onChange={(event) => { setErrorFilter(event.target.value as typeof errorFilter); setErrorsPage(1); }}>
            <option value="unresolved">Sin resolver</option><option value="resolved">Resueltos</option><option value="all">Todos</option>
          </select>
        </label>
      </div>
      {loading && !errorsResult ? <LoadingSpinner /> : (
        <div className="card-list">
          {errorsResult?.data.map((error) => (
            <Card key={error.id}>
              <div className="list-heading"><div><span className="danger-code">{error.statusCode}</span> <strong>{error.errorName}</strong></div><span>{formatDate(error.createdAt)}</span></div>
              <p className="error-message">{error.sanitizedMessage}</p>
              <div className="technical-meta"><span>{error.method} {error.path}</span><span>requestId: <code>{error.requestId}</code></span></div>
              <div className="list-footer">
                <span>{error.resolvedAt ? `Resuelto ${formatDate(error.resolvedAt)}` : 'Pendiente de resolución'}</span>
                {!error.resolvedAt && <Button size="sm" disabled={resolvingError === error.id} onClick={() => void resolveError(error.id)}><CheckCircle size={16} /> {resolvingError === error.id ? 'Resolviendo…' : 'Resolver'}</Button>}
              </div>
            </Card>
          ))}
          {errorsResult?.data.length === 0 && <p className="ops-empty">No hay errores en esta vista.</p>}
          {errorsResult && <Pagination page={errorsPage} totalPages={errorsResult.totalPages} onChange={setErrorsPage} />}
        </div>
      )}
    </>
  );

  const renderBilling = () => (
    <>
      <div className="toolbar">
        <label>Estado
          <select style={inputStyle} value={billingState} onChange={(event) => { setBillingState(event.target.value as BillingEventState | ''); setBillingPage(1); }}>
            <option value="">Todos</option><option value="failed">Fallidos</option><option value="processing">Procesando</option><option value="processed">Procesados</option>
          </select>
        </label>
      </div>
      {loading && !billingResult ? <LoadingSpinner /> : (
        <>
          <div className="responsive-table"><table>
            <thead><tr><th>Evento</th><th>Tipo</th><th>Estado</th><th>Intentos</th><th>Business ID</th><th>Error</th><th>Fecha</th></tr></thead>
            <tbody>{billingResult?.data.map((event) => <tr key={event.eventId}>
              <td><span className="mono">{event.eventId}</span></td><td>{event.type}</td><td><span className="table-badge">{getBillingState(event)}</span></td><td>{event.attempts}</td><td>{event.businessId ?? '—'}</td><td className="error-cell">{event.lastError ?? '—'}</td><td>{formatDate(event.createdAt)}</td>
            </tr>)}</tbody>
          </table>{billingResult?.data.length === 0 && <p className="ops-empty">No hay eventos con este estado.</p>}</div>
          {billingResult && <Pagination page={billingPage} totalPages={billingResult.totalPages} onChange={setBillingPage} />}
        </>
      )}
    </>
  );

  const renderAudits = () => (
    loading && !auditResult ? <LoadingSpinner /> : (
      <>
        <div className="responsive-table"><table>
          <thead><tr><th>Administrador</th><th>Acción</th><th>Recurso</th><th>Resultado</th><th>Request ID</th><th>Fecha</th></tr></thead>
          <tbody>{auditResult?.data.map((audit) => <tr key={audit.id}>
            <td>{audit.admin?.name ?? `Admin #${audit.adminId}`}</td><td><strong>{audit.action}</strong><span className="cell-title">{audit.method} {audit.path}</span></td><td>{audit.targetType ? `${audit.targetType} ${audit.targetId ?? ''}` : '—'}</td><td>{audit.statusCode}</td><td><span className="mono">{audit.requestId}</span></td><td>{formatDate(audit.createdAt)}</td>
          </tr>)}</tbody>
        </table>{auditResult?.data.length === 0 && <p className="ops-empty">No hay registros de auditoría.</p>}</div>
        {auditResult && <Pagination page={auditPage} totalPages={auditResult.totalPages} onChange={setAuditPage} />}
      </>
    )
  );

  return (
    <main className="operations-page">
      <header className="operations-header">
        <div><span className="eyebrow">Administración</span><h1>Centro de operaciones</h1><p>Soporte, diagnóstico y trazabilidad en un solo lugar.</p></div>
        {tab !== 'search' && <Button variant="secondary" size="sm" onClick={refreshTab} disabled={loading}><RefreshCw size={16} /> Actualizar</Button>}
      </header>
      <div className="safe-notice"><ShieldCheck size={18} /><span>Trabaja solo con información operativa. No solicites ni publiques contraseñas, claves, datos completos de tarjetas o URLs de checkout.</span></div>
      <nav className="operations-tabs" aria-label="Secciones operativas">
        {tabs.map((item) => <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}><item.icon size={17} />{item.label}</button>)}
      </nav>
      <section className="operations-content">
        {tab === 'overview' && renderOverview()}
        {tab === 'cases' && renderCases()}
        {tab === 'search' && renderSearch()}
        {tab === 'errors' && renderErrors()}
        {tab === 'billing' && renderBilling()}
        {tab === 'audits' && renderAudits()}
      </section>

      {selectedCase && <div className="drawer-overlay" role="dialog" aria-modal="true" aria-label={`Ticket ${selectedCase.folio}`}>
        <aside className="case-drawer">
          <button className="drawer-close" onClick={() => { setSelectedCase(null); setMessage(''); setInternalMessage(false); }} aria-label="Cerrar"><X size={20} /></button>
          {caseDetailLoading ? <LoadingSpinner /> : <>
            <span className="mono">{selectedCase.folio}</span><h2>{selectedCase.subject}</h2>
            <p className="muted">{selectedCase.requester?.name ?? `Usuario #${selectedCase.requesterId}`} · {selectedCase.business?.name ?? 'Sin negocio asociado'}</p>
            <div className="drawer-controls">
              <label>Estado<select style={inputStyle} disabled={updatingCase} value={selectedCase.status} onChange={(event) => void updateCase({ status: event.target.value as SupportCaseStatus })}>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label>
              <label>Prioridad<select style={inputStyle} disabled={updatingCase} value={selectedCase.priority} onChange={(event) => void updateCase({ priority: event.target.value as SupportCasePriority })}>{priorities.map((priority) => <option key={priority} value={priority}>{priorityLabels[priority]}</option>)}</select></label>
            </div>
            <div className="assignment"><span>Asignado: <strong>{selectedCase.assignedAdmin?.name ?? 'Nadie'}</strong></span>{selectedCase.assignedAdminId !== user?.id && <Button size="sm" disabled={updatingCase || !user} onClick={() => user && void updateCase({ assignedAdminId: user.id })}><UserCheck size={16} /> Asignarme</Button>}</div>
            <div className="case-dates"><span>Creado {formatDate(selectedCase.createdAt)}</span><span>Actualizado {formatDate(selectedCase.updatedAt)}</span>{selectedCase.resolvedAt && <span>Resuelto {formatDate(selectedCase.resolvedAt)}</span>}</div>
            <section className="admin-conversation">
              <article className="admin-message user-message"><strong>{selectedCase.requester?.name ?? 'Solicitante'}</strong><p>{selectedCase.description}</p><time>{formatDate(selectedCase.createdAt)}</time></article>
              {selectedCase.messages.map((item) => <article key={item.id} className={`admin-message ${item.internal ? 'internal-note' : item.authorId === selectedCase.requesterId ? 'user-message' : 'agent-message'}`}><strong>{item.internal ? 'Nota interna' : item.author?.name ?? 'Soporte'}</strong><p>{item.body}</p><time>{formatDate(item.createdAt)}</time></article>)}
            </section>
            <form className="admin-reply" onSubmit={sendMessage}>
              <textarea style={{ ...inputStyle, minHeight: '95px', resize: 'vertical' }} value={message} onChange={(event) => setMessage(event.target.value)} maxLength={10000} placeholder={internalMessage ? 'Nota visible solo para administradores' : 'Respuesta visible para el usuario'} required disabled={selectedCase.status === 'CLOSED' && !internalMessage} />
              <div className="reply-toolbar"><label className="check-label"><input type="checkbox" checked={internalMessage} onChange={(event) => setInternalMessage(event.target.checked)} /> Nota interna</label><Button type="submit" size="sm" disabled={sendingMessage || !message.trim() || (selectedCase.status === 'CLOSED' && !internalMessage)}><MessageSquare size={16} /> {sendingMessage ? 'Guardando…' : internalMessage ? 'Guardar nota' : 'Responder'}</Button></div>
              {!internalMessage && <small className="muted">Esta respuesta será visible para el usuario. No solicites secretos.</small>}
            </form>
          </>}
        </aside>
      </div>}


      <Modal isOpen={Boolean(newCaseTarget)} onClose={() => !creatingCase && setNewCaseTarget(null)} title="Abrir ticket de soporte">
        <form className="new-case-form" onSubmit={createProactiveCase}>
          <p className="muted">Solicitante: <strong>{newCaseTarget?.label}</strong>. El usuario podrá consultar y responder este ticket.</p>
          <label>Asunto
            <input style={inputStyle} value={newCaseSubject} onChange={(event) => setNewCaseSubject(event.target.value)} maxLength={180} required />
          </label>
          <label>Descripción
            <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} value={newCaseDescription} onChange={(event) => setNewCaseDescription(event.target.value)} maxLength={10000} required />
          </label>
          <label>Prioridad
            <select style={inputStyle} value={newCasePriority} onChange={(event) => setNewCasePriority(event.target.value as SupportCasePriority)}>
              {priorities.map((priority) => <option key={priority} value={priority}>{priorityLabels[priority]}</option>)}
            </select>
          </label>
          <div className="modal-actions"><Button type="button" variant="secondary" disabled={creatingCase} onClick={() => setNewCaseTarget(null)}>Cancelar</Button><Button type="submit" disabled={creatingCase || !newCaseSubject.trim() || !newCaseDescription.trim()}><Ticket size={16} /> {creatingCase ? 'Abriendo…' : 'Abrir ticket'}</Button></div>
          <small className="muted">No incluyas contraseñas, claves, datos completos de tarjetas ni URLs de checkout.</small>
        </form>
      </Modal>
      <style>{`
        .operations-page { max-width: 1320px; margin: 0 auto; padding: 1.8rem 2rem 3rem; }
        .operations-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .operations-header h1 { font-size: 1.9rem; margin: .2rem 0; }
        .operations-header p, .muted { color: #6b7280; }
        .eyebrow { color: #e91e8c; text-transform: uppercase; letter-spacing: .08em; font-size: .75rem; font-weight: 800; }
        .safe-notice { display: flex; align-items: center; gap: .6rem; margin: 1.2rem 0; padding: .75rem 1rem; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; color: #1e40af; font-size: .85rem; }
        .operations-tabs { display: flex; gap: .4rem; overflow-x: auto; padding-bottom: .5rem; border-bottom: 1px solid #e5e7eb; }
        .operations-tabs button { display: inline-flex; align-items: center; gap: .4rem; white-space: nowrap; padding: .65rem .85rem; border: 0; border-radius: 9px; background: transparent; color: #6b7280; font-weight: 600; cursor: pointer; }
        .operations-tabs button.active { background: #fce7f3; color: #be185d; }
        .operations-content { padding-top: 1.2rem; }
        .overview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: .8rem; }
        .metric-label { display: block; color: #6b7280; font-size: .82rem; }.metric-value { display: block; font-size: 1.8rem; margin-top: .25rem; }
        .section-title { font-size: 1.05rem; margin-bottom: .7rem; }
        .toolbar { display: flex; flex-wrap: wrap; gap: .8rem; margin-bottom: 1rem; }
        .toolbar label, .drawer-controls label { display: flex; flex-direction: column; gap: .3rem; min-width: 180px; color: #4b5563; font-size: .78rem; font-weight: 700; }
        .responsive-table { width: 100%; overflow-x: auto; background: #fff; border-radius: 12px; box-shadow: 0 3px 14px rgba(0,0,0,.06); }
        table { width: 100%; border-collapse: collapse; min-width: 850px; } th { padding: .75rem; text-align: left; background: #fdf2f8; color: #4b5563; font-size: .75rem; } td { padding: .75rem; border-top: 1px solid #f3f4f6; color: #374151; font-size: .82rem; vertical-align: top; }
        .clickable-row { cursor: pointer; }.clickable-row:hover { background: #fff7fb; }
        .mono { display: block; max-width: 240px; color: #7c3aed; font: 700 .72rem ui-monospace, SFMono-Regular, Menlo, monospace; overflow-wrap: anywhere; }
        .cell-title { display: block; margin-top: .2rem; color: #1f2937; }.table-badge { display: inline-flex; padding: .2rem .55rem; border-radius: 999px; background: #f3f4f6; font-size: .72rem; font-weight: 700; }
        .ops-pagination { display: flex; align-items: center; justify-content: center; gap: .8rem; margin-top: 1rem; color: #6b7280; font-size: .82rem; }.ops-pagination button { display: grid; place-items: center; width: 34px; height: 34px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; cursor: pointer; }.ops-pagination button:disabled { opacity: .4; cursor: not-allowed; }
        .ops-empty { padding: 2rem; text-align: center; color: #9ca3af; }
        .search-form { display: flex; gap: .6rem; margin-bottom: 1rem; }.search-layout { display: grid; grid-template-columns: minmax(260px, .7fr) minmax(420px, 1.5fr); gap: 1rem; align-items: start; }
        .result-list { display: flex; flex-direction: column; gap: .45rem; }.result-list button, .context-button { width: 100%; border: 1px solid #e5e7eb; border-radius: 9px; background: #fff; padding: .7rem; text-align: left; cursor: pointer; }.result-list button:hover { border-color: #e91e8c; }.result-list span, .context-row span { display: block; color: #6b7280; font-size: .76rem; }
        .context-heading, .list-heading, .list-footer, .assignment, .reply-toolbar { display: flex; align-items: center; justify-content: space-between; gap: .8rem; }.context-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem; margin: 1rem 0; }.context-metrics span { padding: .65rem; background: #f9fafb; border-radius: 9px; text-align: center; color: #6b7280; font-size: .72rem; }.context-metrics strong { display: block; color: #e91e8c; font-size: 1.15rem; }
        .subheading { margin: 1rem 0 .4rem; font-size: .9rem; }.context-row { padding: .5rem 0; border-bottom: 1px solid #f3f4f6; font-size: .82rem; }.context-button { border-width: 0 0 1px; border-radius: 0; }
        .card-list { display: grid; gap: .8rem; }.list-heading > span, .list-footer { color: #6b7280; font-size: .75rem; }.danger-code { display: inline-flex; padding: .15rem .45rem; border-radius: 6px; background: #fee2e2; color: #b91c1c; font-weight: 800; }.error-message { margin: .7rem 0; overflow-wrap: anywhere; }.technical-meta { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .4rem; padding: .6rem; background: #f9fafb; color: #4b5563; font-size: .75rem; border-radius: 7px; }.list-footer { margin-top: .7rem; }.error-cell { max-width: 270px; overflow-wrap: anywhere; color: #b91c1c; }
        .drawer-overlay { position: fixed; inset: 0; z-index: 1900; display: flex; justify-content: flex-end; background: rgba(17,24,39,.5); }.case-drawer { position: relative; width: min(720px, 100%); height: 100%; overflow-y: auto; padding: 1.7rem; background: #fff; box-shadow: -10px 0 35px rgba(0,0,0,.15); }.drawer-close { position: absolute; top: 1rem; right: 1rem; display: grid; place-items: center; width: 36px; height: 36px; border: 0; border-radius: 50%; cursor: pointer; }.case-drawer h2 { margin: .35rem 2.5rem .35rem 0; }.drawer-controls { display: grid; grid-template-columns: 1fr 1fr; gap: .7rem; margin: 1rem 0; }.assignment { padding: .7rem; background: #f9fafb; border-radius: 9px; font-size: .84rem; }.case-dates { display: flex; flex-wrap: wrap; gap: .7rem; margin: .7rem 0; color: #6b7280; font-size: .72rem; }
        .admin-conversation { display: flex; flex-direction: column; gap: .65rem; max-height: 42vh; overflow-y: auto; padding: .8rem; background: #f9fafb; border-radius: 11px; }.admin-message { max-width: 88%; padding: .7rem .85rem; border-radius: 10px; background: #fff; border: 1px solid #e5e7eb; }.admin-message p { white-space: pre-wrap; overflow-wrap: anywhere; margin: .2rem 0; }.admin-message strong { font-size: .78rem; }.admin-message time { color: #9ca3af; font-size: .68rem; }.user-message { align-self: flex-start; }.agent-message { align-self: flex-end; border-color: #f9a8d4; background: #fdf2f8; }.internal-note { align-self: stretch; max-width: 100%; border-color: #fbbf24; background: #fffbeb; }.admin-reply { margin-top: .8rem; }.reply-toolbar { margin: .6rem 0 .3rem; }.check-label { display: flex; align-items: center; gap: .4rem; color: #4b5563; font-size: .82rem; }
        .new-case-form { display: flex; flex-direction: column; gap: .9rem; }.new-case-form label { display: flex; flex-direction: column; gap: .35rem; color: #4b5563; font-size: .8rem; font-weight: 700; }.modal-actions { display: flex; justify-content: flex-end; gap: .6rem; }
        @media (max-width: 800px) { .operations-page { padding: 1.2rem 1rem 2rem; }.operations-header { align-items: flex-start; }.search-layout { grid-template-columns: 1fr; }.context-metrics { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .operations-header { flex-direction: column; }.search-form { flex-direction: column; }.search-form button { width: 100% !important; }.safe-notice { align-items: flex-start; }.case-drawer { padding: 1.2rem 1rem; }.drawer-controls { grid-template-columns: 1fr; }.assignment, .reply-toolbar { align-items: stretch; flex-direction: column; }.reply-toolbar button { width: 100% !important; } }
      `}</style>
    </main>
  );
};

export default AdminOperationsPage;
