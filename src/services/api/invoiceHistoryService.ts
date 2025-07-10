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

export interface InvoiceHistory {
  id: string;
  invoice_id: string;
  user_id: string;
  previous_status: string;
  new_status: string;
  notes?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface InvoiceHistoryCreateInput {
  invoice_id: string;
  user_id: string;
  previous_status: string;
  new_status: string;
  notes?: string;
  metadata?: any;
}

export interface InvoiceHistoryUpdateInput {
  previous_status?: string;
  new_status?: string;
  notes?: string;
  metadata?: any;
}

export const invoiceHistoryService = {
  getHistories: async (params?: any): Promise<InvoiceHistory[]> => {
    const response = await get<InvoiceHistory[]>(`/invoice_histories`, { params });
    return response.data;
  },
  getHistoryById: async (id: string): Promise<InvoiceHistory> => {
    const response = await get<InvoiceHistory>(`/invoice_histories/${id}`);
    return response.data;
  },
  createHistory: async (data: InvoiceHistoryCreateInput): Promise<InvoiceHistory> => {
    const response = await post<InvoiceHistory>(`/invoice_histories`, data);
    return response.data;
  },
  updateHistory: async (id: string, data: InvoiceHistoryUpdateInput): Promise<InvoiceHistory> => {
    const response = await patch<InvoiceHistory>(`/invoice_histories/${id}`, data);
    return response.data;
  },
  deleteHistory: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await del<{ success: boolean; message: string }>(`/invoice_histories/${id}`);
    return response.data;
  }
};
