import { get, post, put, del, getFile, getCurrentCompanyId } from './apiClient';
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

// API Response interface (updated to match paymentService)
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

// Invoice status enum
export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  PARTIALLY_PAID = 'partially_paid'
}

// Payment term enum
export enum PaymentTerm {
  IMMEDIATE = 'immediate',
  DAYS_7 = 'net_7',
  DAYS_15 = 'net_15',
  DAYS_30 = 'net_30',
  DAYS_45 = 'net_45',
  DAYS_60 = 'net_60',
  DAYS_90 = 'net_90',
  CUSTOM = 'custom'
}

// Invoice item interface
export interface InvoiceItem {
  id?: string;
  productId: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  notes?: string;
}

// Invoice interface
export interface Invoice {
  id?: string;
  invoiceNumber?: string;
  companyId?: string;
  customerId: string;
  orderId?: string;
  items: InvoiceItem[];  subtotal?: number;
  discountTotal?: number;
  taxTotal?: number;
  total?: number;
  issueDate?: string;
  dueDate: string;
  status?: InvoiceStatus;
  paymentTerm: PaymentTerm;
  billingAddress: string;
  shippingAddress?: string;
  notes?: string;
  termsAndConditions?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

// Create Invoice request
export interface CreateInvoiceRequest {
  orderId?: string;
  customerId: string;
  items: InvoiceItem[];
  issueDate?: string;
  paymentTerm: PaymentTerm;
  billingAddress: string;
  shippingAddress?: string;
  notes?: string;
  termsAndConditions?: string;
  metadata?: Record<string, any>;
}

// Invoice filters
export interface InvoiceFilters {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  customerId?: string;
  orderId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  companyId?: string;
}

// Utility to convert camelCase keys to snake_case recursively
function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  } else if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key.replace(/([A-Z])/g, '_$1').toLowerCase(),
        toSnakeCase(value)
      ])
    );
  }
  return obj;
}

/**
 * Create a new invoice
 */
export const createInvoice = async (invoiceData: CreateInvoiceRequest): Promise<Invoice> => {
  try {
    const response = await post<ApiResponse<Invoice>>(`/invoices`, toSnakeCase(invoiceData));
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      throw new ApiError(
        (axiosError.response.data as any)?.message || 'Failed to create invoice',
        axiosError.response.status,
        axiosError.response.data
      );
    }
    throw new ApiError('Failed to create invoice', 500);
  }
};

/**
 * Get all invoices with optional filters
 */
export const getInvoices = async (filters?: InvoiceFilters, companyId?: string): Promise<{ data: Invoice[]; pagination: ApiResponse<Invoice[]>['pagination'] }> => {  try {
    let currentCompanyId = companyId;
    
    if (!currentCompanyId) {
      try {
        currentCompanyId = getCurrentCompanyId(true); // This will throw if not found
      } catch (error) {
        console.error('getInvoices: Company ID not available', { 
          companyId, 
          error: error,
          localStorage: localStorage.getItem('user'),
          userInfo: localStorage.getItem('user_info')
        });
        throw new Error('Company ID not available. Please ensure you are logged in and have a company associated with your account.');
      }
    }
    
    console.log('getInvoices: Making API call', { 
      companyId: currentCompanyId, 
      filters,
      url: `/invoices`
    });const response = await get<ApiResponse<Invoice[]>>(`/invoices`, { 
      params: {
        limit: 10,
        page: 1,
        ...filters
      } 
    });
    return {
      data: response.data.data,
      pagination: response.data.pagination || {
        page: 1,
        limit: 10,
        totalItems: response.data.data.length,
        totalPages: 1
      }
    };  } catch (error) {
    console.error('getInvoices: API call failed', { error, companyId: companyId || getCurrentCompanyId() });
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      console.error('getInvoices: HTTP error response', {
        status: axiosError.response.status,
        data: axiosError.response.data,
        headers: axiosError.response.headers
      });
      throw new ApiError(
        (axiosError.response.data as any)?.message || 'Failed to fetch invoices',
        axiosError.response.status,
        axiosError.response.data
      );
    }
    console.error('getInvoices: Network or other error', axiosError.message);
    throw new ApiError('Failed to fetch invoices', 500);
  }
};

