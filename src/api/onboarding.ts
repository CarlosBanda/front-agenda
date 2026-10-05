import api from './axios';
import type {
  ImportClientsDto,
  OnboardingImportResponse,
  OnboardingState,
  UpdateOnboardingDto,
} from '../types';

export const getState = async (
  businessId: number,
): Promise<OnboardingState> => {
  const { data } = await api.get<OnboardingState>(
    `/onboarding/businesses/${businessId}`,
  );
  return data;
};

export const updateState = async (
  businessId: number,
  dto: UpdateOnboardingDto,
): Promise<OnboardingState> => {
  const { data } = await api.patch<OnboardingState>(
    `/onboarding/businesses/${businessId}`,
    dto,
  );
  return data;
};

export const importClients = async (
  businessId: number,
  dto: ImportClientsDto,
): Promise<OnboardingImportResponse> => {
  const { data } = await api.post<OnboardingImportResponse>(
    `/onboarding/businesses/${businessId}/import-clients`,
    dto,
  );
  return data;
};
