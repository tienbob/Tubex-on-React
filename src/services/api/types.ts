export interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  product?: {
    id: string;
    name: string;
    description: string;
    base_price: number;
  };
}

export interface Order {
  id: string;
  customer_id: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  delivery_address?: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  metadata?: {
    last_updated?: string;
    updated_by?: string;
    previous_status?: string;
    notes?: string;
  };
}

export interface Inventory {
  id: string;
  product_id: string;
  warehouse_id: string;
  company_id: string;
  quantity: number;
  unit: string;
  min_threshold?: number;
  max_threshold?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  auto_reorder: boolean;
  last_reorder_date?: string;
  status: 'active' | 'inactive';
  product?: {
    id: string;
    name: string;
    description: string;
    base_price: number;
  };
  warehouse?: {
    id: string;
    name: string;
    location: string;
  };
  batches?: {
    id: string;
    batch_number: string;
    quantity: number;
    expiry_date?: string;
  }[];
  stock_status?: {
    is_low: boolean;
    current_quantity: number;
    threshold: number;
  };
}