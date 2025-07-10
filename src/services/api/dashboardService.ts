import { get } from './apiClient';
import { AxiosError } from 'axios';
import { ApiError } from './authService';

// Types for dashboard overview data
export interface OrderSummary {
  recentOrders: {
    id: string;
    date: string;
    customer: string;
    status: string;
    total: number;
  }[];
  totalOrders: number;
  pendingOrders: number;
}

export interface ProductSummary {
  totalProducts: number;
  featuredProducts: {
    id: string;
    name: string;
    price: number;
    category?: string;
    stock: number;
  }[];
  categoryCount: Record<string, number>;
}

export interface InventorySummary {
  totalItems: number;
  lowStockItems: number;
  warehouseUtilization: number;
  recentMovements: {
    id: string;
    date: string;
    product: string;
    quantity: number;
    type: 'in' | 'out';
  }[];
}

export const dashboardService = {
  /**
   * Get order summary for dashboard
   */  
  getOrderSummary: async (): Promise<OrderSummary> => {
    try {
      const response = await get<any>(`/orders/dashboard-summary`);
      
      // Extract data from the nested response structure {status: 'success', data: {...}}
      const responseData = response.data?.data || response.data;
      
      // Format the data to match what the dashboard expects
      const summary: OrderSummary = {
        recentOrders: (responseData.recent_orders || []).map((order: any) => ({
          id: order.id,
          date: order.created_at,
          customer: order.customer_id,
          status: order.status,
          total: order.total_amount
        })),
        totalOrders: responseData.total_orders || 0,
        pendingOrders: responseData.pending_orders || 0
      };
      
      return summary;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch order summary',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Get product summary for dashboard
   */  
  getProductSummary: async (): Promise<ProductSummary> => {
    try {
      const response = await get<any>(`/products/dashboard-summary`);
      
      // Extract data from the nested response structure {status: 'success', data: {...}}
      const responseData = response.data?.data || response.data;
      
      
      // Format the data to match what the dashboard expects
      const summary: ProductSummary = {
        totalProducts: responseData.total_products || 0,
        featuredProducts: (responseData.featured_products || []).map((product: any) => ({
          id: product.id,
          name: product.name,
          price: parseFloat(product.price) || parseFloat(product.base_price) || 0,
          category: product.category || 'Uncategorized',
          stock: product.stock || 0
        })),
        categoryCount: responseData.category_counts || {}
      };
      
      
      return summary;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch product summary',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Get inventory summary for dashboard
   */  
  getInventorySummary: async (): Promise<InventorySummary> => {
    try {
      const response = await get<any>(`/inventory/dashboard-summary`);
      
      // Extract data from the nested response structure {status: 'success', data: {...}}
      const responseData = response.data?.data || response.data;
      

      
      // Format the data to match what the dashboard expects
      const summary: InventorySummary = {
        totalItems: responseData.total_items || 0,
        lowStockItems: responseData.low_stock_items || 0,
        warehouseUtilization: parseFloat(responseData.warehouse_utilization) || 0,
        recentMovements: (responseData.recent_movements || []).map((item: any) => ({
          id: item.id,
          date: item.updated_at || new Date().toISOString(),
          product: item.product?.name || item.product_name || 'Unknown Product',
          quantity: parseFloat(item.quantity) || 0,
          type: (parseFloat(item.quantity) || 0) > 0 ? 'in' : 'out'
        }))
      };
      
      return summary;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch inventory summary',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  }
};
