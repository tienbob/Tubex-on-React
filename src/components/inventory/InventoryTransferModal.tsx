import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  Box,
  Typography,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import { inventoryService } from '../../services/api/inventoryService';
import { warehouseInventoryService } from '../../services/api/warehouseInventoryService';
import { warehouseService } from '../../services/api/warehouseService';

interface InventoryTransferModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  companyId: string;
  onTransferComplete?: () => void;
}

const InventoryTransferModal: React.FC<InventoryTransferModalProps> = ({
  open,
  onClose,
  productId,
  productName,
  companyId,
  onTransferComplete
}) => {
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetchingWarehouses, setFetchingWarehouses] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [sourceQuantityAvailable, setSourceQuantityAvailable] = useState<number | null>(null);
  const [isConnectionError, setIsConnectionError] = useState(false);

  useEffect(() => {
    if (open) {
      fetchWarehouses();
    }
  }, [open, companyId]);

  useEffect(() => {
    if (sourceWarehouseId) {
      fetchAvailableQuantity();
    } else {
      setSourceQuantityAvailable(null);
    }
  }, [sourceWarehouseId, productId]);

  const fetchWarehouses = async () => {
    setFetchingWarehouses(true);
    setApiError(null);
    setIsConnectionError(false);
    try {
      const warehousesList = await warehouseService.getWarehouses({ company_id: companyId });
      setWarehouses(warehousesList);
    } catch (error: any) {
      setApiError('Failed to load warehouses: ' + (error.message || 'Unknown error'));
    } finally {
      setFetchingWarehouses(false);
    }
  };

  const fetchAvailableQuantity = async () => {
    try {
      const inventoryList = await inventoryService.getInventory({ company_id: companyId, warehouse_id: sourceWarehouseId });
      const productInventory = inventoryList.find(item => item.product_id === productId);
      setSourceQuantityAvailable(productInventory ? productInventory.quantity : 0);
    } catch (error) {
      setSourceQuantityAvailable(null);
    }
  };

  const handleSourceWarehouseChange = (event: SelectChangeEvent) => {
    setSourceWarehouseId(event.target.value);
    if (event.target.value === destinationWarehouseId) {
      setDestinationWarehouseId('');
    }
    setErrors({ ...errors, sourceWarehouse: '' });
  };

  const handleDestinationWarehouseChange = (event: SelectChangeEvent) => {
    setDestinationWarehouseId(event.target.value);
    if (event.target.value === sourceWarehouseId) {
      setErrors({ ...errors, destinationWarehouse: 'Source and destination warehouses cannot be the same' });
    } else {
      setErrors({ ...errors, destinationWarehouse: '' });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!sourceWarehouseId) {
      newErrors.sourceWarehouse = 'Source warehouse is required';
    }
    
    if (!destinationWarehouseId) {
      newErrors.destinationWarehouse = 'Destination warehouse is required';
    }
    
    if (sourceWarehouseId === destinationWarehouseId) {
      newErrors.destinationWarehouse = 'Source and destination warehouses cannot be the same';
    }
    
    if (!quantity) {
      newErrors.quantity = 'Transfer quantity is required';
    } else if (isNaN(Number(quantity)) || Number(quantity) <= 0) {
      newErrors.quantity = 'Quantity must be a positive number';
    } else if (sourceQuantityAvailable !== null && Number(quantity) > sourceQuantityAvailable) {
      newErrors.quantity = `Only ${sourceQuantityAvailable} units available for transfer`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTransfer = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setApiError(null);
    
    try {
      // Use the new warehouse inventory service for transfers
      await warehouseInventoryService.moveInventoryBetweenWarehouses(
        productId,
        sourceWarehouseId,
        destinationWarehouseId,
        Number(quantity)
      );
      
      setSourceWarehouseId('');
      setDestinationWarehouseId('');
      setQuantity('');
      setNotes('');
      if (onTransferComplete) onTransferComplete();
      onClose();
    } catch (error: any) {
      setApiError(error.message || 'Failed to transfer inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Transfer Inventory: {productName}</DialogTitle>
      <DialogContent>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}
        
        <Box sx={{ mt: 2 }}>
          {fetchingWarehouses ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box component="form" noValidate sx={{ mt: 1 }}>
              <FormControl fullWidth margin="normal" error={!!errors.sourceWarehouse}>
                <InputLabel id="source-warehouse-label">Source Warehouse</InputLabel>
                <Select
                  labelId="source-warehouse-label"
                  value={sourceWarehouseId}
                  onChange={handleSourceWarehouseChange}
                  label="Source Warehouse"
                  disabled={loading}
                >                  {Array.isArray(warehouses) ? warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </MenuItem>
                  )) : (
                    <MenuItem value="">No warehouses available</MenuItem>
                  )}
                </Select>
                {errors.sourceWarehouse && <FormHelperText>{errors.sourceWarehouse}</FormHelperText>}
              </FormControl>

              {sourceQuantityAvailable !== null && (
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Available quantity: <strong>{sourceQuantityAvailable}</strong> units
                  </Typography>
                </Box>
              )}

              <FormControl fullWidth margin="normal" error={!!errors.destinationWarehouse}>
                <InputLabel id="destination-warehouse-label">Destination Warehouse</InputLabel>
                <Select
                  labelId="destination-warehouse-label"
                  value={destinationWarehouseId}
                  onChange={handleDestinationWarehouseChange}
                  label="Destination Warehouse"
                  disabled={loading}                >
                  {Array.isArray(warehouses) ? warehouses
                    .filter(w => w.id !== sourceWarehouseId)
                    .map((warehouse) => (
                      <MenuItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </MenuItem>
                    )) : (
                      <MenuItem value="">No warehouses available</MenuItem>
                    )
                  }
                </Select>
                {errors.destinationWarehouse && <FormHelperText>{errors.destinationWarehouse}</FormHelperText>}
              </FormControl>

              <TextField
                margin="normal"
                fullWidth
                label="Quantity to Transfer"
                type="number"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  if (errors.quantity) {
                    setErrors({ ...errors, quantity: '' });
                  }
                }}
                disabled={loading}
                error={!!errors.quantity}
                helperText={errors.quantity}
                inputProps={{ min: 1 }}
              />

              <TextField
                margin="normal"
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
              />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleTransfer} 
          variant="contained" 
          color="primary" 
          disabled={loading || fetchingWarehouses}
        >
          {loading ? <CircularProgress size={24} /> : 'Transfer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InventoryTransferModal;