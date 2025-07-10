import { get, post, put, del } from './apiClient';

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

export type ProductStatus = 'active' | 'inactive' | 'out_of_stock';

export interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  unit: string;
  supplier_id: string;
  category_id: string | null;
  category_name?: string; // Added to store the category name from the API
  status: ProductStatus;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProductInput {
  name: string;
  description: string;
  base_price: number;
  unit: string;
  supplier_id: string;
  category_id?: string;
  status?: ProductStatus;
  metadata?: Record<string, any>;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  base_price?: number;
  unit?: string;
  supplier_id?: string;
  category_id?: string;
  status?: ProductStatus;
  metadata?: Record<string, any>;
}

export const productService = {
  getProducts: async (params?: any): Promise<Product[]> => {
    try {
      const response = await get<{ data: Product[] }>(`/products`, { params });
      return response.data.data;
    } catch (err) {
      console.error('ProductService: Error fetching products:', err);
      throw err;
    }
  },
  getProductById: async (id: string): Promise<Product> => {
    const response = await get<{ data: Product }>(`/products/${id}`);
    return response.data.data;
  },
  createProduct: async (data: CreateProductInput): Promise<Product> => {
    const response = await post<{ data: Product }>(`/products`, data);
    return response.data.data;
  },
  updateProduct: async (id: string, data: UpdateProductInput): Promise<Product> => {
    const response = await put<{ data: Product }>(`/products/${id}`, data);
    return response.data.data;
  },
  deleteProduct: async (id: string): Promise<void> => {
    await del(`/products/${id}`);
  },
  getPriceHistory: async (productId: string, params?: any) => {
    try {
      // Use the correct endpoint as per your backend routes
      const response = await get<{ data: any[]; pagination?: { totalPages: number } }>(`/products/${productId}/prices`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching price history:', error);
      return { data: [] };
    }
  },
  updateProductPrice: async (productId: string, newPrice: number, effectiveDate: string) => {
    const response = await post<{ data: any }>(
      `/products/${productId}/update-price`,
      { new_price: newPrice, effective_date: effectiveDate }
    );
    return response.data;
  }
};