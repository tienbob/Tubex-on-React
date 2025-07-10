import apiClient from './apiClient';
import { AxiosError } from 'axios';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  company_id?: string;
  company?: {
    id: string;
    name: string;
    type: string;
  };
  metadata?: Record<string, any>;
}

export interface UserCreateRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'staff';
  status?: 'active' | 'inactive' | 'pending' | 'suspended';
  company_id: string;
  send_invitation?: boolean;
}

export interface UserUpdateRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'manager' | 'staff';
  status?: 'active' | 'inactive' | 'pending' | 'suspended';
  company_id?: string;
  metadata?: Record<string, any>;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
  company_id?: string;
}

/**
 * User Management Service - Handles operations related to user accounts
 */
const userManagementService = {
  /**
   * Get all users with optional filtering
   */  getUsers: async (params: UserListParams = {}): Promise<User[]> => {
    try {
      const response = await apiClient.get('/users', { params });
      // Handle the nested response structure {status: 'success', data: [...]}
      return response.data?.data || response.data || [];
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch users',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Get a specific user by ID
   */
  getUser: async (userId: string): Promise<User> => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const response = await apiClient.get(`/users/${userId}`);
      return response.data?.data || response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to fetch user: ${userId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Create a new user
   */
  createUser: async (data: UserCreateRequest): Promise<User> => {
    try {
      const response = await apiClient.post('/users', data);
      return response.data?.data || response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to create user',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Update a user's information
   */
  updateUser: async (userId: string, data: UserUpdateRequest): Promise<User> => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      if (Object.keys(data).length === 0) {
        throw new Error('No update data provided');
      }
      
      const response = await apiClient.put(`/users/${userId}`, data);
      return response.data?.data || response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to update user: ${userId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Update a user's status
   */
  updateUserStatus: async (userId: string, status: 'active' | 'inactive' | 'pending' | 'suspended'): Promise<User> => {
    try {
      const response = await apiClient.patch(`/users/${userId}/status`, { status });
      return response.data?.data || response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to update user status: ${userId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Deactivate a user account
   */
  deactivateUser: async (userId: string): Promise<User> => {
    return userManagementService.updateUserStatus(userId, 'inactive');
  },

  /**
   * Activate a user account
   */
  activateUser: async (userId: string): Promise<User> => {
    return userManagementService.updateUserStatus(userId, 'active');
  },

  /**
   * Check email availability
   */
  checkEmailAvailability: async (email: string): Promise<boolean> => {
    try {
      const response = await apiClient.get(`/users/check-email`, { params: { email } });
      return response.data.available;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to check email availability',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Delete a user
   */
  deleteUser: async (userId: string): Promise<void> => {
    try {
      await apiClient.delete(`/users/${userId}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to delete user: ${userId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
};

export default userManagementService;

// Helper function to get user's first and last name from either direct properties or metadata
export const getUserName = (user: any): { firstName: string; lastName: string; fullName: string } => {
  const firstName = user?.firstName || user?.metadata?.firstName || '';
  const lastName = user?.lastName || user?.metadata?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  
  return {
    firstName,
    lastName,
    fullName: fullName || user?.email?.split('@')[0] || 'N/A'
  };
};

export * from './userManagementService';