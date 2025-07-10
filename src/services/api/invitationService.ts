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

export interface Invitation {
  id: string;
  email: string;
  company_id: string;
  role: string;
  status: string; // enum: 'pending' | 'accepted' | 'expired'
  token: string;
  invited_by_id: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface InvitationCreateInput {
  email: string;
  company_id: string;
  role: string;
  invited_by_id: string;
  metadata?: any;
}

export interface InvitationUpdateInput {
  status?: string;
  metadata?: any;
}

export const invitationService = {
  getInvitations: async (params?: any): Promise<Invitation[]> => {
    const response = await get<Invitation[]>(`/invitations`, { params });
    return response.data;
  },
  getInvitationById: async (id: string): Promise<Invitation> => {
    const response = await get<Invitation>(`/invitations/${id}`);
    return response.data;
  },
  createInvitation: async (data: InvitationCreateInput): Promise<Invitation> => {
    const response = await post<Invitation>(`/invitations`, data);
    return response.data;
  },
  updateInvitation: async (id: string, data: InvitationUpdateInput): Promise<Invitation> => {
    const response = await patch<Invitation>(`/invitations/${id}`, data);
    return response.data;
  },
  deleteInvitation: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await del<{ success: boolean; message: string }>(`/invitations/${id}`);
    return response.data;
  }
};
