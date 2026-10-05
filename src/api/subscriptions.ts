import api from './axios';
import type { PaginatedResponse } from '../types';

export interface Plan {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billingInterval: 'MONTH' | 'YEAR';
  duration: number;
  features: string[] | null;
  maxServices: number;
  maxStaff: number;
  maxAppointmentsPerMonth: number;
  providerPriceId: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface Subscription {
  id: number;
  businessId: number;
  planId: number;
  status: 'INCOMPLETE' | 'ACTIVE' | 'PAST_DUE' | 'EXPIRED' | 'CANCELLED' | 'TRIAL';
  provider: string;
  providerSubscriptionId: string | null;
  providerCustomerId: string | null;
  cancelAtPeriodEnd: boolean;
  startDate: string;
  endDate: string;
  business?: { id: number; name: string; phone: string; isActive: boolean };
  plan?: Plan;
  createdAt: string;
}

export interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  totalPlans: number;
}

export interface CreatePlanDto {
  slug: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingInterval: 'MONTH' | 'YEAR';
  duration: number;
  features?: string[];
  maxServices?: number;
  maxStaff?: number;
  maxAppointmentsPerMonth?: number;
  providerPriceId?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateSubscriptionDto {
  businessId: number;
  planId: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// --- PUBLIC ---
export const getPlans = async (): Promise<Plan[]> => {
  const { data } = await api.get<Plan[]>('/subscriptions/plans');
  return data;
};

// --- ADMIN: Plans ---
export const getPlansAdmin = async (): Promise<Plan[]> => {
  const { data } = await api.get<Plan[]>('/subscriptions/admin/plans');
  return data;
};

export const createPlan = async (dto: CreatePlanDto): Promise<Plan> => {
  const { data } = await api.post<Plan>('/subscriptions/admin/plans', dto);
  return data;
};

export const updatePlan = async (id: number, dto: Partial<CreatePlanDto>): Promise<Plan> => {
  const { data } = await api.put<Plan>(`/subscriptions/admin/plans/${id}`, dto);
  return data;
};

export const removePlan = async (id: number): Promise<void> => {
  await api.delete(`/subscriptions/admin/plans/${id}`);
};

// --- ADMIN: Subscriptions ---
export const getSubscriptionStats = async (): Promise<SubscriptionStats> => {
  const { data } = await api.get<SubscriptionStats>('/subscriptions/admin/stats');
  return data;
};

export const getSubscriptions = async (page?: number, limit?: number): Promise<PaginatedResponse<Subscription>> => {
  const { data } = await api.get<PaginatedResponse<Subscription>>('/subscriptions/admin', {
    params: { page, limit },
  });
  return data;
};

export const createSubscription = async (dto: CreateSubscriptionDto): Promise<Subscription> => {
  const { data } = await api.post<Subscription>('/subscriptions/admin', dto);
  return data;
};

export const updateSubscription = async (id: number, dto: Partial<CreateSubscriptionDto>): Promise<Subscription> => {
  const { data } = await api.put<Subscription>(`/subscriptions/admin/${id}`, dto);
  return data;
};

export const cancelSubscription = async (id: number): Promise<void> => {
  await api.delete(`/subscriptions/admin/${id}`);
};

// --- BUSINESS ---
export const getMySubscription = async (businessId: number): Promise<Subscription | null> => {
  const { data } = await api.get<Subscription | null>(`/subscriptions/business/${businessId}`);
  return data;
};

export interface BillingSessionResponse {
  url: string;
}

export const createCheckoutSession = async (
  businessId: number,
  planId: number,
): Promise<BillingSessionResponse> => {
  const { data } = await api.post<BillingSessionResponse>('/billing/checkout', {
    businessId,
    planId,
  });
  return data;
};

export const createPortalSession = async (
  businessId: number,
): Promise<BillingSessionResponse> => {
  const { data } = await api.post<BillingSessionResponse>('/billing/portal', {
    businessId,
  });
  return data;
};
