// warehouseInventoryService.ts - Service for managing warehouse-inventory relationships

import { warehouseService } from './warehouseService';
import { inventoryService } from './inventoryService';
import { WarehouseInventoryItem } from './shared-types';

export interface WarehouseWithInventory {
  id: string;
  name: string;
  address: string;
  status: string;
  company_id: string;
  inventory_items: Array<WarehouseInventoryItem & {
    product_name?: string;
    product_id?: string;
  }>;
}

export interface InventoryDistribution {
  inventory_id: string;
  product_name: string;
  total_quantity: number;
  warehouses: Array<{
    warehouse_id: string;
    warehouse_name: string;
    quantity: number;
  }>;
}

export const warehouseInventoryService = {
  // Get all warehouses with their inventory for a company
  getWarehousesWithInventory: async (companyId: string): Promise<WarehouseWithInventory[]> => {
    try {
      const warehouses = await warehouseService.getWarehouses({ company_id: companyId });
      
      const warehousesWithInventory = await Promise.all(
        warehouses.map(async (warehouse) => {
          const inventoryItems = await warehouseService.getWarehouseInventory(warehouse.id);
          return {
            ...warehouse,
            inventory_items: inventoryItems
          };
        })
      );
      
      return warehousesWithInventory;
    } catch (error) {
      console.error('Error getting warehouses with inventory:', error);
      throw error;
    }
  },

  // Move inventory from one warehouse to another
  moveInventoryBetweenWarehouses: async (
    inventoryId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    quantity: number
  ): Promise<void> => {
    try {
      // Get current warehouse inventory items
      const fromItems = await inventoryService.getWarehouseInventoryItems(fromWarehouseId);
      const fromItem = fromItems.find(item => item.inventory_item_id === inventoryId);
      
      if (!fromItem || fromItem.quantity < quantity) {
        throw new Error('Insufficient inventory in source warehouse');
      }
      
      // Reduce quantity in source warehouse
      if (fromItem.quantity === quantity) {
        // Remove entirely if moving all
        await inventoryService.removeInventoryFromWarehouse(fromItem.id);
      } else {
        // Update quantity
        await inventoryService.updateWarehouseInventory(fromItem.id, fromItem.quantity - quantity);
      }
      
      // Check if item already exists in destination warehouse
      const toItems = await inventoryService.getWarehouseInventoryItems(toWarehouseId);
      const toItem = toItems.find(item => item.inventory_item_id === inventoryId);
      
      if (toItem) {
        // Update existing item
        await inventoryService.updateWarehouseInventory(toItem.id, toItem.quantity + quantity);
      } else {
        // Add new item to warehouse
        await inventoryService.addInventoryToWarehouse(inventoryId, toWarehouseId, quantity);
      }
    } catch (error) {
      console.error('Error moving inventory between warehouses:', error);
      throw error;
    }
  },

  // Get inventory distribution across warehouses
  getInventoryDistribution: async (companyId: string): Promise<InventoryDistribution[]> => {
    try {
      // This would require a backend endpoint that aggregates data
      // For now, we'll construct it from multiple calls
      const warehouses = await warehouseService.getWarehouses({ company_id: companyId });
      const inventoryMap = new Map<string, InventoryDistribution>();
      
      for (const warehouse of warehouses) {
        const inventoryItems = await warehouseService.getWarehouseInventory(warehouse.id);
        
        for (const item of inventoryItems) {
          const key = item.inventory_item_id;
          
          if (!inventoryMap.has(key)) {
            inventoryMap.set(key, {
              inventory_id: item.inventory_item_id,
              product_name: '', // Would need to fetch product info
              total_quantity: 0,
              warehouses: []
            });
          }
          
          const distribution = inventoryMap.get(key)!;
          distribution.total_quantity += item.quantity;
          distribution.warehouses.push({
            warehouse_id: warehouse.id,
            warehouse_name: warehouse.name,
            quantity: item.quantity
          });
        }
      }
      
      return Array.from(inventoryMap.values());
    } catch (error) {
      console.error('Error getting inventory distribution:', error);
      throw error;
    }
  },

  // Bulk update inventory across multiple warehouses
  bulkUpdateWarehouseInventory: async (
    updates: Array<{
      warehouse_inventory_item_id: string;
      quantity: number;
    }>
  ): Promise<WarehouseInventoryItem[]> => {
    try {
      const results = await Promise.all(
        updates.map(update => 
          inventoryService.updateWarehouseInventory(
            update.warehouse_inventory_item_id, 
            update.quantity
          )
        )
      );
      
      return results;
    } catch (error) {
      console.error('Error bulk updating warehouse inventory:', error);
      throw error;
    }
  }
};
