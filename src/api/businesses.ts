import api from './axios';
import type { Business, CreateBusinessDto, PaginatedResponse } from '../types';

export const getAll = async (page?: number, limit?: number): Promise<PaginatedResponse<Business>> => {
  const { data } = await api.get<PaginatedResponse<Business>>('/businesses', {
    params: { page, limit },
  });
  return data;
};

export const getOne = async (id: number): Promise<Business> => {
  const { data } = await api.get<Business>(`/businesses/${id}`);
  return data;
};

export const create = async (dto: CreateBusinessDto): Promise<Business> => {
  const { data } = await api.post<Business>('/businesses', dto);
  return data;
};

export const update = async (id: number, dto: Partial<CreateBusinessDto>): Promise<Business> => {
  const { data } = await api.put<Business>(`/businesses/${id}`, dto);
  return data;
};

export const remove = async (id: number): Promise<void> => {
  await api.delete(`/businesses/${id}`);
};

export const getMine = async (): Promise<Business[]> => {
  const { data } = await api.get<Business[]>('/businesses/my/businesses');
  return data;
};
