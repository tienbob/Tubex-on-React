// shared-types.ts - Common interfaces shared between services

export interface WarehouseInventoryItem {
  id: string;
  warehouse_id: string;
  inventory_item_id: string;
  quantity: number;
  created_at?: string;
  updated_at?: string;
  warehouse?: {
    id: string;
    name: string;
  };
}

export interface Product {
  id: string;
  name: string;
  unit: string;
}

export interface ContactInfo {
  name?: string;
  phone?: string;
  email?: string;
}
