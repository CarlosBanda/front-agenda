import api from './axios';
import type { Business, PaginatedResponse } from '../types';

export interface AdminStats {
  totalBusinesses: number;
  activeBusinesses: number;
  inactiveBusinesses: number;
  totalUsers: number;
  businessUsers: number;
  clientUsers: number;
}

export const getStats = async (): Promise<AdminStats> => {
  const { data } = await api.get<AdminStats>('/admin/stats');
  return data;
};

export const getBusinesses = async (page?: number, limit?: number): Promise<PaginatedResponse<Business>> => {
  const { data } = await api.get<PaginatedResponse<Business>>('/admin/businesses', {
    params: { page, limit },
  });
  return data;
};

export const getBusiness = async (id: number): Promise<Business> => {
  const { data } = await api.get<Business>(`/admin/businesses/${id}`);
  return data;
};

export const toggleBusiness = async (id: number): Promise<Business> => {
  const { data } = await api.patch<Business>(`/admin/businesses/${id}/toggle`);
  return data;
};
