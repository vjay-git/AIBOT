import React, { useState, useEffect } from 'react';

// API interfaces based on your actual endpoints
interface Company {
  company_id: string;
  company_name: string;
  company_license_id: string;
  admin_email: string;
  company_number_user: number;
  is_active: boolean;
  is_verify: boolean;
  is_setup: boolean;
  created_by: string;
  license_expiry_date: string;
  created_at: string;
  updated_at: string | null;
  updated_by: string | null;
}

interface CreateCompanyData {
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

// API Service
const companyService = {
  async getAllCompanies(): Promise<Company[]> {
    const response = await fetch('http://20.204.162.66:5001/companies/');
    const result = await response.json();
    return result.data;
  },

  async getCompanyById(companyId: string): Promise<Company> {
    const response = await fetch(`http://20.204.162.66:5001/companies/?company_id=${companyId}`);
    const result = await response.json();
    return result.data[0];
  },

  async createCompany(data: CreateCompanyData): Promise<Company> {
    // POST endpoint for creating new company
    const response = await fetch('http://20.204.162.66:5001/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create company');
    }
    
    const result = await response.json();
    return result.data;
  },

  async updateCompany(companyId: string, data: Partial<CreateCompanyData>): Promise<Company> {
    // Use the correct PUT endpoint format
    const response = await fetch(`http://20.204.162.66:5001/companies/${companyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update company');
    }
    
    const result = await response.json();
    return result.data;
  },

  async deleteCompany(companyId: string): Promise<void> {
    const response = await fetch(`http://20.204.162.66:5001/companies/${companyId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete company');
    }
  }
};

