import { get, post, put, del } from './apiClient';
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

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'other';
export const PaymentMethodValues = {
  CASH: 'cash' as PaymentMethod,
  CARD: 'card' as PaymentMethod,
  BANK_TRANSFER: 'bank_transfer' as PaymentMethod,
  CHEQUE: 'cheque' as PaymentMethod,
  OTHER: 'other' as PaymentMethod,
};
export type ReconciliationStatus =
  | 'reconciled'
  | 'unreconciled'
  | 'disputed'
  | 'pending_review'
  | 'partial'
  | 'failed';

export const ReconciliationStatusValues = {
  RECONCILED: 'reconciled' as ReconciliationStatus,
  UNRECONCILED: 'unreconciled' as ReconciliationStatus,
  DISPUTED: 'disputed' as ReconciliationStatus,
  PENDING: 'pending_review' as ReconciliationStatus,
  PARTIAL: 'partial' as ReconciliationStatus,
  FAILED: 'failed' as ReconciliationStatus,
};

export interface Payment {
  id: string;
  company_id: string;
  order_id: string;
  invoice_id?: string;
  user_id: string;
  customer_id?: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_status: PaymentStatus;
  payment_type?: string; // e.g., 'refund', 'payment', etc.
  payment_method: PaymentMethod;
  reconciliation_status?: string;
  reference_number?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePaymentInput {
  order_id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  reference_number?: string;
  metadata?: Record<string, any>;
}

export interface UpdatePaymentInput {
  amount?: number;
  currency?: string;
  payment_date?: string;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
  reference_number?: string;
  metadata?: Record<string, any>;
}

export interface ReconcilePaymentRequest {
  reconciliationStatus: ReconciliationStatus;
  notes?: string;
}

export const paymentService = {
  /**
   * Get a list of payments with optional filters
   * @param params Optional filters for payments
   * @returns List of payments
   */  async getPayments(params?: any): Promise<Payment[]> {
    try {
      const response = await get<{ data: Payment[] }>(`/payments`, { params });
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        throw new ApiError(
          (error.response.data as any)?.message || 'Failed to fetch payments',
          error.response.status,
          error.response.data
        );
      }
      throw new ApiError('Failed to fetch payments', 500);
    }
  },
  /**
   * Get a payment by ID
   * @param id ID of payment to retrieve
   * @returns Payment details
   */  async getPaymentById(id: string): Promise<Payment> {
    try {
      const response = await get<{ data: Payment }>(`/payments/${id}`);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new ApiError(
          (axiosError.response.data as any)?.message || 'Failed to fetch payment',
          axiosError.response.status,
          axiosError.response.data
        );
      }
      throw new ApiError('Failed to fetch payment', 500);
    }
  },
  /**
   * Create a new payment
   * @param data Payment data to create
   * @returns Created payment
   */  async createPayment(data: CreatePaymentInput): Promise<Payment> {
    try {
      const response = await post<{ data: Payment }>(`/payments`, data);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new ApiError(
          (axiosError.response.data as any)?.message || 'Failed to create payment',
          axiosError.response.status,
          axiosError.response.data
        );
      }
      throw new ApiError('Failed to create payment', 500);
    }
  },
  /**
   * Update an existing payment
   * @param id ID of payment to update
   * @param data Payment data to update
   * @returns Updated payment
   */  async updatePayment(id: string, data: UpdatePaymentInput): Promise<Payment> {
    try {
      const response = await put<{ data: Payment }>(`/payments/${id}`, data);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new ApiError(
          (axiosError.response.data as any)?.message || 'Failed to update payment',
          axiosError.response.status,
          axiosError.response.data
        );
      }
      throw new ApiError('Failed to update payment', 500);
    }
  },
  /**
   * Delete a payment
   * @param id ID of payment to delete
   */  async deletePayment(id: string): Promise<void> {
    try {
      await del(`/payments/${id}`);
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new ApiError(
          (axiosError.response.data as any)?.message || 'Failed to delete payment',
          axiosError.response.status,
          axiosError.response.data
        );
      }
      throw new ApiError('Failed to delete payment', 500);
    }
  },
  /**
   * Reconcile a payment
   * @param id Payment ID
   * @param data ReconcilePaymentRequest
   */  async reconcilePayment(id: string, data: ReconcilePaymentRequest): Promise<Payment> {
    try {
      const response = await put<{ data: Payment }>(`/payments/${id}/reconcile`, data);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new ApiError(
          (axiosError.response.data as any)?.message || 'Failed to reconcile payment',
          axiosError.response.status,
          axiosError.response.data
        );
      }
      throw new ApiError('Failed to reconcile payment', 500);
    }
  }
};
