import api from './axios';
import type { Staff, CreateStaffDto } from '../types';

export const getByBusiness = async (businessId: number): Promise<Staff[]> => {
  const { data } = await api.get<Staff[]>(`/staff/business/${businessId}`);
  return data;
};

export const getOne = async (id: number): Promise<Staff> => {
  const { data } = await api.get<Staff>(`/staff/${id}`);
  return data;
};

export const create = async (dto: CreateStaffDto): Promise<Staff> => {
  const { data } = await api.post<Staff>('/staff', dto);
  return data;
};

export const update = async (id: number, dto: Partial<CreateStaffDto>): Promise<Staff> => {
  const { data } = await api.put<Staff>(`/staff/${id}`, dto);
  return data;
};

export const remove = async (id: number): Promise<void> => {
  await api.delete(`/staff/${id}`);
};
