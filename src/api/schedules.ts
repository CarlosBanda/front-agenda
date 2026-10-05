import api from './axios';
import type { Schedule, BlockedSlot } from '../types';

export interface CreateScheduleDto {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isActive?: boolean;
  businessId: number;
  staffId?: number;
}

export interface CreateBlockedSlotDto {
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  businessId: number;
  staffId?: number;
}

export const getByBusiness = async (businessId: number): Promise<Schedule[]> => {
  const { data } = await api.get<Schedule[]>(`/schedules/business/${businessId}`);
  return data;
};

export const getByStaff = async (staffId: number): Promise<Schedule[]> => {
  const { data } = await api.get<Schedule[]>(`/schedules/staff/${staffId}`);
  return data;
};

export const create = async (dto: CreateScheduleDto): Promise<Schedule> => {
  const { data } = await api.post<Schedule>('/schedules', dto);
  return data;
};

export const remove = async (id: number): Promise<void> => {
  await api.delete(`/schedules/${id}`);
};

export const getBlocked = async (businessId: number, date: string): Promise<BlockedSlot[]> => {
  const { data } = await api.get<BlockedSlot[]>(`/schedules/blocked/${businessId}`, {
    params: { date },
  });
  return data;
};

export const createBlocked = async (dto: CreateBlockedSlotDto): Promise<BlockedSlot> => {
  const { data } = await api.post<BlockedSlot>('/schedules/blocked', dto);
  return data;
};

export const removeBlocked = async (id: number): Promise<void> => {
  await api.delete(`/schedules/blocked/${id}`);
};
