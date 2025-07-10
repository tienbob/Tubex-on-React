import React, { useReducer, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  useTheme as useMuiTheme,
  SelectChangeEvent,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation';
import WarningIcon from '@mui/icons-material/Warning';
import DataTable, { Column } from '../shared/DataTable';
import { useTheme } from '../../contexts/ThemeContext';
import { inventoryService, warehouseService } from '../../services/api';
import { Inventory } from '../../services/api/inventoryService';
import { useAuth } from '../auth/AuthContext';
import { useAccessControl } from '../../hooks/useAccessControl';
import RoleGuard from '../auth/RoleGuard';

interface InventoryListProps {
  companyId: string; // Required parameter
  warehouseId?: string;
  onAdjustInventory?: (inventoryId: string) => void;
  onTransferInventory?: (inventoryId: string) => void;
  onAddInventory?: () => void;
  hideActions?: boolean;
  maxHeight?: number | string;
  onInventorySelect?: (inventoryId: string) => void;
  onTransferClick?: (product: { id: string; name: string }) => void;
};

// Restore Warehouse interface for local use
interface Warehouse {
  id: string;
  name: string;
  [key: string]: any;
}

// Define state interface
interface InventoryListState {
  inventory: Inventory[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  selectedWarehouse: string;
  warehouses: Warehouse[];
  page: number;
  rowsPerPage: number;
  totalCount: number;
  batchFilter: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

// Define action types
type InventoryListAction =
  | { type: 'SET_INVENTORY'; payload: { data: Inventory[], totalCount: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_SELECTED_WAREHOUSE'; payload: string }
  | { type: 'SET_WAREHOUSES'; payload: Warehouse[] }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_ROWS_PER_PAGE'; payload: number }
  | { type: 'SET_BATCH_FILTER'; payload: string }
  | { type: 'SET_SORT_BY'; payload: string }
  | { type: 'SET_SORT_DIRECTION'; payload: 'asc' | 'desc' };

// Define initial state
const initialState: InventoryListState = {
  inventory: [],
  loading: false,
  error: null,
  searchTerm: '',
  selectedWarehouse: '',
  warehouses: [],
  page: 0,
  rowsPerPage: 10,
  totalCount: 0,
  batchFilter: '',
  sortBy: 'product_name',
  sortDirection: 'asc'
};

// Define reducer function
const inventoryListReducer = (state: InventoryListState, action: InventoryListAction): InventoryListState => {
  switch (action.type) {
    case 'SET_INVENTORY':
      return {
        ...state,
        inventory: action.payload.data,
        totalCount: action.payload.totalCount
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    case 'SET_SEARCH_TERM':
      return {
        ...state,
        searchTerm: action.payload
      };
    case 'SET_SELECTED_WAREHOUSE':
      return {
        ...state,
        selectedWarehouse: action.payload,
        page: 0
      };
    case 'SET_WAREHOUSES':
      return {
        ...state,
        warehouses: action.payload
      };
    case 'SET_PAGE':
      return {
        ...state,
        page: action.payload
      };
    case 'SET_ROWS_PER_PAGE':
      return {
        ...state,
        rowsPerPage: action.payload,
        page: 0
      };
    case 'SET_BATCH_FILTER':
      return {
        ...state,
        batchFilter: action.payload,
        page: 0
      };
    case 'SET_SORT_BY':
      return {
        ...state,
        sortBy: action.payload,
        page: 0
      };
    case 'SET_SORT_DIRECTION':
      return {
        ...state,
        sortDirection: action.payload,
        page: 0
      };
    default:
      return state;
  }
};

const InventoryList: React.FC<InventoryListProps> = ({
  companyId,
  warehouseId,
  onAdjustInventory,
  onTransferInventory,
  onAddInventory,
  hideActions = false,
  maxHeight,
  onInventorySelect,
  onTransferClick,
}) => {
  // Theme hooks
  const { theme: whitelabelTheme } = useTheme();
  const muiTheme = useMuiTheme();
  const { user } = useAuth();
  const { canPerform } = useAccessControl();

  // Use reducer for state management
  const [state, dispatch] = useReducer(inventoryListReducer, {
    ...initialState,
    selectedWarehouse: warehouseId || ''
  });
  
  // Custom button style based on the whitelabel theme
  const buttonStyle = {
    backgroundColor: whitelabelTheme?.primaryColor || muiTheme.palette.primary.main,
    color: '#fff',
    borderRadius: whitelabelTheme?.buttonRadius !== undefined ? `${whitelabelTheme.buttonRadius}px` : undefined,
    '&:hover': {
      backgroundColor: whitelabelTheme?.primaryColor ? 
        `${whitelabelTheme.primaryColor}dd` : muiTheme.palette.primary.dark,
    },
  };  const fetchInventory = useCallback(async () => {
    if (!companyId) {
      console.error('Company ID is required');
      dispatch({ type: 'SET_ERROR', payload: 'Company ID is required' });
      return;
    }
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const params: any = {
        page: state.page + 1,
        limit: state.rowsPerPage,
        search: state.searchTerm || undefined,
        warehouse_id: state.selectedWarehouse || undefined,
        company_id: companyId,
        sort_by: state.sortBy,
        sort_direction: state.sortDirection,
      };
      if (state.batchFilter) {
        params.batch_number = state.batchFilter;
      }
      const inventoryData = await inventoryService.getInventory(params);
      dispatch({
        type: 'SET_INVENTORY',
        payload: {
          data: inventoryData,
          totalCount: inventoryData.length
        }
      });
    } catch (err: any) {
      console.error('Error fetching inventory:', err.message);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to load inventory' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [companyId, state.page, state.rowsPerPage, state.searchTerm, state.selectedWarehouse, state.batchFilter, state.sortBy, state.sortDirection]);

  const fetchWarehouses = useCallback(async () => {
    if (warehouseId) return;
    if (!companyId) {
      console.error('Company ID is required to fetch warehouses');
      return;
    }
    try {
      const warehousesList = await warehouseService.getWarehouses({ company_id: companyId });
      dispatch({ type: 'SET_WAREHOUSES', payload: warehousesList });
    } catch (err: any) {
      dispatch({ type: 'SET_WAREHOUSES', payload: [] });
    }
  }, [companyId, warehouseId]);
    // useEffect hooks
  useEffect(() => {
    if (companyId) {
      fetchWarehouses();
    }
  }, [companyId, warehouseId, fetchWarehouses]);
    useEffect(() => {
    if (companyId) {
      fetchInventory();
    }  }, [companyId, state.page, state.rowsPerPage, state.searchTerm, state.selectedWarehouse, 
      state.batchFilter, state.sortBy, state.sortDirection]);
  
  const handleSearch = useCallback(() => {
    dispatch({ type: 'SET_PAGE', payload: 0 }); // Reset to first page when searching
    fetchInventory();
  }, [fetchInventory]);
  
  const handleSearchKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);
  
  const handleWarehouseChange = useCallback((event: SelectChangeEvent<string>) => {
    const { value } = event.target;
    dispatch({ type: 'SET_SELECTED_WAREHOUSE', payload: value });
    // Page reset is handled in the reducer
  }, []);
    const formatQuantityWithUnit = (quantity: number, unit: string) => {
    const qty = Number(quantity) || 0;
    const unitStr = unit || '';
    return `${qty.toLocaleString()} ${unitStr}`.trim();
  };
  const getStockLevelIndicator = (current: number, threshold: number, capacity: number) => {
    let color: 'default' | 'success' | 'warning' | 'error' = 'default';
    let label = 'Normal';
    
    // Ensure we have valid numbers
    const currentQty = Number(current) || 0;
    const thresholdQty = Number(threshold) || 0;
    const capacityQty = Number(capacity) || 1000;
    
    const ratio = currentQty / capacityQty;
    
    if (currentQty <= thresholdQty && thresholdQty > 0) {
      color = 'error';
      label = 'Low';
    } else if (ratio >= 0.9) {
      color = 'warning';
      label = 'High';
    } else if (ratio >= 0.5) {
      color = 'success';
      label = 'Good';
    }
    
    return <Chip size="small" color={color} label={label} sx={{ minWidth: 60 }} />;
  };
  
  // Validate the required companyId after all hooks are called
  if (!companyId) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Company ID is required to display inventory
        </Alert>
      </Box>
    );
  }
  
  // Define columns
  const columns: Column[] = [
    {
      id: 'product_name',
      label: 'Product',
      minWidth: 170,
      // TODO: If product_name is not present, join with productService by product_id
    },
    {
      id: 'quantity',
      label: 'Quantity',
      minWidth: 120,
      align: 'right',
      format: (value, row) => formatQuantityWithUnit(value, row?.unit)
    },
    {
      id: 'warehouse_name',
      label: 'Warehouse',
      minWidth: 150,
      // TODO: If warehouse_name is not present, join with warehouseService by warehouse_id
      format: (value) => value || 'No Warehouse'
    },
    {
      id: 'batch_number',
      label: 'Batch',
      minWidth: 120,
      format: (value) => {
        if (!value) return 'N/A';
        if (value.length > 20) {
          const parts = value.split('-');
          const shortValue = parts[0] || value.substring(0, 10) + '...';
          return (
            <Tooltip title={value} arrow>
              <span style={{ cursor: 'help' }}>{shortValue}</span>
            </Tooltip>
          );
        }
        return value;
      }
    },
    {
      id: 'stock_level',
      label: 'Status',
      minWidth: 120,
      // Use min_threshold/max_threshold for stock indicator
      format: (_, row) => getStockLevelIndicator(
        row.quantity, 
        row.min_threshold || 0, // Use min_threshold if present
        row.max_threshold || 1000 // Use max_threshold as capacity if present
      )
    },
    {
      id: 'updated_at',
      label: 'Last Updated',
      minWidth: 150,
      format: (value) => value ? new Date(value).toLocaleString() : 'N/A'
    }
  ];
  
  // Add actions column if required
  if (!hideActions) {
    columns.push({      id: 'actions',
      label: 'Actions',
      minWidth: 120,
      align: 'right',
      format: (_, row) => (
        <Box>
          {onAdjustInventory && canPerform('inventory:edit') && (
            <Tooltip title="Adjust Inventory">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  onAdjustInventory(row.id);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
            {onTransferInventory && canPerform('inventory:edit') && (
            <Tooltip title="Transfer Inventory">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  onTransferInventory(row.id);
                }}
              >
                <TransferWithinAStationIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    });  }
  
  return (
    <Box sx={{ maxHeight }}>
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 2, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', md: 'center' } 
      }}>
        <Typography variant="h6" component="h2">
          Inventory
          {state.inventory.some(item => item.quantity <= (item.min_threshold || 0)) && (
            <Tooltip title="Some products have low stock">
              <WarningIcon 
                color="warning" 
                fontSize="small" 
                sx={{ ml: 1, verticalAlign: 'middle' }} 
              />
            </Tooltip>
          )}
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 2 
        }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              placeholder="Search products..."
              size="small"
              value={state.searchTerm}
              onChange={(e) => dispatch({ type: 'SET_SEARCH_TERM', payload: e.target.value })}
              onKeyPress={handleSearchKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: state.searchTerm && (
                  <InputAdornment position="end">
                    <Button 
                      size="small" 
                      onClick={() => {
                        dispatch({ type: 'SET_SEARCH_TERM', payload: '' });
                        if (!state.searchTerm) return;
                        setTimeout(() => handleSearch(), 0);
                      }}
                    >
                      Clear
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
              {!warehouseId && state.warehouses.length > 0 && (
              <FormControl sx={{ minWidth: 150 }} size="small">
                <InputLabel id="warehouse-filter-label">Warehouse</InputLabel>
                <Select
                  labelId="warehouse-filter-label"
                  value={state.selectedWarehouse}
                  onChange={handleWarehouseChange}
                  label="Warehouse"
                >
                  <MenuItem value="">All Warehouses</MenuItem>
                  {Array.isArray(state.warehouses) ? state.warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </MenuItem>
                  )) : null}
                </Select>
              </FormControl>
            )}

            <TextField
              placeholder="Filter by batch..."
              size="small"
              value={state.batchFilter}
              onChange={(e) => dispatch({ type: 'SET_BATCH_FILTER', payload: e.target.value })}
              sx={{ minWidth: 150 }}
            />
              <Tooltip title="Advanced Filters">
              <IconButton>
                <TuneIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          <RoleGuard action="inventory:create">
            {onAddInventory && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onAddInventory}
                sx={buttonStyle}
              >
                Add Inventory
              </Button>
            )}
          </RoleGuard>
        </Box>
      </Box>
      
      <DataTable
        columns={columns}
        data={state.inventory}
        loading={state.loading}
        error={state.error}
        pagination={{
          page: state.page,
          totalCount: state.totalCount,
          rowsPerPage: state.rowsPerPage,
          onPageChange: (newPage) => dispatch({ type: 'SET_PAGE', payload: newPage }),
          onRowsPerPageChange: (newRowsPerPage) => {
            dispatch({ type: 'SET_ROWS_PER_PAGE', payload: newRowsPerPage });
            // Page reset is handled in the reducer
          },
        }}
        onRowClick={onInventorySelect ? (row) => onInventorySelect(row.id) : undefined}
      />
    </Box>
  );
};

export default InventoryList;