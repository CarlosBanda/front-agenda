import api from './axios';
import type { Service, CreateServiceDto } from '../types';

export const getByBusiness = async (businessId: number): Promise<Service[]> => {
  const { data } = await api.get<Service[]>(`/services/business/${businessId}`);
  return data;
};

export const getOne = async (id: number): Promise<Service> => {
  const { data } = await api.get<Service>(`/services/${id}`);
  return data;
};

export const create = async (dto: CreateServiceDto): Promise<Service> => {
  const { data } = await api.post<Service>('/services', dto);
  return data;
};

export const update = async (id: number, dto: Partial<CreateServiceDto>): Promise<Service> => {
  const { data } = await api.put<Service>(`/services/${id}`, dto);
  return data;
};

export const remove = async (id: number): Promise<void> => {
  await api.delete(`/services/${id}`);
};
