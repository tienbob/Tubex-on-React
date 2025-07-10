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

export interface QuoteHistory {
  id: string;
  quote_id: string;
  user_id: string;
  previous_status: string;
  new_status: string;
  notes?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface QuoteHistoryCreateInput {
  quote_id: string;
  user_id: string;
  previous_status: string;
  new_status: string;
  notes?: string;
  metadata?: any;
}

export interface QuoteHistoryUpdateInput {
  previous_status?: string;
  new_status?: string;
  notes?: string;
  metadata?: any;
}

export const quoteHistoryService = {
  getHistories: async (params?: any): Promise<QuoteHistory[]> => {
    const response = await get<QuoteHistory[]>(`/quote_histories`, { params });
    return response.data;
  },
  getHistoryById: async (id: string): Promise<QuoteHistory> => {
    const response = await get<QuoteHistory>(`/quote_histories/${id}`);
    return response.data;
  },
  createHistory: async (data: QuoteHistoryCreateInput): Promise<QuoteHistory> => {
    const response = await post<QuoteHistory>(`/quote_histories`, data);
    return response.data;
  },
  updateHistory: async (id: string, data: QuoteHistoryUpdateInput): Promise<QuoteHistory> => {
    const response = await patch<QuoteHistory>(`/quote_histories/${id}`, data);
    return response.data;
  },
  deleteHistory: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await del<{ success: boolean; message: string }>(`/quote_histories/${id}`);
    return response.data;
  }
};
