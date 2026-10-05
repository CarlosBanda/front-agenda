import api from './axios';
import type {
  PaginatedResponse,
  ReminderSetting,
  UpsertReminderSettingDto,
  WhatsappReminderAttempt,
} from '../types';

export const getSettings = async (
  businessId: number,
): Promise<ReminderSetting> => {
  const { data } = await api.get<ReminderSetting>(
    `/reminders/businesses/${businessId}/settings`,
  );
  return data;
};

export const upsertSettings = async (
  businessId: number,
  dto: UpsertReminderSettingDto,
): Promise<ReminderSetting> => {
  const { data } = await api.put<ReminderSetting>(
    `/reminders/businesses/${businessId}/settings`,
    dto,
  );
  return data;
};

export const listAttempts = async (
  businessId: number,
  page?: number,
  limit?: number,
): Promise<PaginatedResponse<WhatsappReminderAttempt>> => {
  const { data } = await api.get<PaginatedResponse<WhatsappReminderAttempt>>(
    `/reminders/businesses/${businessId}/attempts`,
    { params: { page, limit } },
  );
  return data;
};

export const sendNow = async (
  appointmentId: number,
): Promise<WhatsappReminderAttempt> => {
  const { data } = await api.post<WhatsappReminderAttempt>(
    `/reminders/appointments/${appointmentId}/send`,
  );
  return data;
};
