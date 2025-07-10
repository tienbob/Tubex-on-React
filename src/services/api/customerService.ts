import { get } from './apiClient';
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

export interface Customer {
  id: string;
  name: string;
  type: 'dealer' | 'supplier';
  contact_phone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    province?: string;
    postal_code?: string;
  };
  status?: string;
  metadata?: Record<string, any>;
}

export interface CustomersResponse {
  data: Customer[];
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
}

/**
 * Service for handling customer-related API calls
 */
const customerService = {  /**
   * Get a single customer by ID
   */
  async getCustomerById(id: string): Promise<Customer> {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Valid customer ID is required');
      }
      
      const response = await get<Customer>(`/companies/${id}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new ApiError(
          (axiosError.response.data as any)?.message || `Failed to fetch customer: ${id}`,
          axiosError.response.status || 500,
          axiosError.response.data
        );
      }
      throw new ApiError(`Failed to fetch customer: ${id}`, 500);
    }
  },

  /**
   * Get multiple customers by IDs in a single batch request
   */  async getCustomersByIds(ids: string[]): Promise<Record<string, Customer>> {
    try {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return {};
      }
      
      const response = await get<Customer[]>(`/companies/batch`, { params: { ids: ids.join(',') } });
      const customersMap: Record<string, Customer> = {};
      response.data.forEach(customer => {
        customersMap[customer.id] = customer;
      });
      return customersMap;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new ApiError(
          (axiosError.response.data as any)?.message || 'Failed to fetch customers',
          axiosError.response.status || 500,
          axiosError.response.data
        );
      }
      throw new ApiError('Failed to fetch customers', 500);
    }
  },  /**
   * Search customers with optional filters
   */
  async searchCustomers(params?: {
    search?: string;
    type?: 'dealer' | 'supplier';
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<CustomersResponse> {
    try {
      const response = await get<CustomersResponse>(`/companies`, { params });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new ApiError(
          (axiosError.response.data as any)?.message || 'Failed to search customers',
          axiosError.response.status || 500,
          axiosError.response.data
        );
      }
      throw new ApiError('Failed to search customers', 500);
    }
  }
};

export default customerService;
