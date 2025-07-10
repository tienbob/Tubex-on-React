import { get, post, patch, del } from './apiClient';
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

export interface UserAuditLog {
  id: string;
  user_id: string;
  action: string;
  details?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface UserAuditLogCreateInput {
  user_id: string;
  action: string;
  details?: string;
  metadata?: any;
}

export interface UserAuditLogUpdateInput {
  action?: string;
  details?: string;
  metadata?: any;
}

export const userAuditLogService = {
  getLogs: async (params?: any): Promise<UserAuditLog[]> => {
    const response = await get<UserAuditLog[]>(`/user_audit_logs`, { params });
    return response.data;
  },
  getLogById: async (id: string): Promise<UserAuditLog> => {
    const response = await get<UserAuditLog>(`/user_audit_logs/${id}`);
    return response.data;
  },
  createLog: async (data: UserAuditLogCreateInput): Promise<UserAuditLog> => {
    const response = await post<UserAuditLog>(`/user_audit_logs`, data);
    return response.data;
  },
  updateLog: async (id: string, data: UserAuditLogUpdateInput): Promise<UserAuditLog> => {
    const response = await patch<UserAuditLog>(`/user_audit_logs/${id}`, data);
    return response.data;
  },
  deleteLog: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await del<{ success: boolean; message: string }>(`/user_audit_logs/${id}`);
    return response.data;
  }
};
