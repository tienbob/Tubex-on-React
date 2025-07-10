import { get, post, patch, del } from './apiClient';
import { AxiosError } from 'axios';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface PaymentHistory {
  id: string;
  payment_id: string;
  user_id: string;
  previous_status: string;
  new_status: string;
  notes?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface PaymentHistoryCreateInput {
  payment_id: string;
  user_id: string;
  previous_status: string;
  new_status: string;
  notes?: string;
  metadata?: any;
}

export interface PaymentHistoryUpdateInput {
  previous_status?: string;
  new_status?: string;
  notes?: string;
  metadata?: any;
}

export const paymentHistoryService = {
  getHistories: async (params?: any): Promise<PaymentHistory[]> => {
    const response = await get<PaymentHistory[]>(`/payment_histories`, { params });
    return response.data;
  },
  getHistoryById: async (id: string): Promise<PaymentHistory> => {
    const response = await get<PaymentHistory>(`/payment_histories/${id}`);
    return response.data;
  },
  createHistory: async (data: PaymentHistoryCreateInput): Promise<PaymentHistory> => {
    const response = await post<PaymentHistory>(`/payment_histories`, data);
    return response.data;
  },
  updateHistory: async (id: string, data: PaymentHistoryUpdateInput): Promise<PaymentHistory> => {
    const response = await patch<PaymentHistory>(`/payment_histories/${id}`, data);
    return response.data;
  },
  deleteHistory: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await del<{ success: boolean; message: string }>(`/payment_histories/${id}`);
    return response.data;
  }
};
