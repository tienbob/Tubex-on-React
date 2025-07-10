import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Box, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button,
  Typography,
  Divider,
  Tabs,
  Tab,
  IconButton,
  Stack,
  SelectChangeEvent,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import FormContainer from '../shared/FormContainer';
import FormButtons from '../shared/FormButtons';
import ProductPriceHistory from './ProductPriceHistory';
import DealerProductForm from './DealerProductForm';
import { productService, companyService, warehouseService, inventoryService } from '../../services/api';
import { productCategoryService, ProductCategory } from '../../services/api/productCategoryService';
import { useAccessControl } from '../../hooks/useAccessControl';
// Import commented out to avoid errors if NotificationProvider is not set up
// import { useNotificationContext } from '../../contexts/NotificationContext';

// Types
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  'aria-labelledby': string;
}

interface Supplier {
  id: string;
  name: string;
  type: 'supplier';
}

interface Warehouse {
  id: string;
  name: string;
  address?: string;
  type: 'main' | 'secondary' | 'distribution' | 'storage';
  status: 'active' | 'inactive' | 'under_maintenance';
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  supplierId: string;
  status: 'active' | 'inactive' | 'out_of_stock' | 'discontinued';
  inventory: {
    quantity: string;
    lowStockThreshold: string;
    warehouses: Array<{
      id?: string; // <-- allow id for inventory record
      warehouseId: string;
      quantity: string;
      minThreshold: string;
      maxThreshold: string;
      reorderPoint: string;
      reorderQuantity: string;
    }>;
  };
  computedFields?: {
    margin: number;
    marginPercentage: number;
  };
}

interface ProductFormProps {
  productId?: string;
  companyId: string;
  onSave?: (product: any) => void;
  onCancel?: () => void;
}

interface ProductApiInput {
  name: string;
  description: string;
  base_price: number;
  unit: string;
  supplier_id: string;
  category_id?: string;
  status?: 'active' | 'inactive' | 'out_of_stock';
  sku?: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  inventory?: {
    quantity?: number;
    lowStockThreshold?: number;
  };
  images?: string[];
  specifications?: Record<string, string>;
}