const CompanyProfile = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<CreateCompanyData>({
    company_name: '',
    company_license_id: '',
    admin_email: '',
    company_number_user: 1,
    is_active: true,
    is_verify: false,
    is_setup: false,
    created_by: 'admin',
    license_expiry_date: '2025-12-31'
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyService.getAllCompanies();
      setCompanies(data);
    } catch (err) {
      setError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      company_name: company.company_name,
      company_license_id: company.company_license_id,
      admin_email: company.admin_email,
      company_number_user: company.company_number_user,
      is_active: company.is_active,
      is_verify: company.is_verify,
      is_setup: company.is_setup,
      created_by: company.created_by,
      license_expiry_date: company.license_expiry_date.split('T')[0]
    });
    setShowCreateModal(false);
  };

  const handleCreateNew = () => {
    setSelectedCompany(null);
    setFormData({
      company_name: '',
      company_license_id: '',
      admin_email: '',
      company_number_user: 1,
      is_active: true,
      is_verify: false,
      is_setup: false,
      created_by: 'admin',
      license_expiry_date: '2025-12-31'
    });
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (selectedCompany) {
        await companyService.updateCompany(selectedCompany.company_id, formData);
        setSuccess('Company updated successfully!');
      } else {
        await companyService.createCompany(formData);
        setSuccess('Company created successfully!');
        setShowCreateModal(false);
      }

      await loadCompanies();
    } catch (err) {
      setError('Failed to save company');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCompany) return;
    
    if (window.confirm(`Delete ${selectedCompany.company_name}?`)) {
      try {
        await companyService.deleteCompany(selectedCompany.company_id);
        setSuccess('Company deleted successfully!');
        setSelectedCompany(null);
        await loadCompanies();
      } catch (err) {
        setError('Failed to delete company');
      }
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.admin_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.company_license_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Clear messages after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Top Navigation */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px',
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b',
            margin: 0
          }}>
            Company Management
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            margin: '2px 0 0 0'
          }}>
            Manage your company profiles and settings
          </p>
        </div>
        
        <button
          onClick={handleCreateNew}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#2563eb';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#3b82f6';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Company
        </button>
      </div>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        height: 'calc(100vh - 72px)'
      }}>
        
        {/* Sidebar */}
        <div style={{
          width: '320px',
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Search */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <div style={{
              position: 'relative'
            }}>
              <svg 
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#9ca3af'
                }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  background: '#ffffff'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Companies List */}
          <div style={{
            flex: 1,
            overflowY: 'auto'
          }}>
            {loading ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '200px',
                color: '#64748b'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid #e2e8f0',
                  borderTop: '2px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏢</div>
                <p style={{ fontSize: '14px', margin: 0 }}>No companies found</p>
              </div>
            ) : (
              <div style={{ padding: '8px' }}>
                {filteredCompanies.map((company) => (
                  <div
                    key={company.company_id}
                    onClick={() => handleSelectCompany(company)}
                    style={{
                      padding: '12px',
                      marginBottom: '4px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: selectedCompany?.company_id === company.company_id ? '#eff6ff' : '#ffffff',
                      border: selectedCompany?.company_id === company.company_id ? '1px solid #3b82f6' : '1px solid transparent'
                    }}
                    onMouseOver={(e) => {
                      if (selectedCompany?.company_id !== company.company_id) {
                        e.currentTarget.style.background = '#f8fafc';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedCompany?.company_id !== company.company_id) {
                        e.currentTarget.style.background = '#ffffff';
                      }
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        flexShrink: 0
                      }}>
                        {company.company_name.charAt(0).toUpperCase()}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#1e293b',
                          marginBottom: '2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {company.company_name}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#64748b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {company.admin_email}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#94a3b8',
                          marginTop: '1px'
                        }}>
                          {company.company_number_user} users
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '2px'
                      }}>
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: company.is_active ? '#dcfce7' : '#fee2e2',
                          color: company.is_active ? '#166534' : '#991b1b',
                          fontWeight: '500'
                        }}>
                          {company.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {company.is_verify && (
                          <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: '#22c55e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
                              <path d="M9 12l2 2 4-4"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Panel */}
        <div style={{
          flex: 1,
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Status Messages */}
          {error && (
            <div style={{
              margin: '16px',
              padding: '12px 16px',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#991b1b',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              margin: '16px',
              padding: '12px 16px',
              background: '#dcfce7',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              color: '#166534',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {success}
            </div>
          )}

          {!selectedCompany && !showCreateModal ? (
            /* Empty State */
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '32px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: '#f1f5f9',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <svg width="40" height="40" fill="#64748b" viewBox="0 0 24 24">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                Select a Company
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                maxWidth: '400px',
                lineHeight: '1.5'
              }}>
                Choose a company from the sidebar to view and edit its details, or create a new company profile.
              </p>
            </div>
          ) : (
            /* Form Content */
            <div style={{
              flex: 1,
              padding: '24px',
              overflowY: 'auto'
            }}>
              {/* Header */}
              <div style={{
                marginBottom: '24px'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1e293b',
                  marginBottom: '4px'
                }}>
                  {selectedCompany ? 'Edit Company Profile' : 'Create New Company'}
                </h2>
                <p style={{
                  fontSize: '14px',
                  color: '#64748b'
                }}>
                  {selectedCompany 
                    ? 'Update company information and settings'
                    : 'Fill in the details to create a new company profile'
                  }
                </p>
              </div>

              {/* Form */}
              <div style={{
                maxWidth: '800px'
              }}>
                {/* Basic Information Section */}
                <div style={{
                  marginBottom: '24px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: '#3b82f6',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    Basic Information
                  </h3>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '6px'
                      }}>
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={formData.company_name}
                        onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                        placeholder="Enter company name"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'all 0.2s ease',
                          background: '#ffffff'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '6px'
                      }}>
                        Admin Email *
                      </label>
                      <input
                        type="email"
                        value={formData.admin_email}
                        onChange={(e) => setFormData({...formData, admin_email: e.target.value})}
                        placeholder="admin@company.com"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'all 0.2s ease',
                          background: '#ffffff'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '6px'
                      }}>
                        License ID
                      </label>
                      <input
                        type="text"
                        value={formData.company_license_id}
                        onChange={(e) => setFormData({...formData, company_license_id: e.target.value})}
                        placeholder="Enter license ID"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'all 0.2s ease',
                          background: '#ffffff'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '6px'
                      }}>
                        Number of Users
                      </label>
                      <input
                        type="number"
                        value={formData.company_number_user}
                        onChange={(e) => setFormData({...formData, company_number_user: parseInt(e.target.value) || 1})}
                        min="1"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'all 0.2s ease',
                          background: '#ffffff'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      License Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.license_expiry_date}
                      onChange={(e) => setFormData({...formData, license_expiry_date: e.target.value})}
                      style={{
                        width: '100%',
                        maxWidth: '200px',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        background: '#ffffff'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Status Settings Section */}
                <div style={{
                  marginBottom: '32px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: '#10b981',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
                        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                    </div>
                    Status Settings
                  </h3>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px'
                  }}>
                    {[
                      { 
                        key: 'is_active', 
                        label: 'Company Active', 
                        description: 'Enable company operations',
                        color: '#10b981'
                      },
                      { 
                        key: 'is_verify', 
                        label: 'Verified', 
                        description: 'Company verification status',
                        color: '#3b82f6'
                      },
                      { 
                        key: 'is_setup', 
                        label: 'Setup Complete', 
                        description: 'Initial setup finished',
                        color: '#8b5cf6'
                      }
                    ].map(({ key, label, description, color }) => (
                      <label key={key} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: '#ffffff'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = color;
                        e.currentTarget.style.backgroundColor = `${color}08`;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                      >
                        <div style={{
                          position: 'relative',
                          marginTop: '2px'
                        }}>
                          <input
                            type="checkbox"
                            checked={formData[key as keyof typeof formData] as boolean}
                            onChange={(e) => setFormData({...formData, [key]: e.target.checked})}
                            style={{
                              position: 'absolute',
                              opacity: 0,
                              cursor: 'pointer'
                            }}
                          />
                          <div style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '3px',
                            border: `2px solid ${(formData[key as keyof typeof formData] as boolean) ? color : '#d1d5db'}`,
                            background: (formData[key as keyof typeof formData] as boolean) ? color : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}>
                            {(formData[key as keyof typeof formData] as boolean) && (
                              <svg width="10" height="10" fill="white" viewBox="0 0 24 24">
                                <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>
                              </svg>
                            )}
                          </div>
                        </div>
                        <div>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#1e293b',
                            marginBottom: '2px'
                          }}>
                            {label}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#64748b',
                            lineHeight: '1.4'
                          }}>
                            {description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e2e8f0'
                }}>
                  <button
                    onClick={handleSave}
                    disabled={saving || !formData.company_name || !formData.admin_email}
                    style={{
                      padding: '10px 16px',
                      background: saving || !formData.company_name || !formData.admin_email 
                        ? '#94a3b8' 
                        : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: saving || !formData.company_name || !formData.admin_email ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseOver={(e) => {
                      if (!saving && formData.company_name && formData.admin_email) {
                        e.currentTarget.style.background = '#2563eb';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!saving && formData.company_name && formData.admin_email) {
                        e.currentTarget.style.background = '#3b82f6';
                      }
                    }}
                  >
                    {saving ? (
                      <>
                        <div style={{
                          width: '14px',
                          height: '14px',
                          border: '2px solid transparent',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z"/>
                          <polyline points="9,11 11,13 15,9"/>
                        </svg>
                        {selectedCompany ? 'Update Company' : 'Create Company'}
                      </>
                    )}
                  </button>

                  {selectedCompany && (
                    <button
                      onClick={handleDelete}
                      style={{
                        padding: '10px 16px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#dc2626';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#ef4444';
                      }}
                    >
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 6h18m-9 0V4a2 2 0 012-2h4a2 2 0 012 2v2M8 6v12a2 2 0 002 2h8a2 2 0 002-2V6H8z"/>
                      </svg>
                      Delete
                    </button>
                  )}

                  <button
                    onClick={loadCompanies}
                    style={{
                      padding: '10px 16px',
                      background: '#ffffff',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#f9fafb';
                      e.currentTarget.style.borderColor = '#9ca3af';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                  >
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    Refresh
                  </button>

                  {(selectedCompany || showCreateModal) && (
                    <button
                      onClick={() => {
                        setSelectedCompany(null);
                        setShowCreateModal(false);
                      }}
                      style={{
                        padding: '10px 16px',
                        background: '#ffffff',
                        color: '#6b7280',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#f9fafb';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                      }}
                    >
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                      Cancel
                    </button>
                  )}
                </div>

                {/* Company Details Card */}
                {selectedCompany && (
                  <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      Company Details
                    </h4>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '12px'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '11px',
                          color: '#64748b',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '4px'
                        }}>
                          Company ID
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#1e293b',
                          fontFamily: 'monospace',
                          background: '#ffffff',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          border: '1px solid #e2e8f0'
                        }}>
                          {selectedCompany.company_id}
                        </div>
                      </div>

                      <div>
                        <div style={{
                          fontSize: '11px',
                          color: '#64748b',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '4px'
                        }}>
                          Created By
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#1e293b'
                        }}>
                          {selectedCompany.created_by}
                        </div>
                      </div>

                      <div>
                        <div style={{
                          fontSize: '11px',
                          color: '#64748b',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '4px'
                        }}>
                          Created Date
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#1e293b'
                        }}>
                          {formatDate(selectedCompany.created_at)}
                        </div>
                      </div>

                      <div>
                        <div style={{
                          fontSize: '11px',
                          color: '#64748b',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '4px'
                        }}>
                          Last Updated
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#1e293b'
                        }}>
                          {selectedCompany.updated_at ? formatDate(selectedCompany.updated_at) : 'Never'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CompanyProfile;