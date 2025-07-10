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

export interface Batch {
  id: string;
  product_id: string;
  warehouse_id: string;
  company_id: string;
  batch_number: string;
  manufacture_date: string;
  expiration_date: string;
  quantity: number;
  unit: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BatchCreateInput {
  product_id: string;
  warehouse_id: string;
  company_id: string;
  batch_number: string;
  manufacture_date: string;
  expiration_date: string;
  quantity: number;
  unit: string;
  metadata?: Record<string, any>;
}

export interface BatchUpdateInput {
  batch_number?: string;
  manufacture_date?: string;
  expiration_date?: string;
  quantity?: number;
  unit?: string;
  metadata?: Record<string, any>;
}

export interface BatchListParams {
  page?: number;
  limit?: number;
  product_id?: string;
  warehouse_id?: string;
  company_id?: string;
  expiration_before?: string;
  expiration_after?: string;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Batch Management Service - Handles operations related to product batches
 */
export const batchService = {  /**
   * Get all batches with optional filtering
   */
  getBatches: async (params: BatchListParams = {}): Promise<PaginationResponse<Batch>> => {
    try {
      const response = await get<PaginationResponse<Batch>>(`/batches`, { params });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch batches',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  /**
   * Get a specific batch by ID
   */
  getBatch: async (batchId: string): Promise<Batch> => {
    try {
      if (!batchId) {
        throw new Error('Batch ID is required');
      }
      
      const response = await get<Batch>(`/batches/${batchId}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to fetch batch: ${batchId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Create a new batch
   */
  createBatch: async (data: BatchCreateInput): Promise<Batch> => {
    try {
      // Input validation
      if (!data.product_id) {
        throw new Error('Product ID is required');
      }
        if (!data.batch_number || data.batch_number.trim() === '') {
        throw new Error('Batch number is required');
      }
      
      if (!data.warehouse_id) {
        throw new Error('Warehouse ID is required');
      }
      
      if (!data.unit || data.unit.trim() === '') {
        throw new Error('Unit is required');
      }
      
      if (typeof data.quantity !== 'number' || data.quantity < 0) {
        throw new Error('Quantity must be a non-negative number');
      }
      
      // Validate dates
      if (!data.manufacture_date) {
        throw new Error('Manufacture date is required');
      }
      
      if (!data.expiration_date) {
        throw new Error('Expiration date is required');
      }
      
      const manufactureDate = new Date(data.manufacture_date);
      const expirationDate = new Date(data.expiration_date);
      
      if (isNaN(manufactureDate.getTime())) {
        throw new Error('Invalid manufacture date format');
      }
      
      if (isNaN(expirationDate.getTime())) {
        throw new Error('Invalid expiration date format');
      }
        if (expirationDate <= manufactureDate) {
        throw new Error('Expiration date must be after manufacture date');
      }
      
      const response = await post<Batch>(`/batches`, data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to create batch',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Update an existing batch
   */
  updateBatch: async (batchId: string, data: BatchUpdateInput): Promise<Batch> => {
    try {
      if (!batchId) {
        throw new Error('Batch ID is required');
      }
      
      if (Object.keys(data).length === 0) {
        throw new Error('No update data provided');
      }
      
      // Input validation for quantity if provided
      if (data.quantity !== undefined && (typeof data.quantity !== 'number' || data.quantity < 0)) {
        throw new Error('Quantity must be a non-negative number');
      }
      
      // Validate dates if provided
      if (data.manufacture_date && isNaN(new Date(data.manufacture_date).getTime())) {
        throw new Error('Invalid manufacture date format');
      }
      
      if (data.expiration_date && isNaN(new Date(data.expiration_date).getTime())) {
        throw new Error('Invalid expiration date format');
      }
      
      // If both dates are provided, validate expiration is after manufacture
      if (data.manufacture_date && data.expiration_date) {
        const manufactureDate = new Date(data.manufacture_date);
        const expirationDate = new Date(data.expiration_date);
        
        if (expirationDate <= manufactureDate) {
          throw new Error('Expiration date must be after manufacture date');
        }      }
      
      const response = await put<Batch>(`/batches/${batchId}`, data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to update batch: ${batchId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  /**
   * Delete a batch
   */
  deleteBatch: async (batchId: string): Promise<void> => {
    try {
      if (!batchId) {
        throw new Error('Batch ID is required');
      }
      
      await del(`/batches/${batchId}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to delete batch: ${batchId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  }
};