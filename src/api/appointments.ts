import api from './axios';
import type {
  Appointment,
  AppointmentStatus,
  AvailableSlot,
  CreateAppointmentDto,
  PaginatedResponse,
} from '../types';

export const create = async (dto: CreateAppointmentDto): Promise<Appointment> => {
  const { data } = await api.post<Appointment>('/appointments', dto);
  return data;
};

export const createByBusiness = async (
  dto: CreateAppointmentDto & { clientId?: number; clientRecordId?: number },
): Promise<Appointment> => {
  const { data } = await api.post<Appointment>('/appointments/business', dto);
  return data;
};

export const getAvailableSlots = async (
  businessId: number,
  date: string,
  serviceId: number,
  staffId?: number,
): Promise<AvailableSlot[]> => {
  const { data } = await api.get<AvailableSlot[]>('/appointments/available-slots', {
    params: { businessId, date, serviceId, staffId },
  });
  return data;
};

export const getMy = async (page?: number, limit?: number): Promise<PaginatedResponse<Appointment>> => {
  const { data } = await api.get<PaginatedResponse<Appointment>>('/appointments/my', {
    params: { page, limit },
  });
  return data;
};

export const getByBusiness = async (
  businessId: number,
  date?: string,
  page?: number,
  limit?: number,
): Promise<PaginatedResponse<Appointment>> => {
  const { data } = await api.get<PaginatedResponse<Appointment>>(`/appointments/business/${businessId}`, {
    params: { date, page, limit },
  });
  return data;
};

export const updateStatus = async (id: number, status: AppointmentStatus): Promise<Appointment> => {
  const { data } = await api.patch<Appointment>(`/appointments/${id}/status`, { status });
  return data;
};

export const cancel = async (id: number): Promise<Appointment> => {
  const { data } = await api.patch<Appointment>(`/appointments/${id}/cancel`);
  return data;
};
