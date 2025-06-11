// utils/companyApi.ts

export interface Company {
  company_id?: string;
  company_name: string;
  company_license_id: string;
  admin_email: string;
  company_number_user: number;
  is_active: boolean;
  is_verify: boolean;
  is_setup: boolean;
  created_by: string;
  license_expiry_date: string;
  created_at?: string;
  updated_at?: string;
  updated_by?: string;
}

export interface CreateCompanyRequest {
  company_name: string;
  company_license_id: string;
  admin_email: string;
  company_number_user: number;
  is_active: boolean;
  is_verify: boolean;
  is_setup: boolean;
  created_by: string;
  license_expiry_date: string;
}

export interface UpdateCompanyRequest {
  company_name?: string;
  company_license_id?: string;
  admin_email?: string;
  company_number_user?: number;
  is_active?: boolean;
  is_verify?: boolean;
  is_setup?: boolean;
  license_expiry_date?: string;
  updated_by?: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
}

class CompanyApiService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://20.204.162.66:5001') {
    this.baseUrl = baseUrl;
  }

  // Create new company
  async createCompany(companyData: CreateCompanyRequest): Promise<Company> {
    try {
      const response = await fetch(`${this.baseUrl}/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers if needed
          // 'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(companyData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<Company> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }

  // Get all companies
  async getAllCompanies(): Promise<Company[]> {
    try {
      const response = await fetch(`${this.baseUrl}/companies/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers if needed
          // 'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<Company[]> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  }

  // Get company by ID
  async getCompanyById(companyId: string): Promise<Company> {
    try {
      const response = await fetch(`${this.baseUrl}/companies/?company_id=${companyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers if needed
          // 'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<Company[]> = await response.json();
      
      // Since the API returns an array, get the first company
      if (result.data && result.data.length > 0) {
        return result.data[0];
      } else {
        throw new Error('Company not found');
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      throw error;
    }
  }

  // Update company (assuming PUT method exists)
  async updateCompany(companyId: string, companyData: UpdateCompanyRequest): Promise<Company> {
    try {
      const response = await fetch(`${this.baseUrl}/companies/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers if needed
          // 'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(companyData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<Company> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }

  // Delete company
  async deleteCompany(companyId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/companies/${companyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers if needed
          // 'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }

  // Upload company logo (if endpoint exists)
  async uploadLogo(file: File): Promise<{ logoUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch(`${this.baseUrl}/companies/upload-logo`, {
        method: 'POST',
        headers: {
          // Don't set Content-Type for FormData
          // Add auth headers if needed
          // 'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  }

  // Helper method to get auth token (implement based on your auth system)
  private getAuthToken(): string {
    // Replace with your actual token retrieval logic
    return localStorage.getItem('authToken') || '';
  }

  // Helper method to format date for API
  formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  // Helper method to parse API date
  parseApiDate(dateString: string): Date {
    return new Date(dateString);
  }
}

// Export singleton instance
export const companyApi = new CompanyApiService();

// Export individual functions for convenience
export const {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  uploadLogo,
} = companyApi;