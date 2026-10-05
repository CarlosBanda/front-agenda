import api from './axios';
import type {
  Appointment,
  BusinessMetrics,
  Client,
  ClientMetrics,
  ClientNote,
  ClientTag,
  ClientSource,
  CreateClientDto,
  CreateTagDto,
  ImportClientsDto,
  ImportResult,
  PaginatedResponse,
  UpdateClientDto,
} from '../types';

export interface ClientsQuery {
  page?: number;
  limit?: number;
  search?: string;
  tagId?: number;
  source?: ClientSource;
}

export const listClients = async (
  businessId: number,
  query: ClientsQuery = {},
): Promise<PaginatedResponse<Client>> => {
  const { data } = await api.get<PaginatedResponse<Client>>(
    `/crm/businesses/${businessId}/clients`,
    { params: query },
  );
  return data;
};

export const createClient = async (
  businessId: number,
  dto: CreateClientDto,
): Promise<Client> => {
  const { data } = await api.post<Client>(
    `/crm/businesses/${businessId}/clients`,
    dto,
  );
  return data;
};

export const getClient = async (id: number): Promise<Client> => {
  const { data } = await api.get<Client>(`/crm/clients/${id}`);
  return data;
};

export const updateClient = async (
  id: number,
  dto: UpdateClientDto,
): Promise<Client> => {
  const { data } = await api.patch<Client>(`/crm/clients/${id}`, dto);
  return data;
};

export const removeClient = async (id: number): Promise<void> => {
  await api.delete(`/crm/clients/${id}`);
};

export const getClientHistory = async (
  id: number,
): Promise<Appointment[]> => {
  const { data } = await api.get<Appointment[]>(`/crm/clients/${id}/history`);
  return data;
};

export const getClientMetrics = async (
  id: number,
): Promise<ClientMetrics> => {
  const { data } = await api.get<ClientMetrics>(`/crm/clients/${id}/metrics`);
  return data;
};

export const getBusinessMetrics = async (
  businessId: number,
): Promise<BusinessMetrics> => {
  const { data } = await api.get<BusinessMetrics>(
    `/crm/businesses/${businessId}/metrics`,
  );
  return data;
};

export const listNotes = async (id: number): Promise<ClientNote[]> => {
  const { data } = await api.get<ClientNote[]>(`/crm/clients/${id}/notes`);
  return data;
};

export const addNote = async (
  id: number,
  body: string,
): Promise<ClientNote> => {
  const { data } = await api.post<ClientNote>(`/crm/clients/${id}/notes`, {
    body,
  });
  return data;
};

export const listTags = async (businessId: number): Promise<ClientTag[]> => {
  const { data } = await api.get<ClientTag[]>(
    `/crm/businesses/${businessId}/tags`,
  );
  return data;
};

export const createTag = async (
  businessId: number,
  dto: CreateTagDto,
): Promise<ClientTag> => {
  const { data } = await api.post<ClientTag>(
    `/crm/businesses/${businessId}/tags`,
    dto,
  );
  return data;
};

export const assignTags = async (
  id: number,
  tagIds: number[],
): Promise<Client> => {
  const { data } = await api.post<Client>(`/crm/clients/${id}/tags`, {
    tagIds,
  });
  return data;
};

export const removeTag = async (
  id: number,
  tagId: number,
): Promise<Client> => {
  const { data } = await api.delete<Client>(`/crm/clients/${id}/tags/${tagId}`);
  return data;
};

export const importClients = async (
  businessId: number,
  dto: ImportClientsDto,
): Promise<ImportResult> => {
  const { data } = await api.post<ImportResult>(
    `/crm/businesses/${businessId}/clients/import`,
    dto,
  );
  return data;
};
