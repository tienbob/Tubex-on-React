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

export interface OrderHistory {
  id: string;
  order_id: string;
  user_id: string;
  previous_status: string;
  new_status: string;
  notes?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface OrderHistoryCreateInput {
  order_id: string;
  user_id: string;
  previous_status: string;
  new_status: string;
  notes?: string;
  metadata?: any;
}

export interface OrderHistoryUpdateInput {
  previous_status?: string;
  new_status?: string;
  notes?: string;
  metadata?: any;
}

export const orderHistoryService = {
  getHistories: async (params?: any): Promise<OrderHistory[]> => {
    const response = await get<OrderHistory[]>(`/order_histories`, { params });
    return response.data;
  },
  getHistoryById: async (id: string): Promise<OrderHistory> => {
    const response = await get<OrderHistory>(`/order_histories/${id}`);
    return response.data;
  },
  createHistory: async (data: OrderHistoryCreateInput): Promise<OrderHistory> => {
    const response = await post<OrderHistory>(`/order_histories`, data);
    return response.data;
  },
  updateHistory: async (id: string, data: OrderHistoryUpdateInput): Promise<OrderHistory> => {
    const response = await patch<OrderHistory>(`/order_histories/${id}`, data);
    return response.data;
  },
  deleteHistory: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await del<{ success: boolean; message: string }>(`/order_histories/${id}`);
    return response.data;
  }
};
