import api from './axios';
import type { AuthResponse, LoginDto, RegisterDto, User } from '../types';

export const login = async (dto: LoginDto): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/login', dto);
  return data;
};

export const register = async (dto: RegisterDto): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/register', dto);
  return data;
};

export const getCurrentUser = async (): Promise<User> => {
  const { data } = await api.get<User>('/auth/me');
  return data;
};
