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

export interface Inventory {
  id: string;
  product_id: string;
  company_id: string;
  warehouse_id: string;
  quantity: number;
  unit: string;
  min_threshold?: number;
  max_threshold?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  auto_reorder?: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface CreateInventoryInput {
  product_id: string;
  company_id: string;
  warehouse_id: string;
  quantity: number;
  unit: string;
  min_threshold?: number;
  max_threshold?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  auto_reorder?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateInventoryInput {
  quantity?: number;
  unit?: string;
  min_threshold?: number;
  max_threshold?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  auto_reorder?: boolean;
  metadata?: Record<string, any>;
}

export interface InventoryAuditLog {
  id: string;
  inventory_id: string;
  change_type: string;
  previous_quantity: number;
  new_quantity: number;
  reference_id?: string;
  created_by: string;
  created_at: string;
  // Add any other fields your backend returns
}

export const inventoryService = {
  getInventory: async (params?: any): Promise<Inventory[]> => {
    const response = await get<{ data: Inventory[] }>(`/inventory`, { params });
    return response.data.data;
  },
  getInventoryById: async (id: string): Promise<Inventory> => {
    const response = await get<{ data: Inventory }>(`/inventory/${id}`);
    return response.data.data;
  },
  createInventory: async (data: CreateInventoryInput): Promise<Inventory> => {
    const response = await post<{ data: Inventory }>(`/inventory`, data);
    return response.data.data;
  },
  updateInventory: async (id: string, data: UpdateInventoryInput): Promise<Inventory> => {
    const response = await put<{ data: Inventory }>(`/inventory/${id}`, data);
    return response.data.data;
  },
  deleteInventory: async (id: string): Promise<void> => {
    await del(`/inventory/${id}`);
  },
  getInventoryAuditLog: async (
    inventoryId: string,
    params?: any
  ): Promise<{ data: InventoryAuditLog[]; pagination?: { total: number } }> => {
    const response = await get<{ data: InventoryAuditLog[]; pagination?: { total: number } }>(
      `/inventory/${inventoryId}/audit_log`,
      { params }
    );
    return response.data;
  },
  getLowStockItems: async (companyId: string) => {
    const response = await get<{ data: any[] }>(`/companies/${companyId}/inventory/low-stock`);
    return response.data;
  },
  getExpiringBatches: async (companyId: string, days: number) => {
    const response = await get<{ data: any[] }>(`/companies/${companyId}/inventory/expiring-batches?days=${days}`);
    return response.data;
  }
};
