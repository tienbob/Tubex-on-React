import React, { useState, useEffect } from 'react';
import {  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { usePayment } from '../../hooks/usePayment';
import { 
  Payment, 
  UpdatePaymentInput 
} from '../../services/api/paymentService';
import { format } from 'date-fns';

interface UpdatePaymentModalProps {
  open: boolean;
  onClose: () => void;
  payment: Payment;
  onPaymentUpdated: () => void;
}

const UpdatePaymentModal: React.FC<UpdatePaymentModalProps> = ({ 
  open, 
  onClose, 
  payment, 
  onPaymentUpdated 
}) => {
  const { updatePayment, loading, error } = usePayment();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Form state
  const [formData, setFormData] = useState<Partial<UpdatePaymentInput>>({
    amount: payment.amount,
    payment_method: payment.payment_method,
    payment_date: format(new Date(payment.payment_date), 'yyyy-MM-dd'),
    reference_number: payment.reference_number,
    currency: payment.currency,
    payment_status: payment.payment_status,
    // Only include fields that exist in UpdatePaymentInput
  });

  // Update form data when payment changes
  useEffect(() => {
    if (payment && open) {
      setFormData({
        amount: payment.amount,
        payment_method: payment.payment_method,
        payment_date: format(new Date(payment.payment_date), 'yyyy-MM-dd'),
        reference_number: payment.reference_number,
        currency: payment.currency,
        payment_status: payment.payment_status,
      });
      setFormErrors({});
    }
  }, [payment, open]);

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
    
    // Transaction ID is payment.id, not editable
    
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
    // Convert formData to snake_case for backend
    const updateData: UpdatePaymentInput = { ...formData } as UpdatePaymentInput;
    const result = await updatePayment(payment.id, updateData);
    if (result) {
      onPaymentUpdated();
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>Update Payment</DialogTitle>
      <DialogContent>
        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
          <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
            <TextField
              label="Transaction ID"
              name="id"
              value={payment.id}
              fullWidth
              required
              InputProps={{ readOnly: true }}
              helperText="This is the unique payment ID."
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
          
          {/* Remove Payment Type, Order ID, Invoice ID, and Notes fields as they are not part of UpdatePaymentInput */}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ mr: 'auto', color: 'text.secondary' }}>
          Payment ID: {payment.id}
        </Typography>
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
          {loading ? 'Updating...' : 'Update Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdatePaymentModal;