/**
 * Get a single invoice by ID
 */
export const getInvoiceById = async (id: string): Promise<Invoice> => {
  try {
    const response = await get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      throw new ApiError(
        (axiosError.response.data as any)?.message || 'Failed to fetch invoice',
        axiosError.response.status,
        axiosError.response.data
      );
    }
    throw new ApiError('Failed to fetch invoice', 500);
  }
};

/**
 * Update an existing invoice
 */
export const updateInvoice = async (invoiceId: string, invoiceData: Partial<Invoice>): Promise<Invoice> => {
  try {
    const response = await put<ApiResponse<Invoice>>(`/invoices/${invoiceId}`, toSnakeCase(invoiceData));
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      throw new ApiError(
        (axiosError.response.data as any)?.message || 'Failed to update invoice',
        axiosError.response.status,
        axiosError.response.data
      );
    }
    throw new ApiError('Failed to update invoice', 500);
  }
};

/**
 * Delete an invoice
 */
export const deleteInvoice = async (invoiceId: string): Promise<void> => {
  try {
    await del<ApiResponse<void>>(`/invoices/${invoiceId}`);
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      throw new ApiError(
        (axiosError.response.data as any)?.message || 'Failed to delete invoice',
        axiosError.response.status,
        axiosError.response.data
      );
    }
    throw new ApiError('Failed to delete invoice', 500);
  }
};

/**
 * Generate PDF for an invoice
 */
export const generateInvoicePdf = async (invoiceId: string): Promise<Blob> => {
  try {
    const response = await getFile(`/invoices/${invoiceId}/pdf`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to generate invoice PDF',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Mark an invoice as paid
 */
export const markInvoiceAsPaid = async (invoiceId: string, paymentData: { 
  amount: number, 
  payment_date: string, 
  payment_method: string,
  transaction_id?: string,
  notes?: string
}): Promise<Invoice> => {
  try {
    const response = await put<ApiResponse<Invoice>>(`/invoices/${invoiceId}/pay`, toSnakeCase(paymentData));
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      throw new ApiError(
        (axiosError.response.data as any)?.message || 'Failed to mark invoice as paid',
        axiosError.response.status,
        axiosError.response.data
      );
    }
    throw new ApiError('Failed to mark invoice as paid', 500);
  }
};

/**
 * Send invoice by email
 */
export const sendInvoiceByEmail = async (invoiceId: string, emailData: {
  recipient_email: string,
  subject?: string,
  message?: string,
  cc_emails?: string[]
}): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await post<ApiResponse<{ success: boolean; message: string }>>(
      `/invoices/${invoiceId}/send`, 
      toSnakeCase(emailData)
    );
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      throw new ApiError(
        (axiosError.response.data as any)?.message || 'Failed to send invoice by email',
        axiosError.response.status,
        axiosError.response.data
      );
    }
    throw new ApiError('Failed to send invoice by email', 500);
  }
};

export const invoiceService = {
  getInvoices: async (params?: any): Promise<any> => {
    const response = await get<any>(`/invoices`, { params });
    return response.data;
  },
  getInvoiceById: async (id: string): Promise<any> => {
    const response = await get<any>(`/invoices/${id}`);
    return response.data;
  },
  createInvoice: async (data: any): Promise<any> => {
    const response = await post<any>(`/invoices`, toSnakeCase(data));
    return response.data;
  },
  updateInvoice: async (id: string, data: any): Promise<any> => {
    const response = await put<any>(`/invoices/${id}`, toSnakeCase(data));
    return response.data;
  },
  deleteInvoice: async (id: string): Promise<any> => {
    const response = await del<any>(`/invoices/${id}`);
    return response.data;
  }
};
