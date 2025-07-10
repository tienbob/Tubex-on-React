import { AxiosError } from 'axios';
import { get, post, put, del } from './apiClient';

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

export type CompanyType = 'dealer' | 'supplier';

export interface Company {
  id: string;
  name: string;
  company_type: CompanyType;
  tax_id: string;
  business_license?: string;
  address?: string;
  business_category?: string;
  employee_count?: number;
  year_established?: number;
  contact_phone?: string;
  subscription_tier?: string;
  status?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCompanyInput {
  name: string;
  company_type: CompanyType;
  tax_id: string;
  business_license?: string;
  address?: string;
  business_category?: string;
  employee_count?: number;
  year_established?: number;
  contact_phone?: string;
  subscription_tier?: string;
  status?: string;
  metadata?: Record<string, any>;
}

export interface UpdateCompanyInput {
  name?: string;
  company_type?: CompanyType;
  tax_id?: string;
  business_license?: string;
  address?: string;
  business_category?: string;
  employee_count?: number;
  year_established?: number;
  contact_phone?: string;
  subscription_tier?: string;
  status?: string;
  metadata?: Record<string, any>;
}

export const companyService = {
  async getCompanies(params?: any): Promise<Company[]> {
    try {
      const response = await get<{ status: string, data: Company[] }>(`/companies`, { params });
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch companies',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  async getCompanyById(id: string): Promise<{ company: Company }> {
    if (!id) {
      console.error('getCompanyById called with invalid id:', id);
      throw new ApiError('Invalid company ID provided', 400);
    }
    try {
      console.log('Fetching company by ID:', id);
      const response = await get<{ status: string, data: Company }>(`/companies/${id}`);
      return { company: response.data.data }; // Wrap in expected format
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('API error fetching company:', error.response?.data || error.message);
        throw new ApiError(
          error.response?.data?.message || `Failed to fetch company details for ID ${id}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      console.error('Unknown error fetching company:', error);
      throw error;
    }
  },

  async createCompany(data: CreateCompanyInput): Promise<Company> {
    try {
      const response = await post<{ status: string, data: Company }>(`/companies`, data);
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to create company',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  async updateCompany(id: string, data: UpdateCompanyInput): Promise<Company> {
    try {
      const response = await put<{ status: string, data: Company }>(`/companies/${id}`, data);
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to update company',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  async deleteCompany(id: string): Promise<void> {
    try {
      await del(`/companies/${id}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to delete company',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  async getSuppliers(): Promise<Company[]> {
    try {
      // Fetch only companies with type 'supplier'
      return await this.getCompanies({ company_type: 'supplier' });
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch suppliers',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
};
