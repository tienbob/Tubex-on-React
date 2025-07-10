import { get, post, put, del } from './apiClient';

export interface WarehouseInventoryItem {
  id: string;
  warehouse_id: string;
  inventory_item_id: string;
  quantity: number;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface WarehouseInventoryItemCreateInput {
  warehouse_id: string;
  inventory_item_id: string;
  quantity: number;
  metadata?: Record<string, any>;
}

export interface WarehouseInventoryItemUpdateInput {
  quantity?: number;
  metadata?: Record<string, any>;
}

export const warehouseInventoryItemService = {
  getAll: async (params?: any): Promise<WarehouseInventoryItem[]> => {
    const response = await get<{ data: WarehouseInventoryItem[] }>(`/warehouse_inventory_items`, { params });
    return response.data.data;
  },
  getById: async (id: string): Promise<WarehouseInventoryItem> => {
    const response = await get<{ data: WarehouseInventoryItem }>(`/warehouse_inventory_items/${id}`);
    return response.data.data;
  },
  create: async (data: WarehouseInventoryItemCreateInput): Promise<WarehouseInventoryItem> => {
    const response = await post<{ data: WarehouseInventoryItem }>(`/warehouse_inventory_items`, data);
    return response.data.data;
  },
  update: async (id: string, data: WarehouseInventoryItemUpdateInput): Promise<WarehouseInventoryItem> => {
    const response = await put<{ data: WarehouseInventoryItem }>(`/warehouse_inventory_items/${id}`, data);
    return response.data.data;
  },
  delete: async (id: string): Promise<void> => {
    await del(`/warehouse_inventory_items/${id}`);
  }
};
