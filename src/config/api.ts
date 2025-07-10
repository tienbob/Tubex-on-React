/**
 * API configuration file
 * Contains all API endpoints and configuration settings
 */

// Base API URL from environment variable or default
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// API endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh_token',
    VERIFY_EMAIL: '/auth/verify_email',
    FORGOT_PASSWORD: '/auth/forgot_password',
    RESET_PASSWORD: '/auth/reset_password',
  },
  USER: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
  },
  PRODUCTS: {
    BASE: '/products',
    DETAILS: (id: string) => `/products/${id}`,
  },
  ORDERS: {
    BASE: '/orders',
    DETAILS: (id: string) => `/orders/${id}`,
  },
  PAYMENTS: {
    BASE: '/payments',
    DETAILS: (id: string) => `/payments/${id}`,
  },
  WAREHOUSES: {
    BASE: '/warehouses',
    DETAILS: (id: string) => `/warehouses/${id}`,
  },
  COMPANIES: {
    BASE: '/companies',
    DETAILS: (id: string) => `/companies/${id}`,
  },
  BATCHES: {
    BASE: '/batches',
    DETAILS: (id: string) => `/batches/${id}`,
  },
  INVITATIONS: {
    BASE: '/invitations',
    DETAILS: (id: string) => `/invitations/${id}`,
  },
  INVENTORY: {
    BASE: '/inventory',
    BY_COMPANY: (companyId: string) => `/inventory?company_id=${companyId}`,
    LOW_STOCK: (companyId: string) => `/inventory?company_id=${companyId}&low_stock=true`,
    DETAILS: (id: string) => `/inventory/${id}`,
  },
  USER_AUDIT_LOGS: {
    BASE: '/user_audit_logs',
    DETAILS: (id: string) => `/user_audit_logs/${id}`,
  },
  ORDER_ITEMS: {
    BASE: '/order_items',
    DETAILS: (id: string) => `/order_items/${id}`,
  },
  PAYMENT_HISTORIES: {
    BASE: '/payment_histories',
    DETAILS: (id: string) => `/payment_histories/${id}`,
  },
  INVOICES: {
    BASE: '/invoices',
    DETAILS: (id: string) => `/invoices/${id}`,
  },
  INVOICE_ITEMS: {
    BASE: '/invoice_items',
    DETAILS: (id: string) => `/invoice_items/${id}`,
  },
  INVOICE_HISTORIES: {
    BASE: '/invoice_histories',
    DETAILS: (id: string) => `/invoice_histories/${id}`,
  },
  QUOTES: {
    BASE: '/quotes',
    DETAILS: (id: string) => `/quotes/${id}`,
  },
  QUOTE_HISTORIES: {
    BASE: '/quote_histories',
    DETAILS: (id: string) => `/quote_histories/${id}`,
  },
  WAREHOUSE_INVENTORY_ITEMS: {
    BASE: '/warehouse_inventory_items',
    DETAILS: (id: string) => `/warehouse_inventory_items/${id}`,
  },
  ORDER_HISTORIES: {
    BASE: '/order_histories',
    DETAILS: (id: string) => `/order_histories/${id}`,
  },
  ADMIN: {
    USERS: '/admin/users',
  }
};

// API request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000;

// Number of retries for failed requests
export const MAX_RETRIES = 3;