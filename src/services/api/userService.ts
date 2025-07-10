import { get, post, patch, del } from './apiClient';
import { AxiosError } from 'axios';

// Custom error class for API errors
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
  name: string;
  email: string;
  user_role: string; // snake_case, string enum
  status: string;    // snake_case, string enum
  company_id: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface UserCreateRequest {
  name: string;
  email: string;
  user_role: string;
  status?: string;
  company_id: string;
  metadata?: any;
  password: string;
  password_confirmation?: string;
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  user_role?: string;
  status?: string;
  company_id?: string;
  metadata?: any;
  password?: string;
  password_confirmation?: string;
}

/**
 * Service for handling user-related API calls
 */
export const userService = {
  /**
   * Get all users with pagination and filtering
   */
  getUsers: async (params?: any): Promise<User[]> => {
    try {
      // Use standard Rails RESTful route: /users
      const response = await get<User[]>(`/users`, {
        params: {
          limit: 10,
          page: 1,
          ...params
        }
      });
      
      return response.data;
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
   * Get a single user by ID
   */
  getUserById: async (id: string): Promise<User> => {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Valid user ID is required');
      }
      
      // Use standard Rails RESTful route: /users/:id
      const response = await get<User>(`/users/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to fetch user: ${id}`,
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
  createUser: async (userData: UserCreateRequest): Promise<User> => {
    try {
      // Basic validation
      if (!userData.name || !userData.email || !userData.user_role || !userData.password) {
        throw new Error('All required fields must be provided');
      }
      
      // Use standard Rails RESTful route: /users
      const response = await post<User>(`/users`, userData);
      return response.data;
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
   * Update a user's details
   */
  updateUser: async (id: string, userData: UserUpdateRequest): Promise<User> => {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Valid user ID is required');
      }
      
      // Use standard Rails RESTful route: /users/:id
      const response = await patch<User>(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to update user: ${id}`,
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
  deleteUser: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Valid user ID is required');
      }
      
      // Use standard Rails RESTful route: /users/:id
      const response = await del<{ success: boolean; message: string }>(`/users/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to delete user: ${id}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  }
};