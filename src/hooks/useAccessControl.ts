import { useAuth } from '../components/auth/AuthContext';
import { getUserPermissions, hasPermission, User, AccessPermissions } from '../utils/accessControl';
import { useState, useEffect } from 'react';
import { companyService } from '../services/api';

interface UseAccessControlResult {
  permissions: AccessPermissions;
  hasPermission: (permission: keyof AccessPermissions) => boolean;
  canAccess: (page: string) => boolean;
  canPerform: (action: string, context?: any) => boolean;
  user: User | null;
  loading: boolean;
}

export const useAccessControl = (): UseAccessControlResult => {
  const { user: authUser, isAuthenticated } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserWithCompanyType = async () => {
      if (!authUser || !isAuthenticated) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        // Fetch company information to get company type
        if (!authUser.companyId) {
          console.error('No companyId found in authUser:', authUser);
          setUser(null);
          setLoading(false);
          return;
        }
        console.log('Fetching company info for ID:', authUser.companyId);
        const companyResponse = await companyService.getCompanyById(authUser.companyId);
        const companyObj = companyResponse.company;
        console.log('Company fetched:', companyObj);

        const fullUser: User = {
          userId: authUser.userId,
          role: authUser.role, // Backend now sends frontend-friendly roles directly
          companyId: authUser.companyId,
          companyType: companyObj?.company_type
        };

        console.log('Full user created:', fullUser);
        setUser(fullUser);
      } catch (error) {
        console.error('Error fetching company type for companyId', authUser.companyId, error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserWithCompanyType();
  }, [authUser, isAuthenticated]);
  
  const permissions = user ? getUserPermissions(user) : {} as AccessPermissions;
  
  const checkPermission = (permission: keyof AccessPermissions): boolean => {
    return user ? hasPermission(user, permission) : false;
  };
    const canAccess = (page: string): boolean => {
    if (!user) return false;
    // Defensive: permissions may be empty or missing keys
    if (!permissions || typeof permissions[pageToPermissionKey(page)] === 'undefined') return false;
    switch (page) {
      case '/dashboard':
        return !!permissions.dashboard;
      case '/analytics':
        return !!permissions.analytics;
      case '/products':
        return !!permissions.productView;
      case '/inventory':
        return !!permissions.inventoryView;
      case '/warehouses':
        return !!permissions.warehouseView;
      case '/orders':
        return !!permissions.orderView;
      case '/quotes':
        return !!permissions.quoteView;
      case '/invoices':
        return !!permissions.invoiceView;
      case '/payments':
        return !!permissions.paymentView;
      case '/users':
        return !!permissions.userView;
      case '/price-lists':
        return !!permissions.priceListView;
      case '/reports':
        return !!permissions.reportView;
      case '/settings':
        return !!permissions.settingsView;
      case '/profile':
        return true; // All authenticated users should have access to their own profile
      default:
        return false;
    }
  };

  // Helper to map page to permission key for defensive check
  function pageToPermissionKey(page: string): keyof AccessPermissions {
    switch (page) {
      case '/dashboard': return 'dashboard';
      case '/analytics': return 'analytics';
      case '/products': return 'productView';
      case '/inventory': return 'inventoryView';
      case '/warehouses': return 'warehouseView';
      case '/orders': return 'orderView';
      case '/quotes': return 'quoteView';
      case '/invoices': return 'invoiceView';
      case '/payments': return 'paymentView';
      case '/users': return 'userView';
      case '/price-lists': return 'priceListView';
      case '/reports': return 'reportView';
      case '/settings': return 'settingsView';
      default: return '' as keyof AccessPermissions;
    }
  }
    const canPerform = (action: string, context?: any): boolean => {
    if (!user) {
      console.log('canPerform: No user found');
      return false;
    }
    
    console.log('canPerform called with:', { action, user, permissions });
    
    switch (action) {// Product actions
      case 'product:create':
      case 'productCreate':
        return permissions.productCreate;
      case 'product:edit':
      case 'productEdit':
        return permissions.productEdit;
      case 'product:delete':
      case 'productDelete':
        return permissions.productDelete;
      case 'product:view':
      case 'productView':
        return permissions.productView;
      
      // Inventory actions
      case 'inventory:create':
      case 'inventoryCreate':
        return permissions.inventoryCreate;
      case 'inventory:edit':
      case 'inventoryEdit':
        return permissions.inventoryEdit;
      case 'inventory:delete':
      case 'inventoryDelete':
        return permissions.inventoryDelete;
      case 'inventory:view':
      case 'inventoryView':
        return permissions.inventoryView;
        // Order actions
      case 'order:create':
      case 'orderCreate':
        return permissions.orderCreate;
      case 'order:edit':
      case 'orderEdit':
        return permissions.orderEdit;
      case 'order:delete':
      case 'orderDelete':
        return permissions.orderDelete;
      case 'order:view':
      case 'orderView':
        return permissions.orderView;
      
      // User actions
      case 'user:create':
        return permissions.userCreate;
      case 'user:edit':
        return permissions.userEdit;
      case 'user:delete':
        return permissions.userDelete;
      case 'user:view':
        return permissions.userView;
        // Warehouse actions
      case 'warehouse:create':
      case 'warehouseCreate':
        return permissions.warehouseCreate;
      case 'warehouse:edit':
      case 'warehouseEdit':
        return permissions.warehouseEdit;
      case 'warehouse:delete':
      case 'warehouseDelete':
        return permissions.warehouseDelete;
      case 'warehouse:view':
      case 'warehouseView':
        return permissions.warehouseView;
      
      // Invoice actions
      case 'invoice:create':
        return permissions.invoiceCreate;
      case 'invoice:edit':
        return permissions.invoiceEdit;
      case 'invoice:delete':
        return permissions.invoiceDelete;
      case 'invoice:view':
        return permissions.invoiceView;
      
      // Quote actions
      case 'quote:create':
        return permissions.quoteCreate;
      case 'quote:edit':
        return permissions.quoteEdit;
      case 'quote:delete':
        return permissions.quoteDelete;
      case 'quote:view':
        return permissions.quoteView;
      
      // Price list actions
      case 'price-list:create':
        return permissions.priceListCreate;
      case 'price-list:edit':
        return permissions.priceListEdit;
      case 'price-list:delete':
        return permissions.priceListDelete;
      case 'price-list:view':
        return permissions.priceListView;
      
      // Report actions
      case 'report:view':
        return permissions.reportView;
      case 'report:export':
        return permissions.reportView; // Assuming export is included in view
      
      // Settings actions
      case 'settings:view':
        return permissions.settingsView;
      case 'settings:edit':
        return permissions.settingsView; // Assuming edit is included in view
      
      default:
        return false;
    }
  };
  
  return {
    permissions,
    hasPermission: checkPermission,
    canAccess,
    canPerform,
    user,
    loading
  };
};
