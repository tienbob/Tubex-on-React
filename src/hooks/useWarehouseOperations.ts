import React, { useState, useCallback, useRef } from 'react';
import useApiRequest from './useApiRequest';
import { warehouseService, Warehouse, WarehouseCreateInput, WarehouseUpdateInput } from '../services/api/warehouseService';

interface UseWarehouseOperationsProps {
  companyId: string;
  onWarehouseCreated?: (warehouse: Warehouse) => void;
  onWarehouseUpdated?: (warehouse: Warehouse) => void;
  onWarehouseDeleted?: (warehouseId: string) => void;
}

/**
 * Custom hook for warehouse CRUD operations
 */
export function useWarehouseOperations({
  companyId,
  onWarehouseCreated,
  onWarehouseUpdated,
  onWarehouseDeleted
}: UseWarehouseOperationsProps) {  // Track the currently selected warehouse
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  
  // Reference to store the current warehouse ID for delete operation
  const deleteWarehouseIdRef = useRef<string>('');

  // API request for fetching warehouses
  const warehousesRequest = useApiRequest<Warehouse[]>(
    async () => {
      if (!companyId) {
        return [];
      }
      return await warehouseService.getWarehouses({ company_id: companyId });
    },
    [],
    {
      dependencies: [companyId],
      manual: !companyId
    }
  );
  // API request for fetching a single warehouse by ID
  const singleWarehouseRequest = useApiRequest<Warehouse, [string]>(
    async (warehouseId) => {
      return await warehouseService.getWarehouseById(warehouseId);
    },
    [''], // Default empty string arguments
    { manual: true }
  );
  // API request for creating a warehouse
  const createWarehouseRequest = useApiRequest<Warehouse, [WarehouseCreateInput]>(
    async (warehouseData) => {
      return await warehouseService.createWarehouse({ ...warehouseData, company_id: companyId });
    },
    [{} as WarehouseCreateInput], // Default arguments
    {
      manual: true,
      onSuccess: (created) => {
        warehousesRequest.request();
        if (onWarehouseCreated && created) {
          onWarehouseCreated(created);
        }
      }
    }
  );
  // API request for updating a warehouse
  const updateWarehouseRequest = useApiRequest<Warehouse, [string, WarehouseUpdateInput]>(
    async (warehouseId, warehouseData) => {
      return await warehouseService.updateWarehouse(warehouseId, warehouseData);
    },
    ['', {} as WarehouseUpdateInput], // Default arguments
    {
      manual: true,
      onSuccess: (updated) => {
        warehousesRequest.request();
        if (onWarehouseUpdated && updated) {
          onWarehouseUpdated(updated);
        }
      }
    }
  );
  // API request for deleting a warehouse
  const deleteWarehouseRequest = useApiRequest<{ success: boolean; message: string }, [string]>(
    async (warehouseId) => {
      return await warehouseService.deleteWarehouse(warehouseId);
    },
    [''], // Default arguments
    {
      manual: true,
      onSuccess: () => {
        // Store warehouseId locally from the request context
        const storedWarehouseId = deleteWarehouseIdRef.current;
        
        warehousesRequest.request();
        if (onWarehouseDeleted && storedWarehouseId) {
          onWarehouseDeleted(storedWarehouseId);
        }
        
        // If the deleted warehouse was selected, reset selection
        if (selectedWarehouse === storedWarehouseId) {
          setSelectedWarehouse('');
        }
      }
    }
  );

  // Helper function to fetch all warehouses
  const fetchWarehouses = useCallback(() => {
    if (companyId) {
      warehousesRequest.request();
    }
  }, [companyId, warehousesRequest]);

  // Helper function to fetch a specific warehouse
  const fetchWarehouse = useCallback(
    (warehouseId: string) => {
      if (warehouseId) {
        return singleWarehouseRequest.request(warehouseId);
      }
      return Promise.reject(new Error('Warehouse ID is missing'));
    },
    [singleWarehouseRequest]
  );

  // Helper function to create a new warehouse
  const createWarehouse = useCallback(
    (warehouseData: WarehouseCreateInput) => {
      if (companyId) {
        return createWarehouseRequest.request({ ...warehouseData, company_id: companyId });
      }
      return Promise.reject(new Error('Company ID is missing'));
    },
    [companyId, createWarehouseRequest]
  );

  // Helper function to update a warehouse
  const updateWarehouse = useCallback(
    (warehouseId: string, warehouseData: WarehouseUpdateInput) => {
      if (warehouseId) {
        return updateWarehouseRequest.request(warehouseId, warehouseData);
      }
      return Promise.reject(new Error('Warehouse ID is missing'));
    },
    [updateWarehouseRequest]
  );
  // Helper function to delete a warehouse
  const deleteWarehouse = useCallback(
    (warehouseId: string) => {
      if (warehouseId) {
        // Store the warehouseId in the ref to access it in onSuccess callback
        deleteWarehouseIdRef.current = warehouseId;
        return deleteWarehouseRequest.request(warehouseId);
      }
      return Promise.reject(new Error('Warehouse ID is missing'));
    },
    [deleteWarehouseRequest]
  );

  // Get combined error from any of the API requests
  const error =
    warehousesRequest.error ||
    singleWarehouseRequest.error ||
    createWarehouseRequest.error ||
    updateWarehouseRequest.error ||
    deleteWarehouseRequest.error;

  // Check if any request is loading
  const isLoading =
    warehousesRequest.isLoading ||
    singleWarehouseRequest.isLoading ||
    createWarehouseRequest.isLoading ||
    updateWarehouseRequest.isLoading ||
    deleteWarehouseRequest.isLoading;

  // Get warehouses from the request data
  const warehouses = warehousesRequest.data || [];

  return {
    // State
    selectedWarehouse,
    setSelectedWarehouse,
    warehouses,
    error,
    isLoading,
    
    // API request states
    warehousesRequest,
    singleWarehouseRequest,
    createWarehouseRequest,
    updateWarehouseRequest,
    deleteWarehouseRequest,
    
    // Helper methods
    fetchWarehouses,
    fetchWarehouse,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse
  };
}

export default useWarehouseOperations;
