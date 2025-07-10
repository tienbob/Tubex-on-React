import { get, post, put, del } from './apiClient';
import { AxiosError } from 'axios';

// Custom error class for API errors
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

export type OrderStatus = 'draft' | 'submitted' | 'fulfilled' | 'cancelled';

export interface Order {
  id: string;
  company_id: string;
  user_id: string;
  order_number: string;
  order_date: string;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOrderInput {
  company_id: string;
  user_id: string;
  order_number: string;
  order_date: string;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  metadata?: Record<string, any>;
}

export interface UpdateOrderInput {
  order_number?: string;
  order_date?: string;
  status?: OrderStatus;
  total_amount?: number;
  currency?: string;
  metadata?: Record<string, any>;
}

/**
 * Service for handling order-related API calls
 */
export const orderService = {
  /**
   * Get all orders with pagination and filtering
   */
  getOrders: async (params?: any): Promise<Order[]> => {
    const response = await get<{ data: Order[] }>(`/orders`, { params });
    return response.data.data;
  },

  /**
   * Get a single order by ID
   */
  getOrderById: async (id: string): Promise<Order> => {
    const response = await get<{ data: Order }>(`/orders/${id}`);
    return response.data.data;
  },

  /**
   * Create a new order
   */
  createOrder: async (data: CreateOrderInput): Promise<Order> => {
    const response = await post<{ data: Order }>(`/orders`, data);
    return response.data.data;
  },

  /**
   * Update an order's status or details
   */
  updateOrder: async (id: string, data: UpdateOrderInput): Promise<Order> => {
    const response = await put<{ data: Order }>(`/orders/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete an order (for admin purposes only)
   */
  deleteOrder: async (id: string): Promise<void> => {
    await del(`/orders/${id}`);
  }
}