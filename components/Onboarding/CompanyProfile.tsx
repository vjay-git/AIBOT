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
    
    const parseExpiryDate = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      } catch (error) {
        console.error('Error parsing date:', error);
        return '2025-12-31';
      }
    };
    
    setFormData({
      company_name: company.company_name,
      company_license_id: company.company_license_id,
      admin_email: company.admin_email,
      company_number_user: company.company_number_user,
      is_active: company.is_active,
      is_verify: company.is_verify,
      is_setup: company.is_setup,
      created_by: company.created_by,
      license_expiry_date: parseExpiryDate(company.license_expiry_date)
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
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const formatExpiryDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting expiry date:', error);
      return 'Invalid Date';
    }
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
      background: 'linear-gradient(135deg, #001576 0%, #002B8F 50%, #0040A3 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 0
      }}>
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '200px',
          height: '200px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '60%',
          right: '10%',
          width: '150px',
          height: '150px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>
      </div>

      {/* Top Navigation */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '0 32px',
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #001576 0%, #0040A3 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            letterSpacing: '-0.5px'
          }}>
            Company Management
          </h1>
          <p style={{
            fontSize: '15px',
            color: '#64748b',
            margin: '4px 0 0 0',
            fontWeight: '500'
          }}>
            Manage your company profiles with elegance
          </p>
        </div>
        
        <button
          onClick={handleCreateNew}
          style={{
            background: 'linear-gradient(135deg, #001576 0%, #0040A3 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 20px rgba(0, 21, 118, 0.4)',
            transform: 'translateY(0)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 21, 118, 0.5)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 21, 118, 0.4)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Company
        </button>
      </div>

      {/* Main Content */}
      <div style={{
        position: 'relative',
        zIndex: 5,
        display: 'flex',
        height: 'calc(100vh - 80px)',
        padding: '24px',
        gap: '24px'
      }}>
        
        {/* Sidebar */}
        <div style={{
          width: '380px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Search */}
          <div style={{
            padding: '24px 24px 16px 24px'
          }}>
            <div style={{
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'linear-gradient(135deg, #001576 0%, #0040A3 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 48px',
                  border: '2px solid transparent',
                  borderRadius: '12px',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: 'rgba(0, 21, 118, 0.08)',
                  color: '#1e293b',
                  fontWeight: '500'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#001576';
                  e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(0, 21, 118, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'transparent';
                  e.target.style.background = 'rgba(0, 21, 118, 0.08)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Companies List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 16px 16px 16px'
          }}>
            {loading ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '300px',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid rgba(0, 21, 118, 0.2)',
                  borderTop: '3px solid #001576',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '500' }}>Loading companies...</p>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: '#64748b'
              }}>
                <div style={{ 
                  fontSize: '48px', 
                  marginBottom: '16px',
                  filter: 'grayscale(1)',
                  opacity: 0.5
                }}>🏢</div>
                <p style={{ fontSize: '16px', margin: 0, fontWeight: '500' }}>No companies found</p>
                <p style={{ fontSize: '14px', margin: '8px 0 0 0', opacity: 0.7 }}>Try adjusting your search</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredCompanies.map((company, index) => (
                  <div
                    key={company.company_id}
                    onClick={() => handleSelectCompany(company)}
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: selectedCompany?.company_id === company.company_id 
                        ? 'linear-gradient(135deg, rgba(0, 21, 118, 0.15) 0%, rgba(0, 64, 163, 0.15) 100%)'
                        : 'rgba(255, 255, 255, 0.7)',
                      border: selectedCompany?.company_id === company.company_id 
                        ? '2px solid rgba(0, 21, 118, 0.3)' 
                        : '2px solid transparent',
                      transform: 'translateY(0)',
                      animation: `slideIn 0.5s ease-out ${index * 0.1}s both`
                    }}
                    onMouseOver={(e) => {
                      if (selectedCompany?.company_id !== company.company_id) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedCompany?.company_id !== company.company_id) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #001576 0%, #0040A3 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: '700',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(0, 21, 118, 0.4)'
                      }}>
                        {company.company_name.charAt(0).toUpperCase()}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#1e293b',
                          marginBottom: '4px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {company.company_name}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: '#64748b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginBottom: '4px'
                        }}>
                          {company.admin_email}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#94a3b8',
                          fontWeight: '500'
                        }}>
                          {company.company_number_user} users • Expires: {formatExpiryDate(company.license_expiry_date)}
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '6px'
                      }}>
                        <span style={{
                          fontSize: '11px',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          background: company.is_active 
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: 'white',
                          fontWeight: '600',
                          boxShadow: company.is_active 
                            ? '0 2px 8px rgba(16, 185, 129, 0.3)' 
                            : '0 2px 8px rgba(239, 68, 68, 0.3)'
                        }}>
                          {company.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {company.is_verify && (
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="3">
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
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Status Messages */}
          {error && (
            <div style={{
              margin: '20px 24px 0 24px',
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              color: '#991b1b',
              fontSize: '15px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              animation: 'slideInDown 0.3s ease-out'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              margin: '20px 24px 0 24px',
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '12px',
              color: '#166534',
              fontSize: '15px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              animation: 'slideInDown 0.3s ease-out'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              {success}
            </div>
          )}

          {!selectedCompany && !showCreateModal ? (
            /* Elegant Empty State */
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '48px'
            }}>
              <div style={{
                width: '120px',
                height: '120px',
                background: 'linear-gradient(135deg, rgba(0, 21, 118, 0.1) 0%, rgba(0, 64, 163, 0.1) 100%)',
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                animation: 'float 3s ease-in-out infinite'
              }}>
                <svg width="60" height="60" fill="none" stroke="#001576" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                  <path d="M17 21v-8a2 2 0 00-2-2H9a2 2 0 00-2 2v8"/>
                </svg>
              </div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #001576 0%, #0040A3 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '12px'
              }}>
                Select a Company
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#64748b',
                maxWidth: '400px',
                lineHeight: '1.6',
                fontWeight: '500'
              }}>
                Choose a company from the sidebar to view and edit its details, or create a new company profile to get started.
              </p>
            </div>
          ) : (
            /* Enhanced Form Content */
            <div style={{
              flex: 1,
              padding: '32px',
              overflowY: 'auto'
            }}>
              {/* Enhanced Form */}
              <div style={{
                maxWidth: '900px',
                margin: '0 auto'
              }}>
                {/* Beautiful Basic Information Section */}
                <div style={{
                  marginBottom: '32px',
                  background: 'rgba(0, 21, 118, 0.05)',
                  borderRadius: '20px',
                  padding: '28px',
                  border: '1px solid rgba(0, 21, 118, 0.1)'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #001576 0%, #0040A3 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      background: 'linear-gradient(135deg, #001576 0%, #0040A3 100%)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0, 21, 118, 0.3)'
                    }}>
                      <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    Basic Information
                  </h3>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '20px',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
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
                          padding: '14px 16px',
                          border: '2px solid transparent',
                          borderRadius: '12px',
                          fontSize: '15px',
                          outline: 'none',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          background: 'rgba(255, 255, 255, 0.8)',
                          color: '#1e293b',
                          fontWeight: '500'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#001576';
                          e.target.style.background = 'rgba(255, 255, 255, 1)';
                          e.target.style.boxShadow = '0 0 0 4px rgba(0, 21, 118, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'transparent';
                          e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
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
                          padding: '14px 16px',
                          border: '2px solid transparent',
                          borderRadius: '12px',
                          fontSize: '15px',
                          outline: 'none',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          background: 'rgba(255, 255, 255, 0.8)',
                          color: '#1e293b',
                          fontWeight: '500'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#667eea';
                          e.target.style.background = 'rgba(255, 255, 255, 1)';
                          e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'transparent';
                          e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '20px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
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
                          padding: '14px 16px',
                          border: '2px solid transparent',
                          borderRadius: '12px',
                          fontSize: '15px',
                          outline: 'none',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          background: 'rgba(255, 255, 255, 0.8)',
                          color: '#1e293b',
                          fontWeight: '500'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#667eea';
                          e.target.style.background = 'rgba(255, 255, 255, 1)';
                          e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'transparent';
                          e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
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
                          padding: '14px 16px',
                          border: '2px solid transparent',
                          borderRadius: '12px',
                          fontSize: '15px',
                          outline: 'none',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          background: 'rgba(255, 255, 255, 0.8)',
                          color: '#1e293b',
                          fontWeight: '500'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#667eea';
                          e.target.style.background = 'rgba(255, 255, 255, 1)';
                          e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'transparent';
                          e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      License Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.license_expiry_date}
                      onChange={(e) => setFormData({...formData, license_expiry_date: e.target.value})}
                      style={{
                        width: '100%',
                        maxWidth: '280px',
                        padding: '14px 16px',
                        border: '2px solid transparent',
                        borderRadius: '12px',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: 'rgba(255, 255, 255, 0.8)',
                        color: '#1e293b',
                        fontWeight: '500'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#667eea';
                        e.target.style.background = 'rgba(255, 255, 255, 1)';
                        e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'transparent';
                        e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Beautiful Status Settings Section */}
                <div style={{
                  marginBottom: '32px',
                  background: 'rgba(0, 43, 143, 0.05)',
                  borderRadius: '20px',
                  padding: '28px',
                  border: '1px solid rgba(0, 43, 143, 0.1)'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #002B8F 0%, #0040A3 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      background: 'linear-gradient(135deg, #002B8F 0%, #0040A3 100%)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0, 43, 143, 0.3)'
                    }}>
                      <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                    </div>
                    Status Settings
                  </h3>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '16px'
                  }}>
                    {[
                      { 
                        key: 'is_active', 
                        label: 'Company Active', 
                        description: 'Enable company operations and user access',
                        color: '#002B8F',
                        icon: '⚡'
                      },
                      { 
                        key: 'is_verify', 
                        label: 'Verified Status', 
                        description: 'Company verification and compliance status',
                        color: '#001576',
                        icon: '✓'
                      },
                      { 
                        key: 'is_setup', 
                        label: 'Setup Complete', 
                        description: 'Initial setup and configuration finished',
                        color: '#0040A3',
                        icon: '⚙️'
                      }
                    ].map(({ key, label, description, color, icon }) => (
                      <label key={key} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '16px',
                        padding: '20px',
                        border: '2px solid transparent',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: (formData[key as keyof typeof formData] as boolean)
                          ? `${color}08`
                          : 'rgba(255, 255, 255, 0.8)',
                        transform: 'translateY(0)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = color;
                        e.currentTarget.style.background = `${color}15`;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = `0 8px 25px ${color}25`;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.background = (formData[key as keyof typeof formData] as boolean)
                          ? `${color}08`
                          : 'rgba(255, 255, 255, 0.8)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
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
                            width: '24px',
                            height: '24px',
                            borderRadius: '8px',
                            border: `3px solid ${(formData[key as keyof typeof formData] as boolean) ? color : '#d1d5db'}`,
                            background: (formData[key as keyof typeof formData] as boolean) ? color : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: (formData[key as keyof typeof formData] as boolean) 
                              ? `0 4px 12px ${color}40` 
                              : 'none'
                          }}>
                            {(formData[key as keyof typeof formData] as boolean) && (
                              <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
                                <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>
                              </svg>
                            )}
                          </div>
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#1e293b',
                            marginBottom: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ fontSize: '18px' }}>{icon}</span>
                            {label}
                          </div>
                          <div style={{
                            fontSize: '14px',
                            color: '#64748b',
                            lineHeight: '1.5',
                            fontWeight: '500'
                          }}>
                            {description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  paddingTop: '24px',
                  borderTop: '2px solid rgba(0, 21, 118, 0.1)',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={handleSave}
                    disabled={saving || !formData.company_name || !formData.admin_email}
                    style={{
                      padding: '14px 28px',
                      background: saving || !formData.company_name || !formData.admin_email 
                        ? '#94a3b8' 
                        : 'linear-gradient(135deg, #001576 0%, #0040A3 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '700',
                      cursor: saving || !formData.company_name || !formData.admin_email ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: saving || !formData.company_name || !formData.admin_email 
                        ? 'none' 
                        : '0 4px 20px rgba(0, 21, 118, 0.4)',
                      transform: 'translateY(0)'
                    }}
                    onMouseOver={(e) => {
                      if (!saving && formData.company_name && formData.admin_email) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 21, 118, 0.5)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!saving && formData.company_name && formData.admin_email) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 21, 118, 0.4)';
                      }
                    }}
                  >
                    {saving ? (
                      <>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          border: '3px solid transparent',
                          borderTop: '3px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
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
                        padding: '14px 28px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '15px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
                        transform: 'translateY(0)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(239, 68, 68, 0.5)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(239, 68, 68, 0.4)';
                      }}
                    >
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 6h18m-9 0V4a2 2 0 012-2h4a2 2 0 012 2v2M8 6v12a2 2 0 002 2h8a2 2 0 002-2V6H8z"/>
                      </svg>
                      Delete Company
                    </button>
                  )}

                  <button
                    onClick={loadCompanies}
                    style={{
                      padding: '14px 28px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      color: '#374151',
                      border: '2px solid rgba(0, 21, 118, 0.2)',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transform: 'translateY(0)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 21, 118, 0.1)';
                      e.currentTarget.style.borderColor = '#001576';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 21, 118, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                      e.currentTarget.style.borderColor = 'rgba(0, 21, 118, 0.2)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
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
                        padding: '14px 28px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        color: '#6b7280',
                        border: '2px solid rgba(156, 163, 175, 0.3)',
                        borderRadius: '12px',
                        fontSize: '15px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transform: 'translateY(0)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(156, 163, 175, 0.1)';
                        e.currentTarget.style.borderColor = '#9ca3af';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.borderColor = 'rgba(156, 163, 175, 0.3)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                      Cancel
                    </button>
                  )}
                </div>

                {/* Beautiful Company Details Card */}
                {selectedCompany && (
                  <div style={{
                    marginTop: '32px',
                    padding: '24px',
                    background: 'linear-gradient(135deg, rgba(0, 21, 118, 0.05) 0%, rgba(0, 64, 163, 0.05) 100%)',
                    border: '1px solid rgba(0, 21, 118, 0.1)',
                    borderRadius: '20px'
                  }}>
                    <h4 style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #001576 0%, #0040A3 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        background: 'linear-gradient(135deg, #001576 0%, #0040A3 100%)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0, 21, 118, 0.3)'
                      }}>
                        <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
                          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                      </div>
                      Company Details
                    </h4>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '16px'
                    }}>
                      <div style={{
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                      }}>
                        <div style={{
                          fontSize: '12px',
                          color: '#64748b',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '6px'
                        }}>
                          Company ID
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#1e293b',
                          fontFamily: 'monospace',
                          background: 'rgba(0, 21, 118, 0.1)',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          fontWeight: '600'
                        }}>
                          {selectedCompany.company_id}
                        </div>
                      </div>

                      <div style={{
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                      }}>
                        <div style={{
                          fontSize: '12px',
                          color: '#64748b',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '6px'
                        }}>
                          Created By
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#1e293b',
                          fontWeight: '600'
                        }}>
                          {selectedCompany.created_by}
                        </div>
                      </div>

                      <div style={{
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                      }}>
                        <div style={{
                          fontSize: '12px',
                          color: '#64748b',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '6px'
                        }}>
                          License Expiry
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#1e293b',
                          fontWeight: '600'
                        }}>
                          {formatExpiryDate(selectedCompany.license_expiry_date)}
                        </div>
                      </div>

                      <div style={{
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                      }}>
                        <div style={{
                          fontSize: '12px',
                          color: '#64748b',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '6px'
                        }}>
                          Created Date
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#1e293b',
                          fontWeight: '600'
                        }}>
                          {formatDate(selectedCompany.created_at)}
                        </div>
                      </div>

                      <div style={{
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                      }}>
                        <div style={{
                          fontSize: '12px',
                          color: '#64748b',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '6px'
                        }}>
                          Last Updated
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#1e293b',
                          fontWeight: '600'
                        }}>
                          {selectedCompany.updated_at ? formatDate(selectedCompany.updated_at) : 'Never'}
                        </div>
                      </div>

                      <div style={{
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                      }}>
                        <div style={{
                          fontSize: '12px',
                          color: '#64748b',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '6px'
                        }}>
                          Updated By
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#1e293b',
                          fontWeight: '600'
                        }}>
                          {selectedCompany.updated_by || 'N/A'}
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

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes slideIn {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInDown {
          0% {
            opacity: 0;
            transform: translateY(-30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #001576 0%, #0040A3 100%);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #000c52 0%, #002B8F 100%);
        }
      `}</style>
    </div>
  );
};

export default CompanyProfile;