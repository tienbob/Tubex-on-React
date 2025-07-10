import { useCallback } from 'react';
import useTableData from './useTableData';
import useApiRequest from './useApiRequest';
import { inventoryService, Inventory, CreateInventoryInput } from '../services/api/inventoryService';

interface UseInventoryOperationsProps {
  companyId: string;
  warehouseId?: string;
  onInventoryCreated?: (item: Inventory) => void;
  onInventoryUpdated?: (item: Inventory) => void;
  onInventoryDeleted?: (itemId: string) => void;
}

/**
 * Custom hook for inventory operations
 */
export function useInventoryOperations({
  companyId,
  warehouseId,
  onInventoryCreated,
  onInventoryUpdated,
  onInventoryDeleted
}: UseInventoryOperationsProps) {
  // Function to fetch inventory data with parameters
  const fetchInventoryData = useCallback(
    async (params: any) => {
      if (!companyId) {
        return { data: [], totalCount: 0 };
      }

      const apiParams = {
        company_id: companyId,
        warehouse_id: warehouseId,
        page: params.page,
        limit: params.limit,
        sort_by: params.sortBy,
        sort_direction: params.sortDirection,
        search: params.search || undefined,
        ...params.filters
      };

      try {
        const data = await inventoryService.getInventory(apiParams);
        return {
          data: data || [],
          totalCount: data.length || 0
        };
      } catch (error) {
        console.error('Error fetching inventory:', error);
        throw error;
      }
    },
    [companyId, warehouseId]
  );

  // Use table hook for inventory data
  const inventoryTable = useTableData<Inventory>({
    defaultSortBy: 'product.name',
    defaultSortDirection: 'asc',
    fetchDataFn: fetchInventoryData
  });
  // API request for creating inventory item
  const createInventoryRequest = useApiRequest<Inventory, [CreateInventoryInput]>(
    async (itemData) => {
      return await inventoryService.createInventory(itemData);
    },
    [{} as CreateInventoryInput],
    {
      manual: true,
      onSuccess: (created) => {
        inventoryTable.fetchData();
        if (onInventoryCreated && created) {
          onInventoryCreated(created);
        }
      }
    }
  );

  // Helper function to create a new inventory item
  const createInventoryItem = useCallback(
    (itemData: CreateInventoryInput) => {
      if (!companyId) {
        return Promise.reject(new Error('Company ID is missing'));
      }
      
      const fullItemData = {
        ...itemData,
        company_id: companyId
      };
      
      return createInventoryRequest.request(fullItemData);
    },
    [companyId, createInventoryRequest]
  );

  // Get combined error from any of the API requests
  const error = inventoryTable.error || createInventoryRequest.error?.message;

  // Check if any request is loading
  const isLoading = inventoryTable.loading || createInventoryRequest.isLoading;

  // Function to refetch data when warehouse changes
  const refreshInventory = useCallback(() => {
    inventoryTable.fetchData();
  }, [inventoryTable]);

  return {
    // State
    inventory: inventoryTable.data,
    isLoading,
    error,
    
    // Table state and actions
    page: inventoryTable.page,
    rowsPerPage: inventoryTable.rowsPerPage,
    totalCount: inventoryTable.totalCount,
    sortBy: inventoryTable.sortBy,
    sortDirection: inventoryTable.sortDirection,
    searchQuery: inventoryTable.searchQuery,
    filters: inventoryTable.filters,
    
    // Table handlers
    handlePageChange: inventoryTable.handlePageChange,
    handleRowsPerPageChange: inventoryTable.handleRowsPerPageChange,
    handleSortByChange: inventoryTable.handleSortByChange,
    handleSortDirectionChange: inventoryTable.handleSortDirectionChange,
    handleSearchQueryChange: inventoryTable.handleSearchQueryChange,
    handleFilterChange: inventoryTable.handleFilterChange,
    resetFilters: inventoryTable.resetFilters,
    
    // Inventory operation functions
    refreshInventory,
    createInventoryItem,
    
    // API request states
    createInventoryRequest
  };
}

export default useInventoryOperations;
