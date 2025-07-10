import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  CircularProgress
} from '@mui/material';
import { usePayment } from '../../hooks/usePayment';
import { 
  Payment, 
  ReconciliationStatus,
  ReconcilePaymentRequest,
  ReconciliationStatusValues
} from '../../services/api/paymentService';

interface ReconcilePaymentModalProps {
  open: boolean;
  onClose: () => void;
  payment: Payment;
  onPaymentReconciled: () => void;
}

const ReconcilePaymentModal: React.FC<ReconcilePaymentModalProps> = ({
  open,
  onClose,
  payment,
  onPaymentReconciled
}) => {
  const { reconcilePayment, loading, error } = usePayment();
    const [formData, setFormData] = useState<ReconcilePaymentRequest>({
    reconciliationStatus: ReconciliationStatusValues.RECONCILED,
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev: ReconcilePaymentRequest) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    const result = await reconcilePayment(payment.id, formData);
    
    if (result) {
      onPaymentReconciled();
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reconcile Payment</DialogTitle>
      <DialogContent>
        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        <Typography variant="body1" gutterBottom>
          Reconcile payment <strong>{payment.id}</strong> for {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(payment.amount)}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Current status: {payment.reconciliation_status}
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Reconciliation Status</InputLabel>
          <Select
            name="reconciliationStatus"
            value={formData.reconciliationStatus}
            onChange={handleChange as any}
            label="Reconciliation Status"
          >
            <MenuItem value={ReconciliationStatusValues.RECONCILED}>Reconciled</MenuItem>
            <MenuItem value={ReconciliationStatusValues.UNRECONCILED}>Unreconciled</MenuItem>
            <MenuItem value={ReconciliationStatusValues.DISPUTED}>Disputed</MenuItem>
            <MenuItem value={ReconciliationStatusValues.PENDING}>Pending Review</MenuItem>
            <MenuItem value={ReconciliationStatusValues.PARTIAL}>Partial</MenuItem>
            <MenuItem value={ReconciliationStatusValues.FAILED}>Failed</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          label="Notes"
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          fullWidth
          multiline
          rows={3}
          placeholder="Add any notes about this reconciliation"
        />
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
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReconcilePaymentModal;
