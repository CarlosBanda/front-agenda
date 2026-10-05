import api from './axios';
import type { BusinessPolicy, UpsertPolicyDto } from '../types';

export const getPolicy = async (
  businessId: number,
): Promise<BusinessPolicy> => {
  const { data } = await api.get<BusinessPolicy>(
    `/policies/businesses/${businessId}`,
  );
  return data;
};

export const getPublicPolicy = async (
  businessId: number,
): Promise<BusinessPolicy> => {
  const { data } = await api.get<BusinessPolicy>(
    `/public/policies/businesses/${businessId}`,
  );
  return data;
};

export const upsertPolicy = async (
  businessId: number,
  dto: UpsertPolicyDto,
): Promise<BusinessPolicy> => {
  const { data } = await api.put<BusinessPolicy>(
    `/policies/businesses/${businessId}`,
    dto,
  );
  return data;
};
