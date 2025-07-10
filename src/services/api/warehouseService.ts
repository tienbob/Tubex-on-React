import { get, post, put, del } from './apiClient';
import { ContactInfo, WarehouseInventoryItem } from './shared-types';

export interface Warehouse {
  id: string;
  name: string;
  address: string; // matches backend 'address' instead of 'location'
  status: string;   // string enum, matches backend
  company_id: string;
  contact_info?: ContactInfo;
  metadata?: any;
  capacity?: number;
  warehouse_type?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WarehouseCreateInput {
  name: string;
  address: string;
  status?: string;
  company_id: string;
  contact_info?: ContactInfo;
  metadata?: any;
  capacity?: number;
  warehouse_type?: string;
  notes?: string;
}

export interface WarehouseUpdateInput {
  name?: string;
  address?: string;
  status?: string;
  company_id?: string;
  contact_info?: ContactInfo;
  metadata?: any;
  capacity?: number;
  warehouse_type?: string;
  notes?: string;
}

export interface WarehouseListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  company_id?: string;
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const warehouseService = {
  getWarehouses: async (params?: WarehouseListParams): Promise<Warehouse[]> => {
    const response = await get<Warehouse[]>(`/warehouses`, { params });
    return response.data;
  },
  getWarehouseById: async (id: string): Promise<Warehouse> => {
    const response = await get<Warehouse>(`/warehouses/${id}`);
    return response.data;
  },
  createWarehouse: async (data: WarehouseCreateInput): Promise<Warehouse> => {
    try {
      // Send data to match the backend schema exactly
      const transformedData = {
        warehouse: {
          name: data.name,
          address: data.address, // Now matches database schema
          company_id: data.company_id,
          status: data.status || 'active',
          capacity: data.capacity,
          warehouse_type: data.warehouse_type,
          notes: data.notes,
          // Send contact_info as a JSON string (as expected by the model)
          contact_info: data.contact_info ? JSON.stringify(data.contact_info) : null,
          // Send metadata as a JSON string
          metadata: data.metadata ? JSON.stringify(data.metadata) : null
        }
      };
      
      const response = await post<Warehouse>(`/warehouses`, transformedData);
      return response.data;
    } catch (error) {
      console.error('Error creating warehouse:', error);
      throw error;
    }
  },
  updateWarehouse: async (id: string, data: WarehouseUpdateInput): Promise<Warehouse> => {
    try {
      // Send data to match the backend schema exactly
      const transformedData = {
        warehouse: {
          ...(data.name && { name: data.name }),
          ...(data.address && { address: data.address }), // Now matches database schema
          ...(data.company_id && { company_id: data.company_id }),
          ...(data.status && { status: data.status }),
          ...(data.capacity && { capacity: data.capacity }),
          ...(data.warehouse_type && { warehouse_type: data.warehouse_type }),
          ...(data.notes && { notes: data.notes }),
          // Handle contact_info as a JSON string
          ...(data.contact_info && { contact_info: JSON.stringify(data.contact_info) }),
          // Handle metadata as a JSON string
          ...(data.metadata && { metadata: JSON.stringify(data.metadata) })
        }
      };
      
      const response = await put<Warehouse>(`/warehouses/${id}`, transformedData);
      return response.data;
    } catch (error) {
      console.error('Error updating warehouse:', error);
      throw error;
    }
  },
  deleteWarehouse: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await del<{ status: string; message: string }>(`/warehouses/${id}`);
      return {
        success: response.data.status === 'success',
        message: response.data.message || 'Warehouse deleted successfully'
      };
    } catch (error: any) { // Type as any to access error properties
      console.error('Error deleting warehouse:', error);
      
      // For any error
      return {
        success: false,
        message: error.response?.data?.message || 
                error.response?.data?.error || 
                'Failed to delete warehouse. Try again later.'
      };
    }
  },
  getWarehouseInventory: async (warehouseId: string): Promise<WarehouseInventoryItem[]> => {
    const response = await get<{ data: WarehouseInventoryItem[] }>(`/warehouses/${warehouseId}/inventory_items`);
    return response.data.data;
  },
  
  // Get all warehouses with their inventory items
  getWarehousesWithInventory: async (companyId: string): Promise<Array<Warehouse & { inventory_items: any[] }>> => {
    const response = await get<{ data: Array<Warehouse & { inventory_items: any[] }> }>(
      `/companies/${companyId}/warehouses/with_inventory`
    );
    return response.data.data;
  },
};
