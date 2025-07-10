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

// Price List Item interface
export interface PriceListItem {
  id?: string;
  product_id: string;
  price: number;
  min_quantity?: number;
  max_quantity?: number;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

// Price List interface
export interface PriceList {
  id?: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  customer_id?: string;
  customer_group_id?: string;
  items: PriceListItem[];
  start_date?: string;
  end_date?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

// Price List filters
export interface PriceListFilters {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  customer_id?: string;
  customer_group_id?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Create a new price list
 */
export const createPriceList = async (priceListData: PriceList): Promise<PriceList> => {
  try {
    console.log('createPriceList: Making API call', { 
      priceListData,
      url: `/price-lists`
    });
    
    const response = await post<PriceList>(`/price-lists`, priceListData);
    
    console.log('createPriceList: API call successful', { 
      createdId: response.data?.id,
      response: response.data
    });
    
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('createPriceList: API call failed', { 
      priceListData,
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      error: axiosError.response?.data || axiosError.message 
    });
    throw new ApiError(
      'Failed to create price list',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Get all price lists with optional filters
 */
export const getPriceLists = async (filters?: PriceListFilters): Promise<PriceList[]> => {
  try {
    console.log('getPriceLists: Making API call', { 
      filters,
      url: `/price-lists`
    });
    
    const response = await get<PriceList[]>(`/price-lists`, { 
      params: { 
        ...filters 
      } 
    });
    
    console.log('getPriceLists: API call successful', { 
      resultCount: response.data?.length || 0,
      response: response.data
    });
    
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('getPriceLists: API call failed', { 
      filters,
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      error: axiosError.response?.data || axiosError.message 
    });
    throw new ApiError(
      'Failed to fetch price lists',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Get a single price list by ID
 */
export const getPriceListById = async (priceListId: string): Promise<PriceList> => {
  try {
    console.log('getPriceListById: Making API call', { 
      priceListId, 
      url: `/price-lists/${priceListId}`
    });
    
    const response = await get<PriceList>(`/price-lists/${priceListId}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('getPriceListById: API call failed', { 
      priceListId, 
      error: axiosError.response?.data || axiosError.message 
    });
    throw new ApiError(
      'Failed to fetch price list',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Update an existing price list
 */
export const updatePriceList = async (priceListId: string, priceListData: Partial<PriceList>): Promise<PriceList> => {
  try {
    console.log('updatePriceList: Making API call', { 
      priceListId, 
      url: `/price-lists/${priceListId}`
    });
    
    const response = await put<PriceList>(`/price-lists/${priceListId}`, priceListData);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('updatePriceList: API call failed', { 
      priceListId, 
      error: axiosError.response?.data || axiosError.message 
    });
    throw new ApiError(
      'Failed to update price list',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Delete a price list
 */
export const deletePriceList = async (priceListId: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('deletePriceList: Making API call', { 
      priceListId, 
      url: `/price-lists/${priceListId}`
    });
    
    const response = await del<{ success: boolean; message: string }>(`/price-lists/${priceListId}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('deletePriceList: API call failed', { 
      priceListId, 
      error: axiosError.response?.data || axiosError.message 
    });
    throw new ApiError(
      'Failed to delete price list',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};
