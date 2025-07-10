import { get, post, put, del } from './apiClient';

export interface ContactInfo {
  name?: string;
  phone?: string;
  email?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string; // matches backend 'location'
  status: string;   // string enum, matches backend
  company_id: string;
  contact_info?: ContactInfo;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface WarehouseCreateInput {
  name: string;
  location: string;
  status?: string;
  company_id: string;
  contact_info?: ContactInfo;
  metadata?: any;
}

export interface WarehouseUpdateInput {
  name?: string;
  location?: string;
  status?: string;
  company_id?: string;
  contact_info?: ContactInfo;
  metadata?: any;
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
      // Restructure the data to match the backend's expected format
      // Rails strong parameters typically expect nested attributes to be in a specific format
      const transformedData = {
        warehouse: {
          name: data.name,
          address: data.location, // Using location as address based on the error message
          company_id: data.company_id,
          status: data.status || 'active',
          // Flatten contact_info to match Rails params
          contact_name: data.contact_info?.name,
          contact_phone: data.contact_info?.phone,
          contact_email: data.contact_info?.email,
          // Handle capacity from metadata
          capacity: data.metadata?.capacity,
          // Keep the original metadata as JSON string if needed
          metadata_json: data.metadata ? JSON.stringify(data.metadata) : null
        }
      };
      
      console.log('Creating warehouse with data:', transformedData);
      const response = await post<Warehouse>(`/warehouses`, transformedData);
      return response.data;
    } catch (error) {
      console.error('Error creating warehouse:', error);
      throw error;
    }
  },
  updateWarehouse: async (id: string, data: WarehouseUpdateInput): Promise<Warehouse> => {
    try {
      // Similar transformation as createWarehouse
      const transformedData = {
        warehouse: {
          ...(data.name && { name: data.name }),
          ...(data.location && { address: data.location }),
          ...(data.company_id && { company_id: data.company_id }),
          ...(data.status && { status: data.status }),
          // Only include contact fields if contact_info is provided
          ...(data.contact_info?.name && { contact_name: data.contact_info.name }),
          ...(data.contact_info?.phone && { contact_phone: data.contact_info.phone }),
          ...(data.contact_info?.email && { contact_email: data.contact_info.email }),
          // Include capacity if provided in metadata
          ...(data.metadata?.capacity && { capacity: data.metadata.capacity }),
          // Update metadata JSON if provided
          ...(data.metadata && { metadata_json: JSON.stringify(data.metadata) })
        }
      };
      
      console.log('Updating warehouse with data:', transformedData);
      const response = await put<Warehouse>(`/warehouses/${id}`, transformedData);
      return response.data;
    } catch (error) {
      console.error('Error updating warehouse:', error);
      throw error;
    }
  },
  deleteWarehouse: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await del<{ success: boolean; message: string }>(`/warehouses/${id}`);
    return response.data;
  }
};
