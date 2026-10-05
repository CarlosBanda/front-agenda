// Enums
export const Role = {
  CLIENT: 'CLIENT',
  BUSINESS: 'BUSINESS',
  ADMIN: 'ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const AppointmentStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW',
} as const;
export type AppointmentStatus =
  (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const DepositStatus = {
  NOT_REQUIRED: 'NOT_REQUIRED',
  PENDING: 'PENDING',
  PAID: 'PAID',
  WAIVED: 'WAIVED',
  REFUNDED: 'REFUNDED',
} as const;
export type DepositStatus =
  (typeof DepositStatus)[keyof typeof DepositStatus];

export const ChargeType = {
  NONE: 'NONE',
  FIXED: 'FIXED',
  PERCENT: 'PERCENT',
} as const;
export type ChargeType = (typeof ChargeType)[keyof typeof ChargeType];

export const ClientSource = {
  MANUAL: 'MANUAL',
  IMPORTED: 'IMPORTED',
  LINKED: 'LINKED',
} as const;
export type ClientSource = (typeof ClientSource)[keyof typeof ClientSource];

export const OnboardingStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;
export type OnboardingStatus =
  (typeof OnboardingStatus)[keyof typeof OnboardingStatus];

export const ReminderAttemptStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
} as const;
export type ReminderAttemptStatus =
  (typeof ReminderAttemptStatus)[keyof typeof ReminderAttemptStatus];

export const QuickAction = {
  CONFIRM: 'CONFIRM',
  COMPLETE: 'COMPLETE',
  CANCEL: 'CANCEL',
  NO_SHOW: 'NO_SHOW',
} as const;
export type QuickAction = (typeof QuickAction)[keyof typeof QuickAction];

export const DayOfWeek = {
  MONDAY: 'MONDAY',
  TUESDAY: 'TUESDAY',
  WEDNESDAY: 'WEDNESDAY',
  THURSDAY: 'THURSDAY',
  FRIDAY: 'FRIDAY',
  SATURDAY: 'SATURDAY',
  SUNDAY: 'SUNDAY',
} as const;
export type DayOfWeek = (typeof DayOfWeek)[keyof typeof DayOfWeek];

// Entities
export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
}

export interface Business {
  id: number;
  name: string;
  description: string;
  address: string;
  phone: string;
  imageUrl: string;
  isActive: boolean;
  ownerId: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  isActive: boolean;
  businessId: number;
}

export interface Staff {
  id: number;
  name: string;
  specialty: string;
  phone: string;
  imageUrl: string;
  isActive: boolean;
  businessId: number;
}

export interface Appointment {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string;
  clientId: number | null;
  clientRecordId?: number | null;
  businessId: number;
  serviceId: number;
  staffId: number;
  client?: User | null;
  clientRecord?: Client | null;
  business?: Business;
  service?: Service;
  staff?: Staff;
  depositStatus?: DepositStatus;
  depositAmount?: string | null;
  depositPaidAmount?: string | null;
  depositPaidAt?: string | null;
  depositMethod?: string | null;
  depositNote?: string | null;
}

export interface Schedule {
  id: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isActive: boolean;
  businessId: number;
  staffId?: number;
}

export interface BlockedSlot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  businessId: number;
  staffId?: number;
}

// DTOs
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  phone: string;
  role?: Role;
}

export interface CreateBusinessDto {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  imageUrl?: string;
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  price: number;
  duration: number;
  businessId: number;
}

export interface CreateStaffDto {
  name: string;
  specialty?: string;
  phone?: string;
  imageUrl?: string;
  businessId: number;
}

export interface CreateAppointmentDto {
  date: string;
  startTime: string;
  businessId: number;
  serviceId: number;
  staffId?: number;
  notes?: string;
}

// Responses
export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
}

// ---------------------------------------------------------------------------
// Agenda / CRM / Policies / Reminders / Onboarding (coordinated with backend)
// ---------------------------------------------------------------------------

// CRM
export interface ClientTag {
  id: number;
  businessId: number;
  name: string;
  color: string | null;
  createdAt?: string;
}

export interface Client {
  id: number;
  businessId: number;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  source: ClientSource;
  linkedUserId: number | null;
  linkedUser?: User | null;
  isActive: boolean;
  tags?: ClientTag[];
  createdAt: string;
  updatedAt?: string;
}

export interface ClientNote {
  id: number;
  clientId: number;
  authorId: number;
  body: string;
  createdAt: string;
}

export interface CreateClientDto {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export type UpdateClientDto = Partial<CreateClientDto>;

export interface CreateTagDto {
  name: string;
  color?: string;
}

export interface ImportClientsDto {
  content: string;
  hasHeader?: boolean;
  defaultTagIds?: number[];
}

export interface ImportResult {
  totalRows: number;
  created: number;
  duplicatesInFile: number;
  duplicatesInDb: number;
  invalid: number;
  tagsCreated: number;
  errors: { row: number; reason: string }[];
}

export interface ClientMetrics {
  clientId: number;
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    upcoming: number;
  };
  totalSpent: string;
  depositsPaid: string;
  lastVisit: string | null;
}

export interface BusinessMetrics {
  clients: {
    total: number;
    imported: number;
    linked: number;
    manual: number;
    newThisMonth: number;
  };
  appointments: {
    byStatus: Record<AppointmentStatus, number>;
    noShowRate: number;
  };
  tags: { id: number; name: string; clients: number }[];
}

// Agenda
export interface AgendaRangeResponse {
  businessId: number;
  from: string;
  to: string;
  total: number;
  appointments: Appointment[];
}

export interface DepositDto {
  status: DepositStatus;
  amount?: number;
  paidAmount?: number;
  method?: string;
  note?: string;
}

// Policies
export interface BusinessPolicy {
  businessId: number;
  depositType: ChargeType;
  depositValue: string;
  currency: string;
  cancellationWindowHours: number;
  cancellationFeeType: ChargeType;
  cancellationFeeValue: string;
  policyText: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpsertPolicyDto {
  depositType?: ChargeType;
  depositValue?: number;
  currency?: string;
  cancellationWindowHours?: number;
  cancellationFeeType?: ChargeType;
  cancellationFeeValue?: number;
  policyText?: string;
}

// Reminders (WhatsApp) — never exposes provider tokens
export interface ReminderSetting {
  businessId: number;
  whatsappEnabled: boolean;
  providerEnabled: boolean;
  hoursBefore: number;
  messageTemplate: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpsertReminderSettingDto {
  whatsappEnabled?: boolean;
  hoursBefore?: number;
  messageTemplate?: string;
}

export interface WhatsappReminderAttempt {
  id: number;
  appointmentId: number;
  businessId: number;
  idempotencyKey: string;
  status: ReminderAttemptStatus;
  providerMessageId: string | null;
  sanitizedError: string | null;
  createdAt: string;
  updatedAt?: string;
}

// Onboarding
export interface OnboardingState {
  businessId: number;
  status: OnboardingStatus;
  profileCompleted: boolean;
  servicesConfigured: boolean;
  scheduleConfigured: boolean;
  staffConfigured: boolean;
  policiesConfigured: boolean;
  clientsImported: boolean;
  remindersReviewed: boolean;
  completedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface OnboardingImportResponse {
  import: ImportResult;
  onboarding: OnboardingState;
}

export interface UpdateOnboardingDto {
  profileCompleted?: boolean;
  servicesConfigured?: boolean;
  scheduleConfigured?: boolean;
  staffConfigured?: boolean;
  policiesConfigured?: boolean;
  clientsImported?: boolean;
  remindersReviewed?: boolean;
}
