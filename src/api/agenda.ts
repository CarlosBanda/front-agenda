import api from './axios';
import type {
  AgendaRangeResponse,
  Appointment,
  AppointmentStatus,
  DepositDto,
  QuickAction,
} from '../types';

export interface RangeParams {
  from: string;
  to: string;
  staffId?: number;
  status?: AppointmentStatus;
}

export const getRange = async (
  businessId: number,
  params: RangeParams,
): Promise<AgendaRangeResponse> => {
  const { data } = await api.get<AgendaRangeResponse>(
    `/agenda/businesses/${businessId}`,
    { params },
  );
  return data;
};

export const getDay = async (
  businessId: number,
  date: string,
  staffId?: number,
): Promise<AgendaRangeResponse> => {
  const { data } = await api.get<AgendaRangeResponse>(
    `/agenda/businesses/${businessId}/day`,
    { params: { date, staffId } },
  );
  return data;
};

export const getWeek = async (
  businessId: number,
  date: string,
  staffId?: number,
): Promise<AgendaRangeResponse> => {
  const { data } = await api.get<AgendaRangeResponse>(
    `/agenda/businesses/${businessId}/week`,
    { params: { date, staffId } },
  );
  return data;
};

export const quickAction = async (
  id: number,
  action: QuickAction,
): Promise<Appointment> => {
  const { data } = await api.patch<Appointment>(
    `/agenda/appointments/${id}/quick-action`,
    { action },
  );
  return data;
};

export const setDeposit = async (
  id: number,
  dto: DepositDto,
): Promise<Appointment> => {
  const { data } = await api.patch<Appointment>(
    `/agenda/appointments/${id}/deposit`,
    dto,
  );
  return data;
};

export const applyPolicyDeposit = async (id: number): Promise<Appointment> => {
  const { data } = await api.post<Appointment>(
    `/agenda/appointments/${id}/deposit/apply-policy`,
  );
  return data;
};
