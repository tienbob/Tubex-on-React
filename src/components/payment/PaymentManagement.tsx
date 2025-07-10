import React, { useEffect, useState } from 'react';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  TablePagination,
  useTheme as useMuiTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { usePayment } from '../../hooks/usePayment';
import { useCustomer } from '../../hooks/useCustomer';
import { Payment, ReconciliationStatus } from '../../services/api/paymentService';
import { Customer } from '../../services/api/customerService';
import CreatePaymentModal from './CreatePaymentModal';
import UpdatePaymentModal from './UpdatePaymentModal';
import ReconcilePaymentModal from './ReconcilePaymentModal';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import { useAccessControl } from '../../hooks/useAccessControl';
import RoleGuard from '../auth/RoleGuard';

const PaymentManagement: React.FC = () => {
  const { theme: whitelabelTheme } = useTheme();
  const { 
    loading, 
    error, 
    getPayments, 
    deletePayment 
  } = usePayment();
  const {
    getCustomersByIds,
    searchCustomers
  } = useCustomer();
  const { enqueueSnackbar } = useSnackbar();
  const { canPerform } = useAccessControl();

  // State variables
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerMap, setCustomerMap] = useState<Record<string, Customer>>({});
    // Filter states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Fetch payments on initial load and when filters change
  useEffect(() => {
    fetchPayments();
    // Initialize customer filter options
    if (Object.keys(customerMap).length === 0) {
      searchCustomers({ limit: 10 }).then(result => {
        // Updated: handle both array and object response
        const customersArr = Array.isArray(result) ? result : (result?.data || []);
        if (customersArr.length > 0) {
          const initialCustomers = customersArr.reduce((acc, customer) => {
            acc[customer.id] = customer;
            return acc;
          }, {} as Record<string, Customer>);
          setCustomerMap(prevMap => ({ ...prevMap, ...initialCustomers }));
        }
      });
    }
  }, [page, rowsPerPage, startDate, endDate, selectedPaymentMethod, selectedStatus, selectedCustomerId]);

  // Updated: use snake_case for all filters and handle array/object API response
  const fetchPayments = async () => {
    const filters: any = {
      page: page + 1, // API uses 1-based pagination
      limit: rowsPerPage
    };
    if (startDate) filters.start_date = format(startDate, 'yyyy-MM-dd');
    if (endDate) filters.end_date = format(endDate, 'yyyy-MM-dd');
    if (selectedPaymentMethod) filters.payment_method = selectedPaymentMethod;
    if (selectedStatus) filters.reconciliation_status = selectedStatus;
    if (selectedCustomerId) filters.customer_id = selectedCustomerId;
    if (selectedOrderId) filters.order_id = selectedOrderId;
    if (selectedInvoiceId) filters.invoice_id = selectedInvoiceId;

    const result = await getPayments(filters);
    const paymentsArr: Payment[] = Array.isArray(result) ? result : [];
    const total = paymentsArr.length;
    // Extract all unique customer IDs, filtering out undefined
    const customerIds = Array.from(new Set(paymentsArr.map(payment => payment.customer_id).filter((id): id is string => !!id)));
    if (customerIds.length > 0) {
      const customers = await getCustomersByIds(customerIds) || {};
      setCustomerMap(customers);
      // Enhance payments with customer data
      const enhancedPayments = paymentsArr.map(payment => ({
        ...payment,
        customer_name: payment.customer_id && customers[payment.customer_id]?.name
          ? customers[payment.customer_id].name
          : payment.customer_id
            ? `Customer ${payment.customer_id.substring(0, 8)}`
            : ''
      }));
      setPayments(enhancedPayments);
    } else {
      setPayments(paymentsArr);
    }
    setTotalItems(total);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    // Local filtering for the search term
    // Note: For better performance in larger datasets, consider API-based search
  };
  const handleCustomerSearch = async (searchTerm: string) => {
    setCustomerSearchTerm(searchTerm);
    if (searchTerm.length > 2) {
      const result = await searchCustomers({ search: searchTerm });
      if (result) {
        setCustomerOptions(result.data);
      }
    } else if (searchTerm.length === 0) {
      setCustomerOptions([]);
    }
  };

  const clearFilters = () => {
    setSelectedPaymentMethod('');
    setSelectedStatus('');
    setStartDate(null);
    setEndDate(null);
    setSelectedCustomerId('');
    setSelectedOrderId('');
    setSelectedInvoiceId('');
    setSearchTerm('');
    setCustomerSearchTerm('');
    setCustomerOptions([]);
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;
    
    const success = await deletePayment(selectedPayment.id);
    if (success) {
      enqueueSnackbar('Payment successfully deleted', { variant: 'success' });
      fetchPayments();
    } else {
      enqueueSnackbar('Failed to delete payment', { variant: 'error' });
    }
    
    setIsDeleteConfirmOpen(false);
    setSelectedPayment(null);
  };

  // Handle successful payment creation
  const handlePaymentCreated = () => {
    fetchPayments();
    setIsCreateModalOpen(false);
    enqueueSnackbar('Payment successfully created', { variant: 'success' });
  };

  // Handle successful payment update
  const handlePaymentUpdated = () => {
    fetchPayments();
    setIsUpdateModalOpen(false);
    setSelectedPayment(null);
    enqueueSnackbar('Payment successfully updated', { variant: 'success' });
  };

  // Handle successful payment reconciliation
  const handlePaymentReconciled = () => {
    fetchPayments();
    setIsReconcileModalOpen(false);
    setSelectedPayment(null);
    enqueueSnackbar('Payment successfully reconciled', { variant: 'success' });
  };

  const getStatusChipColor = (status: ReconciliationStatus) => {
    switch (status) {
      case 'reconciled':
        return 'success';
      case 'disputed':
        return 'error';
      case 'pending_review':
        return 'warning';
      case 'unreconciled':
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: whitelabelTheme.primaryColor }}>
        Payment Management
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'flex-start' }}>
        {/* Search field */}
        <TextField
          placeholder="Search payments..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ minWidth: '250px', flex: { xs: 1, md: 'initial' } }}
        />
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
          <Button
            startIcon={<FilterIcon />}
            variant="outlined"
            onClick={() => {}}
            sx={{ backgroundColor: 'background.paper' }}
          >
            Advanced Filters
          </Button>
          
          <Button
            startIcon={<RefreshIcon />}
            variant="outlined"
            onClick={fetchPayments}
            sx={{ backgroundColor: 'background.paper' }}
          >
            Refresh
          </Button>
            <RoleGuard action="payment:create" fallback={null}>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={() => setIsCreateModalOpen(true)}
              sx={{ backgroundColor: whitelabelTheme.primaryColor }}
            >
              New Payment
            </Button>
          </RoleGuard>
        </Box>
      </Box>

      {/* Filter panel */}
      <Paper sx={{ mb: 3, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Filters</Typography>
          <Button size="small" onClick={clearFilters}>Clear All</Button>
        </Box>        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ width: { xs: '100%', sm: '48%', md: '23%' } }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </LocalizationProvider>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: '48%', md: '23%' } }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </LocalizationProvider>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: '48%', md: '23%' } }}>
            <FormControl fullWidth size="small">
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={selectedPaymentMethod}
                label="Payment Method"
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="credit_card">Credit Card</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="check">Check</MenuItem>
                <MenuItem value="paypal">PayPal</MenuItem>
                <MenuItem value="stripe">Stripe</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: '48%', md: '23%' } }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Status"
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="unreconciled">Unreconciled</MenuItem>
                <MenuItem value="reconciled">Reconciled</MenuItem>
                <MenuItem value="disputed">Disputed</MenuItem>
                <MenuItem value="pending_review">Pending Review</MenuItem>
              </Select>
            </FormControl>
          </Box>          <Box sx={{ width: { xs: '100%', sm: '48%', md: '23%' } }}>
            <FormControl fullWidth size="small">
              <InputLabel>Customer</InputLabel>
              <Select
                value={selectedCustomerId}
                label="Customer"
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                renderValue={(selected) => {
                  if (!selected) return "All Customers";
                  return customerMap[selected]?.name || `Customer ${selected.substring(0, 8)}`;
                }}
              >
                <MenuItem value="">All Customers</MenuItem>
                {Object.values(customerMap).map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          {/* Additional filters row */}          <Box sx={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            <Box sx={{ width: { xs: '100%', sm: '48%', md: '31%' } }}>
              <TextField
                label="Order ID"
                size="small"
                fullWidth
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
              />
            </Box>
            <Box sx={{ width: { xs: '100%', sm: '48%', md: '31%' } }}>
              <TextField
                label="Invoice ID"
                size="small"
                fullWidth
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
              />
            </Box>
            <Box sx={{ width: { xs: '100%', sm: '48%', md: '31%' } }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={fetchPayments}
                  startIcon={<SearchIcon />}
                  fullWidth
                  sx={{ height: '40px' }}
                >
                  Apply Filters
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    clearFilters();
                    fetchPayments();
                  }}
                  startIcon={<RefreshIcon />}
                  sx={{ height: '40px', minWidth: '100px' }}
                >
                  Reset
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Payments table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 320px)' }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer Name</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">Loading...</TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ color: 'error.main' }}>
                    Error loading payments: {error}
                  </TableCell>
                </TableRow>              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">No payments found</TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>{payment.id}</TableCell>
                    <TableCell>{format(new Date(payment.payment_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{payment.customer_id || payment.customer_id}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      {payment.payment_type ? (
                        <Chip
                          label={payment.payment_type.replace('_', ' ')}
                          size="small"
                          color={payment.payment_type === 'refund' ? 'warning' : 'primary'}
                        />
                      ) : '-'}
                    </TableCell>
                    <TableCell>{payment.payment_method.replace('_', ' ')}</TableCell>
                    <TableCell>
                      {payment.order_id ? `Order: ${payment.order_id.substring(0, 8)}...` : ''}
                      {payment.invoice_id ? `Invoice: ${payment.invoice_id.substring(0, 8)}...` : ''}
                      {!payment.order_id && !payment.invoice_id ? '-' : ''}
                    </TableCell>
                    <TableCell>
                      {payment.reconciliation_status ? (
                        <Chip
                          label={payment.reconciliation_status.replace('_', ' ')}
                          size="small"
                          color={getStatusChipColor(payment.reconciliation_status as ReconciliationStatus) as any}
                        />
                      ) : '-'}
                    </TableCell>
                    <TableCell align="right">                      <Tooltip title="Edit payment">
                        <RoleGuard action="payment:edit" fallback={null}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsUpdateModalOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </RoleGuard>
                      </Tooltip>
                      <Tooltip title="Reconcile payment">
                        <RoleGuard action="payment:edit" fallback={null}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsReconcileModalOpen(true);
                            }}
                            disabled={payment.reconciliation_status === 'reconciled'}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </RoleGuard>
                      </Tooltip>
                      <Tooltip title="Delete payment">
                        <RoleGuard action="payment:delete" fallback={null}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsDeleteConfirmOpen(true);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </RoleGuard>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalItems}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Create Payment Modal */}
      <CreatePaymentModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPaymentCreated={handlePaymentCreated}
      />

      {/* Update Payment Modal */}
      {selectedPayment && (
        <UpdatePaymentModal
          open={isUpdateModalOpen}
          onClose={() => {
            setIsUpdateModalOpen(false);
            setSelectedPayment(null);
          }}
          payment={selectedPayment}
          onPaymentUpdated={handlePaymentUpdated}
        />
      )}

      {/* Reconcile Payment Modal */}
      {selectedPayment && (
        <ReconcilePaymentModal
          open={isReconcileModalOpen}
          onClose={() => {
            setIsReconcileModalOpen(false);
            setSelectedPayment(null);
          }}
          payment={selectedPayment}
          onPaymentReconciled={handlePaymentReconciled}
        />
      )}
    </Box>
  );
};

export default PaymentManagement;
