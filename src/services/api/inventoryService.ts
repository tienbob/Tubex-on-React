import { get, post, put, del } from './apiClient';
import { AxiosError } from 'axios';
import { WarehouseInventoryItem, Product } from './shared-types';

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
  warehouse_inventory_items?: WarehouseInventoryItem[];
  product?: Product;
}

export interface CreateInventoryInput {
  product_id: string;
  company_id: string;
  quantity: number;
  unit: string;
  min_threshold?: number;
  max_threshold?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  auto_reorder?: boolean;
  metadata?: Record<string, any>;
  warehouse_inventory_items?: Array<{
    warehouse_id: string;
    quantity: number;
  }>;
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
    try {
      // Transform data to match backend's expected format
      const transformedData = {
        inventory: {
          product_id: data.product_id,
          company_id: data.company_id,
          quantity: data.quantity,
          unit: data.unit,
          min_threshold: data.min_threshold,
          max_threshold: data.max_threshold,
          reorder_point: data.reorder_point,
          reorder_quantity: data.reorder_quantity,
          auto_reorder: data.auto_reorder,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          // We'll handle warehouse_inventory_items separately after creating the inventory
        }
      };
      
      // First create the inventory item
      const response = await post<{ data: Inventory }>(`/inventory`, transformedData);
      const inventory = response.data.data;
      
      // Then if warehouse_inventory_items is provided, add them
      if (data.warehouse_inventory_items && data.warehouse_inventory_items.length > 0) {
        console.log('Creating warehouse assignments:', data.warehouse_inventory_items);
        
        const warehouseAssignments = await Promise.all(
          data.warehouse_inventory_items.map(async (item) => {
            try {
              console.log(`Adding inventory ${inventory.id} to warehouse ${item.warehouse_id} with quantity ${item.quantity}`);
              return await inventoryService.addInventoryToWarehouse(
                inventory.id, 
                item.warehouse_id, 
                item.quantity
              );
            } catch (error) {
              console.error(`Failed to add inventory to warehouse ${item.warehouse_id}:`, error);
              throw error;
            }
          })
        );
        
        console.log('Warehouse assignments created successfully:', warehouseAssignments);
        
        // Get the updated inventory with warehouse items
        const updatedInventory = await inventoryService.getInventoryById(inventory.id);
        return updatedInventory;
      }
      
      return inventory;
    } catch (error) {
      console.error('Error creating inventory:', error);
      throw error;
    }
  },
  updateInventory: async (id: string, data: UpdateInventoryInput): Promise<Inventory> => {
    const transformedData = {
      inventory: {
        quantity: data.quantity,
        unit: data.unit,
        min_threshold: data.min_threshold,
        max_threshold: data.max_threshold,
        reorder_point: data.reorder_point,
        reorder_quantity: data.reorder_quantity,
        auto_reorder: data.auto_reorder,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null
      }
    };
    
    const response = await put<{ data: Inventory }>(`/inventory/${id}`, transformedData);
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
  },
  // New methods to handle warehouse inventory items relationship
  getWarehouseInventoryItems: async (warehouseId: string): Promise<WarehouseInventoryItem[]> => {
    const response = await get<{ data: WarehouseInventoryItem[] }>(`/warehouses/${warehouseId}/inventory_items`);
    return response.data.data;
  },
  
  addInventoryToWarehouse: async (
    inventoryId: string, 
    warehouseId: string, 
    quantity: number
  ): Promise<WarehouseInventoryItem> => {
    const response = await post<{ data: WarehouseInventoryItem }>(
      `/warehouse_inventory_items`, 
      {
        warehouse_inventory_item: {
          warehouse_id: warehouseId,
          inventory_item_id: inventoryId,
          quantity
        }
      }
    );
    return response.data.data;
  },
  
  updateWarehouseInventory: async (
    warehouseInventoryItemId: string, 
    quantity: number
  ): Promise<WarehouseInventoryItem> => {
    const response = await put<{ data: WarehouseInventoryItem }>(
      `/warehouse_inventory_items/${warehouseInventoryItemId}`, 
      {
        warehouse_inventory_item: {
          quantity
        }
      }
    );
    return response.data.data;
  },
  
  removeInventoryFromWarehouse: async (warehouseInventoryItemId: string): Promise<void> => {
    await del(`/warehouse_inventory_items/${warehouseInventoryItemId}`);
  },
};