// Move FormSection and TabPanel above SupplierProductForm so they are defined before use
function TabPanel({ children, value, index, 'aria-labelledby': ariaLabelledBy, ...other }: TabPanelProps) {
  const isActive = value === index;
  
  return (
    <div
      role="tabpanel"
      hidden={!isActive}
      id={`product-tabpanel-${index}`}
      aria-labelledby={ariaLabelledBy}
      {...other}
    >
      {isActive && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface FormSectionProps {
  title: string;
  tooltip?: string;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({ title, tooltip, children }) => {
  return (
    <Box sx={{ 
      mb: 4, 
      p: 3, 
      border: '1px solid #e0e0e0', 
      borderRadius: 2,
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      backgroundColor: '#fafafa' 
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 2,
        pb: 1,
        borderBottom: '1px solid #eaeaea'
      }}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 500 }}>{title}</Typography>
        {tooltip && (
          <Tooltip title={tooltip} arrow>
            <IconButton size="small" sx={{ ml: 0.5 }}>
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box sx={{ mt: 2 }}>
        <Stack spacing={2}>
          {children}
        </Stack>
      </Box>
    </Box>
  );
}

const ProductForm: React.FC<ProductFormProps> = ({
  productId,
  companyId,
  onSave,
  onCancel,
}) => {
  const { user, permissions, loading: accessLoading } = useAccessControl();

  // Show loading while checking access control
  if (accessLoading) {
    return <div>Loading...</div>;
  }


  // We're now handling the supplier form only with the correct supplier-specific logic
  // This fixes the issue where suppliers couldn't create products properly
  return (
    <SupplierProductForm
      productId={productId}
      companyId={companyId}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
};

// Original supplier form logic as a separate component
const SupplierProductForm: React.FC<ProductFormProps> = ({
  productId,
  companyId,
  onSave,
  onCancel,
}) => {
  const { user, permissions, canPerform } = useAccessControl();
  // Comment out notification context to avoid errors if it's not properly provided
  // const { success, error } = useNotificationContext();
  const isEditMode = !!productId;
  const [tabValue, setTabValue] = useState(0);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  // Add state for category creation dialog
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [savingCategory, setSavingCategory] = useState(false);
  
  // Check if the current user is a supplier
  const isSupplier = user?.companyType === 'supplier';
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    // Auto-set supplierId to current company ID if the user is a supplier
    supplierId: isSupplier && user?.companyId ? user.companyId : '',
    status: 'active',
    inventory: {
      quantity: '',
      lowStockThreshold: '',
      warehouses: [],
    },
  });
    const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  // State for inventory summary
  const [inventorySummary, setInventorySummary] = useState<{ totalQuantity: number; globalLowStockThreshold: number | '' }>({ totalQuantity: 0, globalLowStockThreshold: '' });

  // Reset form state when productId changes to prevent stale inventory data
  useEffect(() => {
    setFormData({
      name: '',
      description: '',
      price: '',
      categoryId: '',
      supplierId: '',
      status: 'active',
      inventory: {
        quantity: '',
        lowStockThreshold: '',
        warehouses: [],
      },
    });
    setErrors({});
    setInventorySummary({ totalQuantity: 0, globalLowStockThreshold: '' });
  }, [productId]);

  // Fetch inventory summary from backend and filter by companyId and productId
  useEffect(() => {
    const fetchInventorySummary = async () => {
      try {
        const response = await inventoryService.getInventory({ companyId, product_id: productId });
        if (response && Array.isArray(response)) {
          // Filter by companyId and productId
          const warehouseInventories = response.filter((inv: any) =>
            inv.company_id === companyId && inv.product_id === productId
          );
          const totalQuantity = warehouseInventories.reduce((sum: number, w: any) => sum + (parseFloat(w.quantity) || 0), 0);
          const minThresholds = warehouseInventories.map((w: any) => parseFloat(w.min_threshold)).filter((v: number) => !isNaN(v));
          const globalLowStockThreshold = minThresholds.length > 0 ? Math.min(...minThresholds) : '';
          setInventorySummary({ totalQuantity, globalLowStockThreshold });
        } else {
          setInventorySummary({ totalQuantity: 0, globalLowStockThreshold: '' });
        }
      } catch (err) {
        setInventorySummary({ totalQuantity: 0, globalLowStockThreshold: '' });
      }
    };
    if (productId && tabValue === 1) {
      fetchInventorySummary();
    }
  }, [productId, companyId, tabValue]);

  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
    fetchWarehouses();
    
    if (productId) {
      fetchProductDetails();
    }
  }, [productId, companyId]);
    const fetchCategories = async () => {
    try {
      const response = await productCategoryService.getCategories();
      
      const categoriesList = response.data || [];

      
      setCategories(categoriesList);
    } catch (err: any) {
      console.error('SupplierProductForm - Error fetching categories:', err);
      console.error('SupplierProductForm - Error response:', err.response?.data);
    }
  };
  const fetchSuppliers = async () => {
    try {
      // If the user is a supplier, just get their own company info
      if (isSupplier && user?.companyId) {
        const companyResponse = await companyService.getCompanyById(user.companyId);
        if (companyResponse && companyResponse.company) {
          const company = companyResponse.company;
          
          // Set suppliers list with just the current user's company
          const suppliersList = [{
            id: company.id,
            name: company.name,
            company_type: company.company_type as 'supplier'
          }];
          
          const filteredSuppliers = suppliersList.map(supplier => ({
            id: supplier.id,
            name: supplier.name,
            type: supplier.company_type as 'supplier'
          }));
          
          setSuppliers(filteredSuppliers);
        }
      } else {
        // For other user types (dealers, admins), fetch all suppliers
        const response = await companyService.getSuppliers();
        
        const suppliersList = response || [];

        
        const filteredSuppliers = suppliersList
          .map(supplier => ({
            id: supplier.id,
            name: supplier.name,
            type: supplier.company_type as 'supplier'
          }));
          

        
        setSuppliers(filteredSuppliers);
      }
    } catch (err: any) {
      console.error('SupplierProductForm - Error fetching suppliers:', err);
      console.error('SupplierProductForm - Error response:', err.response?.data);
    }
  };  const fetchWarehouses = async () => {
    try {
      const response: any = await warehouseService.getWarehouses();
      let warehousesList: any[] = [];
      if (Array.isArray(response)) {
        warehousesList = response;
      } else if (response && response.data && Array.isArray(response.data.warehouses)) {
        warehousesList = response.data.warehouses;
      } else if (response && Array.isArray(response.data)) {
        warehousesList = response.data;
      } else if (response && response.warehouses && Array.isArray(response.warehouses)) {
        warehousesList = response.warehouses;
      } else {
        console.warn('Unexpected warehouses response structure:', response);
        warehousesList = [];
      }
      // Ensure 'type' property exists
      const activeWarehouses = warehousesList
        .filter((warehouse: any) => warehouse.status === 'active')
        .map((warehouse: any) => ({
          ...warehouse,
          type: warehouse.type || 'main',
        }));
      setWarehouses(activeWarehouses);
    } catch (err: any) {
      console.error('Error fetching warehouses:', err);
      setWarehouses([]);
    }
  };
    // Updated the fetchProductDetails function to align with the Product type from productService
  const fetchProductDetails = async () => {
    if (!productId) return;
    setFetchLoading(true);
    setApiError(null);
    try {
      const product = await productService.getProductById(productId);
      // Fetch inventory per warehouse for this product
      let warehouseInventories: Array<any> = [];
      try {
        const inventoryResponse = await inventoryService.getInventory({ companyId, product_id: productId });
        if (inventoryResponse && Array.isArray(inventoryResponse)) {
          const filteredInventories = inventoryResponse.filter((inv: any) => inv.product_id === productId);
          warehouseInventories = filteredInventories.map((inv: any) => ({
            id: inv.id,
            warehouseId: inv.warehouse_id,
            quantity: inv.quantity?.toString() || '',
            minThreshold: inv.min_threshold?.toString() || '',
            maxThreshold: inv.max_threshold?.toString() || '',
            reorderPoint: inv.reorder_point?.toString() || '',
            reorderQuantity: inv.reorder_quantity?.toString() || '',
          }));
        }
      } catch (err) {
        console.warn('Could not fetch warehouse inventory for product:', err);
      }
      const totalQuantity = warehouseInventories.reduce((sum, w) => sum + (parseFloat(w.quantity) || 0), 0);
      const minThresholds = warehouseInventories.map(w => parseFloat(w.minThreshold)).filter(v => !isNaN(v));
      const globalLowStockThreshold = minThresholds.length > 0 ? Math.min(...minThresholds) : '';
      
      // If user is a supplier, use their company ID, otherwise use the product's supplier_id
      const supplierId = isSupplier && user?.companyId 
        ? user.companyId 
        : (product.supplier_id != null ? String(product.supplier_id) : '');
        
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.base_price?.toString() || '',
        categoryId: product.category_id || '',
        supplierId,
        status: product.status || 'active',
        inventory: {
          quantity: totalQuantity.toString(),
          lowStockThreshold: globalLowStockThreshold !== '' ? globalLowStockThreshold.toString() : '',
          warehouses: warehouseInventories,
        },
      });
    } catch (err: any) {
      setApiError(err.message || 'Failed to load product details');
      console.error('Error fetching product:', err);
    } finally {
      setFetchLoading(false);
    }
  };  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    // Required fields according to ProductCreateInput in productService
    if (typeof formData.name === 'string' && !formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (typeof formData.categoryId === 'string' && !formData.categoryId.trim()) {
      newErrors.categoryId = 'Product category is required and cannot be empty';
    }
    if (typeof formData.price === 'string' && !formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      newErrors.price = 'Price must be a valid positive number';
    }
    
    // Only require supplier selection if user is not a supplier
    if (!isSupplier && typeof formData.supplierId === 'string' && !formData.supplierId.trim()) {
      newErrors.supplierId = 'Supplier is required';
    }
    
    // Removed cost validation
    if (typeof formData.inventory.quantity === 'string' && formData.inventory.quantity.trim() && (isNaN(parseInt(formData.inventory.quantity)) || parseInt(formData.inventory.quantity) < 0)) {
      newErrors.quantity = 'Quantity must be a valid non-negative integer';
    }
    if (typeof formData.inventory.lowStockThreshold === 'string' && formData.inventory.lowStockThreshold.trim() && (isNaN(parseInt(formData.inventory.lowStockThreshold)) || parseInt(formData.inventory.lowStockThreshold) < 0)) {
      newErrors.lowStockThreshold = 'Low stock threshold must be a valid non-negative integer';
    }
    // Check Reorder Point >= Min Threshold for each warehouse
    formData.inventory.warehouses.forEach((w, idx) => {
      const min = parseFloat(w.minThreshold);
      const reorder = parseFloat(w.reorderPoint);
      if (!isNaN(min) && !isNaN(reorder) && reorder < min) {
        newErrors[`warehouse_${idx}_reorderPoint`] = 'Reorder Point must be greater than or equal to Min Threshold';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (!name) return;
    
    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(typeof prev[parent as keyof typeof prev] === 'object' && prev[parent as keyof typeof prev] !== null
            ? (prev[parent as keyof typeof prev] as Record<string, unknown>)
            : {}),
          [child]: value
        }
      }));
    } else {      setFormData((prev) => {
        const newData = {
          ...prev,
          [name]: value
        };
        // Remove margin recalculation since cost is removed
        return newData;
      });
    }
    
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
    // Real-time validation
    if (name === 'name' || name === 'categoryId' || name === 'price' || name === 'quantity' || name === 'lowStockThreshold') {
      validateField(name, value as string);
    }
  };
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name = e.target.name, value } = e.target;
    
    // Check if "Create New Category" was selected
    if (name === 'categoryId' && value === 'new') {
      // Open the create category dialog
      setOpenCategoryDialog(true);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Real-time validation
    if (name === 'categoryId') validateField(name, value as string);
    // Clear error if it exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleStatusChange = (e: SelectChangeEvent<string>) => {
    setFormData(prev => ({
      ...prev,
      status: e.target.value as 'active' | 'inactive' | 'out_of_stock' | 'discontinued'
    }));
    // Clear error if it exists
    if (errors.status) {
      setErrors(prev => ({ ...prev, status: '' }));
    }
  };

  const addWarehouseInventory = () => {
    setFormData((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        warehouses: [
          ...prev.inventory.warehouses,
          {
            warehouseId: '',
            quantity: '',
            minThreshold: '',
            maxThreshold: '',
            reorderPoint: '',
            reorderQuantity: '',
          }
        ]
      }
    }));
  };

  const removeWarehouseInventory = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        warehouses: prev.inventory.warehouses.filter((_, i) => i !== index)
      }
    }));
  };

  const updateWarehouseInventory = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        warehouses: prev.inventory.warehouses.map((warehouse, i) => 
          i === index ? { ...warehouse, [field]: value } : warehouse
        )
      }
    }));
    // Real-time validation for warehouse fields
    validateField(`warehouse_${field}`, value, index);
    if (field === 'reorderPoint') {
      // Also validate minThreshold for reorderPoint logic
      const minValue = formData.inventory.warehouses[index].minThreshold;
      validateField('warehouse_minThreshold', minValue, index);
    }
  };  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setApiError(null);
    try {
      // If user is a supplier, always use their company ID as the supplier_id
      const supplier_id = isSupplier && user?.companyId 
        ? user.companyId 
        : (formData.supplierId || '');

      const productData: ProductApiInput = {
        name: formData.name,
        description: formData.description,
        base_price: parseFloat(formData.price),
        category_id: formData.categoryId, // Required field, no fallback to undefined
        supplier_id,
        status: formData.status === 'discontinued' ? 'inactive' : formData.status,
        unit: 'piece',
      };
      if (!isEditMode && (formData.inventory.quantity || formData.inventory.lowStockThreshold)) {
        productData.inventory = {};
        if (formData.inventory.quantity) {
          productData.inventory.quantity = parseInt(formData.inventory.quantity);
        }
        if (formData.inventory.lowStockThreshold) {
          productData.inventory.lowStockThreshold = parseInt(formData.inventory.lowStockThreshold);
        }
      }
      let savedProduct;
      if (isEditMode && productId) {
        savedProduct = await productService.updateProduct(productId, productData);
      } else {
        savedProduct = await productService.createProduct(productData);
      }
      if (onSave) {
        onSave(savedProduct);
      }
      const product_id = (savedProduct && savedProduct.id) ? savedProduct.id : productId;

      // --- JOIN TABLE LOGIC FOR INVENTORY/Warehouse ---
      // 1. Create or update the inventory record (one per product/company)
      let inventoryRecord = null;
      // Try to find existing inventory for this product/company
      const allInventories = await inventoryService.getInventory({ product_id: product_id, company_id: companyId });
      if (allInventories && allInventories.length > 0) {
        inventoryRecord = allInventories[0];
      } else {
        // Create inventory if not found
        inventoryRecord = await inventoryService.createInventory({
          product_id: product_id || '',
          company_id: companyId,
          quantity: 0, // Will be distributed to warehouses
          unit: 'piece',
        });
      }
      // 2. For each warehouse assignment, create or update the join table
      if (formData.inventory.warehouses.length > 0 && inventoryRecord && inventoryRecord.id) {
        for (const warehouseInventory of formData.inventory.warehouses) {
          if (!warehouseInventory || typeof warehouseInventory !== 'object') continue;
          if (warehouseInventory.warehouseId && warehouseInventory.quantity) {
            await inventoryService.addInventoryToWarehouse(
              inventoryRecord.id,
              warehouseInventory.warehouseId,
              parseFloat(warehouseInventory.quantity)
            );
          }
        }
      }
    } catch (err: any) {
      setApiError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} product`);
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} product:`, err);
    } finally {
      setLoading(false);
    }
  };
    // Fix: Wrap all TabPanels in a single parent element and move renderBasicInfoTab inside SupplierProductForm
  const renderBasicInfoTab = () => (
    <Box>
      <FormSection title="Basic Information">
        <TextField
          name="name"
          label="Product Name"
          fullWidth
          value={formData.name}
          onChange={handleChange}
          error={!!errors.name}
          helperText={errors.name || "Enter the product's full name"}
          InputProps={{
            startAdornment: (
              <Tooltip title="Enter a clear, descriptive name for your product that will be visible to customers">
                <HelpOutlineIcon color="action" sx={{ mr: 1 }} />
              </Tooltip>
            ),
          }}
        />
        <TextField
          name="description"
          label="Description"
          fullWidth
          multiline
          rows={4}
          value={formData.description}
          onChange={handleChange}
          error={!!errors.description}
          helperText={errors.description || "Provide a detailed description of your product"}
          InputProps={{
            startAdornment: (
              <Tooltip title="Include key features, specifications, and benefits">
                <HelpOutlineIcon color="action" sx={{ mr: 1 }} />
              </Tooltip>
            ),
          }}
        />
        <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
          <FormControl fullWidth required error={!!errors.categoryId}>
            <InputLabel>Category *</InputLabel>
            <Select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleSelectChange}
              disabled={loading}
              label="Category *"
              error={!!errors.categoryId}
            >
              <MenuItem value="" disabled>Select a category</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
              <MenuItem value="new" divider sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                + Create New Category
              </MenuItem>
            </Select>
            {errors.categoryId ? (
              <FormHelperText error>{errors.categoryId}</FormHelperText>
            ) : (
              <FormHelperText>Select the product category</FormHelperText>
            )}
          </FormControl>
          
          <TextField
            name="price"
            label="Price"
            fullWidth
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            value={formData.price}
            onChange={handleChange}
            error={!!errors.price}
            helperText={errors.price || "Enter the selling price"}
            InputProps={{
              startAdornment: (
                <Tooltip title="The price that will be shown to customers">
                  <HelpOutlineIcon color="action" sx={{ mr: 1 }} />
                </Tooltip>
              ),
            }}
          />
        </Box>
        
        {/* Only show supplier dropdown if user is not a supplier */}
        {!isSupplier ? (
          <FormControl fullWidth required error={!!errors.supplierId}>
            <InputLabel>Supplier</InputLabel>
            <Select
              name="supplierId"
              value={formData.supplierId}
              onChange={handleSelectChange}
              disabled={loading}
              label="Supplier"
            >
              <MenuItem value="" disabled>Select a supplier</MenuItem>
              {suppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </MenuItem>
              ))}
            </Select>
            {errors.supplierId ? (
              <FormHelperText error>{errors.supplierId}</FormHelperText>
            ) : (
              <FormHelperText>Select the product supplier</FormHelperText>
            )}
          </FormControl>
        ) : (
          // If user is a supplier, show a read-only field with their company name
          suppliers.length > 0 && formData.supplierId && (
            <TextField
              label="Supplier"
              fullWidth
              value={suppliers.find(s => s.id === formData.supplierId)?.name || 'Your Company'}
              disabled
              InputProps={{
                readOnly: true,
              }}
              helperText="This product will be created under your supplier account"
            />
          )
        )}
        
        <FormControl fullWidth required error={!!errors.status}>
          <InputLabel>Status</InputLabel>
          <Select
            name="status"
            value={formData.status}
            onChange={handleStatusChange}
            disabled={loading}
            label="Status"
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="out_of_stock">Out of Stock</MenuItem>
            <MenuItem value="discontinued">Discontinued</MenuItem>
          </Select>
          {errors.status ? (
            <FormHelperText error>{errors.status}</FormHelperText>
          ) : (
            <FormHelperText>Current product availability status</FormHelperText>
          )}
        </FormControl>
      </FormSection>
    </Box>
  );
  // Add missing validateField and handleTabChange inside SupplierProductForm
  const validateField = (name: string, value: string | unknown, index?: number) => {
    let error = '';
    const stringValue = typeof value === 'string' ? value : String(value);
    
    if (name === 'name' && !stringValue.trim()) error = 'Product name is required';
    if (name === 'categoryId' && !stringValue.trim() && stringValue !== 'new') error = 'Product category is required and cannot be empty';
    if (name === 'price') {
      if (!stringValue.trim()) error = 'Price is required';
      else if (isNaN(parseFloat(stringValue)) || parseFloat(stringValue) < 0) error = 'Price must be a valid positive number';
    }
    if (name === 'quantity') {
      if (stringValue.trim() && (isNaN(parseInt(stringValue)) || parseInt(stringValue) < 0)) error = 'Quantity must be a valid non-negative integer';
    }
    if (name === 'lowStockThreshold') {
      if (stringValue.trim() && (isNaN(parseInt(stringValue)) || parseInt(stringValue) < 0)) error = 'Low stock threshold must be a valid non-negative integer';
    }
    // Warehouse fields
    if (name.startsWith('warehouse_') && typeof index === 'number') {
      const [field] = name.split('_').slice(1);
      if (["quantity", "minThreshold", "maxThreshold", "reorderPoint", "reorderQuantity"].includes(field)) {
        if (stringValue && (isNaN(parseFloat(stringValue)) || parseFloat(stringValue) < 0)) error = 'Must be a valid non-negative number';
      }
      // Reorder Point >= Min Threshold
      if (field === 'reorderPoint') {
        const min = parseFloat(formData.inventory.warehouses[index].minThreshold);
        const reorder = parseFloat(stringValue);
        if (!isNaN(min) && !isNaN(reorder) && reorder < min) error = 'Reorder Point must be >= Min Threshold';
      }
    }
    if (error) {
      setErrors(prev => ({ ...prev, [name + (typeof index === 'number' ? `_${index}` : '')]: error }));
    } else {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[name + (typeof index === 'number' ? `_${index}` : '')];
        return newErrs;
      });
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Add category creation handlers
  const handleCategoryDialogClose = () => {
    setOpenCategoryDialog(false);
    // Reset the new category form
    setNewCategory({ name: '', description: '' });
  };

  const handleNewCategoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    if (id === 'categoryName') {
      setNewCategory(prev => ({
        ...prev,
        name: value
      }));
    } else if (id === 'categoryDescription') {
      setNewCategory(prev => ({
        ...prev,
        description: value
      }));
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      return; // Don't create empty categories
    }
    
    setSavingCategory(true);
    
    try {
      // Create the new category
      const result = await productCategoryService.createCategory({
        name: newCategory.name.trim(),
        description: newCategory.description.trim() || undefined
      });
      
      console.log('New category created:', result);
      
      // Add the new category to the list
      setCategories(prevCategories => [...prevCategories, result.data]);
      
      // Set the new category as selected
      setFormData(prevData => ({
        ...prevData,
        categoryId: result.data.id
      }));
      
      // Close the dialog
      handleCategoryDialogClose();
      
      // Show success message using alert instead of notification context
      alert('Category created successfully');
    } catch (err: any) {
      console.error('Error creating category:', err);
      alert('Failed to create category: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingCategory(false);
    }
  };

  return (
    <FormContainer 
      title={isEditMode ? 'Edit Product' : 'Add New Product'}
      loading={fetchLoading}
      error={apiError}
      maxWidth="900px"
    >
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="product form tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              label="Basic Info" 
              id="product-tab-0" 
              aria-controls="product-tabpanel-0"
            />            <Tab 
              label="Inventory" 
              id="product-tab-1" 
              aria-controls="product-tabpanel-1"
            />
            {isEditMode && (
              <Tab 
                label="Price History" 
                id="product-tab-2" 
                aria-controls="product-tabpanel-2"
              />
            )}
          </Tabs>
        </Box>
        {/* Wrap all TabPanels in a single parent */}
        <React.Fragment>
          <TabPanel 
            value={tabValue} 
            index={0}
            aria-labelledby="product-tab-0"
          >
            {renderBasicInfoTab()}
          </TabPanel>
          {/* Inventory Tab */}
          <TabPanel value={tabValue} index={1} aria-labelledby="product-tab-1">
            {fetchLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <Typography variant="body1" color="text.secondary">Loading inventory...</Typography>
              </Box>
            ) : (
              <Stack spacing={3}>
                <FormSection title="General Inventory Settings">
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      name="inventory.quantity"
                      label="Total Stock (All Warehouses)"
                      fullWidth
                      type="number"
                      inputProps={{ min: 0, step: 1, readOnly: true }}
                      value={inventorySummary.totalQuantity}
                      onChange={() => {}}
                      helperText={"This is fetched from the inventory database (sum of all warehouses)"}
                      disabled={true}
                    />
                    <TextField
                      name="inventory.lowStockThreshold"
                      label="Global Low Stock Threshold"
                      fullWidth
                      type="number"
                      inputProps={{ min: 0, step: 1, readOnly: true }}
                      value={inventorySummary.globalLowStockThreshold}
                      onChange={() => {}}
                      helperText={'Send alert when total stock falls below this level (min threshold across all warehouses)'
}
                      disabled={true}
                    />
                  </Stack>
                </FormSection>
                <FormSection title="Warehouse Distribution">
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">Stock Distribution by Warehouse</Typography>
                    <Button 
                      variant="outlined" 
                      onClick={addWarehouseInventory}
                      disabled={loading || warehouses.length === 0}
                    >
                      Add Warehouse Stock
                    </Button>
                  </Box>
                  
                  {warehouses.length === 0 && (
                    <Typography color="text.secondary" sx={{ my: 2, textAlign: 'center' }}>
                      No warehouses available. Create a warehouse first to manage inventory distribution.
                    </Typography>
                  )}
                  
                  {formData.inventory.warehouses.length === 0 && warehouses.length > 0 && (
                    <Typography color="text.secondary" sx={{ my: 2, textAlign: 'center' }}>
                      No warehouse stock entries yet. Click "Add Warehouse Stock" to distribute inventory across warehouses.
                    </Typography>
                  )}
                  
                  {formData.inventory.warehouses.map((warehouseInventory, index) => (
                    <Box key={index} sx={{ border: '1px solid #ddd', borderRadius: 1, p: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2">
                          {(() => {
                            const warehouse = warehouses.find(w => w.id === warehouseInventory.warehouseId);
                            return warehouse ? warehouse.name : `Warehouse ${index + 1}`;
                          })()}
                        </Typography>
                        <IconButton 
                          onClick={() => removeWarehouseInventory(index)}
                          color="error"
                          disabled={loading}
                          size="small"
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Box>
                      
                      <Stack spacing={2}>
                        <FormControl fullWidth required error={!!errors[`warehouse_warehouseId_${index}`]}>
                          <InputLabel>Warehouse</InputLabel>
                          <Select
                            value={warehouseInventory.warehouseId || ''}
                            onChange={(e) => updateWarehouseInventory(index, 'warehouseId', e.target.value)}
                            disabled={loading}
                            label="Warehouse"
                          >
                            <MenuItem value="" disabled>Select a warehouse</MenuItem>
                            {warehouses.map((warehouse) => (
                              <MenuItem key={warehouse.id} value={warehouse.id}>
                                {warehouse.name} ({warehouse.type})
                              </MenuItem>
                            ))}
                          </Select>
                          {errors[`warehouse_warehouseId_${index}`] && <FormHelperText>{errors[`warehouse_warehouseId_${index}`]}</FormHelperText>}
                        </FormControl>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                          <TextField
                            label="Quantity in Warehouse"
                            type="number"
                            inputProps={{ min: 0, step: 1 }}
                            value={warehouseInventory.quantity}
                            onChange={(e) => updateWarehouseInventory(index, 'quantity', e.target.value)}
                            disabled={loading}
                            fullWidth
                            error={!!errors[`warehouse_quantity_${index}`]}
                            helperText={errors[`warehouse_quantity_${index}`]}
                          />
                          <TextField
                            label="Min Threshold"
                            type="number"
                            inputProps={{ min: 0, step: 1 }}
                            value={warehouseInventory.minThreshold}
                            onChange={(e) => updateWarehouseInventory(index, 'minThreshold', e.target.value)}
                            disabled={loading}
                            fullWidth
                            error={!!errors[`warehouse_minThreshold_${index}`]}
                            helperText={errors[`warehouse_minThreshold_${index}`]}
                          />
                          <TextField
                            label="Max Threshold"
                            type="number"
                            inputProps={{ min: 0, step: 1 }}
                            value={warehouseInventory.maxThreshold}
                            onChange={(e) => updateWarehouseInventory(index, 'maxThreshold', e.target.value)}
                            disabled={loading}
                            fullWidth
                            error={!!errors[`warehouse_maxThreshold_${index}`]}
                            helperText={errors[`warehouse_maxThreshold_${index}`]}
                          />
                        </Stack>
                        
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                          <TextField
                            label="Reorder Point"
                            type="number"
                            inputProps={{ min: 0, step: 1 }}
                            value={warehouseInventory.reorderPoint}
                            onChange={(e) => updateWarehouseInventory(index, 'reorderPoint', e.target.value)}
                            disabled={loading}
                            fullWidth
                            error={!!errors[`warehouse_reorderPoint_${index}`]}
                            helperText={errors[`warehouse_reorderPoint_${index}`] || 'Auto-reorder when stock hits this level'}
                          />
                          <TextField
                            label="Reorder Quantity"
                            type="number"
                            inputProps={{ min: 0, step: 1 }}
                            value={warehouseInventory.reorderQuantity}
                            onChange={(e) => updateWarehouseInventory(index, 'reorderQuantity', e.target.value)}
                            disabled={loading}
                            fullWidth
                            error={!!errors[`warehouse_reorderQuantity_${index}`]}
                            helperText={errors[`warehouse_reorderQuantity_${index}`] || 'Quantity to order when reordering'}
                          />
                        </Stack>
                      </Stack>
                    </Box>              
                  ))}
                </FormSection>
              </Stack>
            )}
          </TabPanel>
            {/* Price History Tab - Only shown in edit mode */}
            {isEditMode && (
            <TabPanel value={tabValue} index={2} aria-labelledby="product-tab-2">
              <ProductPriceHistory 
                productId={productId!}
                productName={formData.name}
                currentPrice={parseFloat(formData.price)}
                canUpdate={true}
                onPriceUpdated={() => {
                  fetchProductDetails(); // Refresh product details after price update
                }}
              />
            </TabPanel>
          )}
        </React.Fragment>
      </Box>
      <Box sx={{ mt: 4 }}>
        <FormButtons
          onCancel={onCancel}
          onSubmit={handleSubmit}
          loading={loading}
          submitText={isEditMode ? 'Update Product' : 'Create Product'}
          canSubmit={isEditMode ? canPerform('product:edit') : canPerform('product:create')}
          submitDisabledReason={
            isEditMode 
              ? !canPerform('product:edit') ? 'You do not have permission to edit products' : undefined
              : !canPerform('product:create') ? 'You do not have permission to create products' : undefined
          }
        />
      </Box>

      {/* Category Creation Dialog */}
      <Dialog
        open={openCategoryDialog}
        onClose={handleCategoryDialogClose}
        aria-labelledby="create-category-dialog-title"
        aria-describedby="create-category-dialog-description"
      >
        <DialogTitle id="create-category-dialog-title">Create New Category</DialogTitle>
        <DialogContent>
          <DialogContentText id="create-category-dialog-description">
            Enter the details for the new category. This will be available for selection in the category dropdown.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="categoryName"
            label="Category Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newCategory.name}
            onChange={handleNewCategoryChange}
            error={!!errors.categoryId}
            helperText={errors.categoryId}
          />
          <TextField
            margin="dense"
            id="categoryDescription"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            value={newCategory.description}
            onChange={handleNewCategoryChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCategoryDialogClose} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleCreateCategory} 
            color="primary" 
            disabled={savingCategory}
          >
            {savingCategory ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </FormContainer>
  );
};

export default ProductForm;

// New component for form section with tooltip support