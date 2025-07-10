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
  Select,  MenuItem,
  Box,
  Typography,
  FormHelperText,
  InputAdornment,
  CircularProgress,
  Tooltip,
  IconButton,
  Autocomplete
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { usePayment } from '../../hooks/usePayment';
import { useCustomer } from '../../hooks/useCustomer';
import { Customer } from '../../services/api/customerService';
import { PaymentMethod, CreatePaymentInput } from '../../services/api/paymentService';
import { format } from 'date-fns';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface CreatePaymentModalProps {
  open: boolean;
  onClose: () => void;
  onPaymentCreated: () => void;
}

const CreatePaymentModal: React.FC<CreatePaymentModalProps> = ({ open, onClose, onPaymentCreated }) => {
  const { createPayment, loading, error } = usePayment();
  const { searchCustomers } = useCustomer();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    // Form state
  const [formData, setFormData] = useState<Partial<CreatePaymentInput>>({
    order_id: '',
    user_id: '',
    amount: 0,
    currency: 'USD',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    payment_status: 'pending',
    payment_method: 'bank_transfer' as PaymentMethod,
    reference_number: '',
    metadata: undefined
  });

  // Reset form when modal is opened
  useEffect(() => {
    if (open) {
      setFormData({
        order_id: '',
        user_id: '',
        amount: 0,
        currency: 'USD',
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        payment_status: 'pending',
        payment_method: 'bank_transfer' as PaymentMethod,
        reference_number: '',
        metadata: undefined
      });
      setFormErrors({});
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({ ...prev, [name]: value }));
      // Clear error for this field when changed
      if (formErrors[name]) {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData(prev => ({ ...prev, payment_date: format(date, 'yyyy-MM-dd') }));
      // Clear date error if exists
      if (formErrors.payment_date) {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.payment_date;
          return newErrors;
        });
      }
    }
  };
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.user_id) {
      errors.user_id = 'User ID is required';
    }
    if (!formData.amount || formData.amount <= 0) {
      errors.amount = 'Amount must be greater than zero';
    }
    if (!formData.payment_date) {
      errors.payment_date = 'Payment date is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    const paymentData = formData as CreatePaymentInput;
    const result = await createPayment(paymentData);
    if (result) {
      onPaymentCreated();
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Payment</DialogTitle>
      <DialogContent>
        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>          <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
            <TextField
              label="User ID"
              name="user_id"
              value={formData.user_id || ''}
              onChange={handleChange}
              fullWidth
              required
              error={!!formErrors.user_id}
              helperText={formErrors.user_id}
            />
          </Box>
          
          <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
            <TextField
              label="Amount"
              name="amount"
              type="number"
              value={formData.amount || ''}
              onChange={handleChange}
              fullWidth
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              error={!!formErrors.amount}
              helperText={formErrors.amount}
            />
          </Box>
          
          <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Payment Date"
                value={formData.payment_date ? new Date(formData.payment_date) : null}
                onChange={handleDateChange}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    required: true,
                    error: !!formErrors.payment_date,
                    helperText: formErrors.payment_date
                  }
                }}
              />
            </LocalizationProvider>
          </Box>
          
          <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
            <FormControl fullWidth required>
              <InputLabel>Payment Method</InputLabel>
              <Select
                name="payment_method"
                value={formData.payment_method || ''}
                onChange={handleChange as any}
                label="Payment Method"
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="card">Card</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
            <TextField
              label="Order ID (Optional)"
              name="order_id"
              value={formData.order_id || ''}
              onChange={handleChange}
              fullWidth
            />
          </Box>
          
          <Box sx={{ width: '100%' }}>
            <TextField
              label="Reference Number (Optional)"
              name="reference_number"
              value={formData.reference_number || ''}
              onChange={handleChange}
              fullWidth
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'Creating...' : 'Create Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePaymentModal;
