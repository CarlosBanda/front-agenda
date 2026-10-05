import api from './axios';
import type { AppointmentStatus, Role } from '../types';

export const SupportCaseStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_USER: 'WAITING_USER',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;
export type SupportCaseStatus =
  (typeof SupportCaseStatus)[keyof typeof SupportCaseStatus];

export const SupportCasePriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type SupportCasePriority =
  (typeof SupportCasePriority)[keyof typeof SupportCasePriority];

export type BillingEventState = 'failed' | 'processed' | 'processing';

export interface PublicSupportUser {
  id: number;
  name: string;
  role: Role;
}

export interface SupportUser extends PublicSupportUser {
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupportBusiness {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  imageUrl: string | null;
  isActive: boolean;
  ownerId: number;
  owner?: SupportUser;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: number;
  caseId: number;
  authorId: number;
  author?: PublicSupportUser;
  body: string;
  internal: boolean;
  createdAt: string;
}

export interface SupportCase {
  id: number;
  folio: string;
  requesterId: number;
  requester?: PublicSupportUser;
  businessId: number | null;
  business?: SupportBusiness | null;
  subject: string;
  description: string;
  status: SupportCaseStatus;
  priority: SupportCasePriority;
  assignedAdminId: number | null;
  assignedAdmin?: PublicSupportUser | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface SupportCaseDetail extends SupportCase {
  messages: SupportMessage[];
}

export interface PaginatedSupportResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateSupportCaseInput {
  subject: string;
  description: string;
  businessId?: number;
}

export interface CreateAdminSupportCaseInput extends CreateSupportCaseInput {
  requesterId: number;
  priority?: SupportCasePriority;
}

export interface SupportCasesFilters {
  page?: number;
  limit?: number;
  status?: SupportCaseStatus;
  priority?: SupportCasePriority;
  requesterId?: number;
  businessId?: number;
  assignedAdminId?: number;
}

export interface UpdateSupportCaseInput {
  status?: SupportCaseStatus;
  priority?: SupportCasePriority;
  assignedAdminId?: number | null;
}

export interface SupportOverview {
  cases: Record<SupportCaseStatus, number>;
  unresolvedErrors: number;
  failedBillingEvents: number;
  processingBillingEvents: number;
}

export type SupportSearchResult =
  | ({ type: 'USER' } & SupportUser)
  | ({ type: 'BUSINESS' } & SupportBusiness);

export interface SupportSearchResponse {
  results: SupportSearchResult[];
}

export interface ContextAppointment {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  clientId: number;
  businessId: number;
  serviceId: number;
  staffId: number | null;
  client?: SupportUser;
  business?: SupportBusiness;
  service?: { id: number; name: string };
  staff?: { id: number; name: string } | null;
}

export interface ContextSubscription {
  id: number;
  businessId: number;
  planId: number;
  status: string;
  provider: string;
  cancelAtPeriodEnd: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  plan?: { id: number; name: string };
  business?: SupportBusiness;
}

export interface BillingEvent {
  eventId: string;
  type: string;
  businessId: number | null;
  processedAt: string | null;
  processingStartedAt: string | null;
  lastError: string | null;
  failedAt: string | null;
  attempts: number;
  createdAt: string;
}

export interface CheckoutAttemptSummary {
  businessId: number;
  planId: number;
  attemptId: string;
  stripeSessionId: string | null;
  expiresAt: string | null;
  processingStartedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSupportContext {
  user: SupportUser;
  businesses: SupportBusiness[];
  clientAppointments: ContextAppointment[];
  businessAppointments: ContextAppointment[];
  subscriptions: ContextSubscription[];
  cases: SupportCase[];
}

export interface BusinessSupportContext {
  business: SupportBusiness;
  appointments: ContextAppointment[];
  subscriptions: ContextSubscription[];
  checkoutAttempts: CheckoutAttemptSummary[];
  billingEvents: BillingEvent[];
}

export interface PlatformError {
  id: number;
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  errorName: string;
  sanitizedMessage: string;
  resolvedAt: string | null;
  resolvedById: number | null;
  resolvedBy?: SupportUser | null;
  createdAt: string;
}

export interface AdminAuditLog {
  id: number;
  adminId: number;
  admin?: SupportUser;
  action: string;
  method: string;
  path: string;
  targetType: string | null;
  targetId: string | null;
  statusCode: number;
  requestId: string;
  createdAt: string;
}

export const createCase = async (
  input: CreateSupportCaseInput,
): Promise<SupportCase> => {
  const { data } = await api.post<SupportCase>('/support/cases', input);
  return data;
};

export const getMyCases = async (
  page = 1,
  limit = 10,
): Promise<PaginatedSupportResponse<SupportCase>> => {
  const { data } = await api.get<PaginatedSupportResponse<SupportCase>>(
    '/support/cases/mine',
    { params: { page, limit } },
  );
  return data;
};

export const getCase = async (id: number): Promise<SupportCaseDetail> => {
  const { data } = await api.get<SupportCaseDetail>(`/support/cases/${id}`);
  return data;
};

export const addCaseMessage = async (
  id: number,
  body: string,
): Promise<SupportMessage> => {
  const { data } = await api.post<SupportMessage>(
    `/support/cases/${id}/messages`,
    { body },
  );
  return data;
};

export const getAdminOverview = async (): Promise<SupportOverview> => {
  const { data } = await api.get<SupportOverview>('/support/admin/overview');
  return data;
};

export const searchAdminSupport = async (
  query: string,
): Promise<SupportSearchResponse> => {
  const { data } = await api.get<SupportSearchResponse>('/support/admin/search', {
    params: { q: query },
  });
  return data;
};

export const getAdminUserContext = async (
  id: number,
): Promise<UserSupportContext> => {
  const { data } = await api.get<UserSupportContext>(
    `/support/admin/users/${id}/context`,
  );
  return data;
};

export const getAdminBusinessContext = async (
  id: number,
): Promise<BusinessSupportContext> => {
  const { data } = await api.get<BusinessSupportContext>(
    `/support/admin/businesses/${id}/context`,
  );
  return data;
};

export const getAdminCases = async (
  filters: SupportCasesFilters = {},
): Promise<PaginatedSupportResponse<SupportCase>> => {
  const { data } = await api.get<PaginatedSupportResponse<SupportCase>>(
    '/support/admin/cases',
    { params: filters },
  );
  return data;
};

export const getAdminCase = async (id: number): Promise<SupportCaseDetail> => {
  const { data } = await api.get<SupportCaseDetail>(
    `/support/admin/cases/${id}`,
  );
  return data;
};

export const createAdminCase = async (
  input: CreateAdminSupportCaseInput,
): Promise<SupportCase> => {
  const { data } = await api.post<SupportCase>('/support/admin/cases', input);
  return data;
};

export const updateAdminCase = async (
  id: number,
  input: UpdateSupportCaseInput,
): Promise<SupportCase> => {
  const { data } = await api.patch<SupportCase>(
    `/support/admin/cases/${id}`,
    input,
  );
  return data;
};

export const addAdminCaseMessage = async (
  id: number,
  body: string,
  internal: boolean,
): Promise<SupportMessage> => {
  const { data } = await api.post<SupportMessage>(
    `/support/admin/cases/${id}/messages`,
    { body, internal },
  );
  return data;
};

export const getAdminErrors = async (
  page = 1,
  limit = 10,
  unresolved?: boolean,
): Promise<PaginatedSupportResponse<PlatformError>> => {
  const { data } = await api.get<PaginatedSupportResponse<PlatformError>>(
    '/support/admin/errors',
    { params: { page, limit, unresolved } },
  );
  return data;
};

export const resolveAdminError = async (id: number): Promise<PlatformError> => {
  const { data } = await api.patch<PlatformError>(
    `/support/admin/errors/${id}/resolve`,
  );
  return data;
};

export const getAdminAudits = async (
  page = 1,
  limit = 10,
): Promise<PaginatedSupportResponse<AdminAuditLog>> => {
  const { data } = await api.get<PaginatedSupportResponse<AdminAuditLog>>(
    '/support/admin/audits',
    { params: { page, limit } },
  );
  return data;
};

export const getAdminBillingEvents = async (
  page = 1,
  limit = 10,
  state?: BillingEventState,
): Promise<PaginatedSupportResponse<BillingEvent>> => {
  const { data } = await api.get<PaginatedSupportResponse<BillingEvent>>(
    '/support/admin/billing-events',
    { params: { page, limit, state } },
  );
  return data;
};
