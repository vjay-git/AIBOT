import React, { useState, useEffect } from 'react';

// API interfaces
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

interface LicenseFormData {
  company_id: string;
  license_key: string;
  admin_email: string;
  password: string;
  send_credentials: boolean;
}

// API Service
const licenseService = {
  async getAllCompanies(): Promise<Company[]> {
    const response = await fetch('http://20.204.162.66:5001/companies/');
    const result = await response.json();
    return result.data;
  },

  async getCompanyById(companyId: string): Promise<Company> {
    const response = await fetch(`http://20.204.162.66:5001/companies/${companyId}`);
    const result = await response.json();
    return result.data;
  },

  async generateTemporaryLicense(companyId: string): Promise<string> {
    const response = await fetch(`http://20.204.162.66:5001/license/temporary?company_id=${companyId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate temporary license');
    }
    
    const result = await response.json();
    
    // Handle different possible response formats
    if (typeof result === 'string') {
      return result;
    }
    
    // Extract license key from object response
    const licenseKey = result.temporary_license_key || 
                      result.license_key || 
                      result.data?.license_key || 
                      result.data?.temporary_license_key ||
                      result.key ||
                      result.temporary_license ||
                      result.license;
    
    if (!licenseKey) {
      console.error('Unexpected API response format:', result);
      throw new Error('License key not found in API response');
    }
    
    return String(licenseKey);
  },

  async generatePermanentLicense(companyId: string): Promise<string> {
    const response = await fetch(`http://20.204.162.66:5001/license/permanent?company_id=${companyId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate permanent license');
    }
    
    const result = await response.json();
    
    // Handle different possible response formats
    if (typeof result === 'string') {
      return result;
    }
    
    // Extract license key from object response
    const licenseKey = result.permanent_license_key || 
                      result.license_key || 
                      result.data?.license_key || 
                      result.data?.permanent_license_key ||
                      result.key ||
                      result.permanent_license ||
                      result.license;
    
    if (!licenseKey) {
      console.error('Unexpected API response format:', result);
      throw new Error('License key not found in API response');
    }
    
    return String(licenseKey);
  },

  async createAdminUser(data: LicenseFormData): Promise<any> {
    // This would be your admin user creation API
    const response = await fetch('http://20.204.162.66:5001/admin-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: data.company_id,
        admin_email: data.admin_email,
        password: data.password,
        license_key: data.license_key,
        send_credentials: data.send_credentials
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create admin user');
    }
    
    return await response.json();
  }
};

const LicenseManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingLicense, setGeneratingLicense] = useState<'temp' | 'permanent' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // License popup state
  const [showLicensePopup, setShowLicensePopup] = useState(false);
  const [generatedLicense, setGeneratedLicense] = useState<{
    type: 'temporary' | 'permanent';
    key: string;
    companyName: string;
  } | null>(null);

  const [formData, setFormData] = useState<LicenseFormData>({
    company_id: '',
    license_key: '',
    admin_email: '',
    password: '',
    send_credentials: false
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await licenseService.getAllCompanies();
      setCompanies(data);
    } catch (err) {
      setError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = async (companyId: string) => {
    try {
      const company = await licenseService.getCompanyById(companyId);
      setSelectedCompany(company);
      setFormData(prev => ({
        ...prev,
        company_id: companyId,
        license_key: company.company_license_id || '',
        admin_email: company.admin_email
      }));
    } catch (err) {
      setError('Failed to load company details');
    }
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let generatedPassword = '';
    for (let i = 0; i < 12; i++) {
      generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: generatedPassword }));
  };

  const handleGenerateLicense = async (type: 'temp' | 'permanent') => {
    if (!selectedCompany) return;
    
    try {
      setGeneratingLicense(type);
      setError(null);

      let licenseKey: string;
      if (type === 'temp') {
        licenseKey = await licenseService.generateTemporaryLicense(selectedCompany.company_id);
      } else {
        licenseKey = await licenseService.generatePermanentLicense(selectedCompany.company_id);
      }

      // Show popup with generated license
      setGeneratedLicense({
        type: type === 'temp' ? 'temporary' : 'permanent',
        key: licenseKey,
        companyName: selectedCompany.company_name
      });
      setShowLicensePopup(true);

      setSuccess(`${type === 'temp' ? 'Temporary' : 'Permanent'} license generated successfully!`);

    } catch (err) {
      setError(`Failed to generate ${type === 'temp' ? 'temporary' : 'permanent'} license`);
    } finally {
      setGeneratingLicense(null);
    }
  };

  const handleCopyLicense = async () => {
    if (!generatedLicense) return;
    
    try {
      await navigator.clipboard.writeText(generatedLicense.key);
      setSuccess('License key copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = generatedLicense.key;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setSuccess('License key copied to clipboard!');
    }
  };

  const handleCloseLicensePopup = () => {
    setShowLicensePopup(false);
    setGeneratedLicense(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_id || !formData.license_key || !formData.admin_email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await licenseService.createAdminUser(formData);
      setSuccess('Admin user created successfully!');
      
      // Reset form
      setFormData({
        company_id: '',
        license_key: '',
        admin_email: '',
        password: '',
        send_credentials: false
      });
      setSelectedCompany(null);

    } catch (err) {
      setError('Failed to create admin user');
    } finally {
      setSaving(false);
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      padding: '24px'
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none'
      }}>
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '15%',
          width: '150px',
          height: '150px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'float 8s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '70%',
          right: '20%',
          width: '120px',
          height: '120px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          animation: 'float 10s ease-in-out infinite reverse'
        }}></div>
      </div>

      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 8px 0',
            letterSpacing: '-0.5px'
          }}>
            Customer Admin User Management
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            margin: 0,
            fontWeight: '500',
            lineHeight: '1.6'
          }}>
            Issue and manage license keys to control customer access and usage limits.
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div style={{
            margin: '0 0 24px 0',
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
            margin: '0 0 24px 0',
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

        {/* Main Form */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Customer and License Details Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}>
                <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                </svg>
              </div>
              Customer and License Details
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              Select the customer and assign a valid license key to proceed with admin user setup.
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Customer Name *
                </label>
                <select
                  value={formData.company_id}
                  onChange={(e) => handleCompanySelect(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid transparent',
                    borderRadius: '12px',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#1e293b',
                    fontWeight: '500',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center',
                    backgroundSize: '16px',
                    paddingRight: '48px',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = 'rgba(255, 255, 255, 1)';
                    e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'transparent';
                    e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Select Customer</option>
                  {companies.map(company => (
                    <option key={company.company_id} value={company.company_id}>
                      {company.company_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  License Key *
                </label>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  gap: '12px'
                }}>
                  <input
                    type="text"
                    value={formData.license_key}
                    onChange={(e) => setFormData(prev => ({ ...prev, license_key: e.target.value }))}
                    placeholder="Generate or enter license key"
                    readOnly={!!selectedCompany}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      border: '2px solid transparent',
                      borderRadius: '12px',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: selectedCompany ? 'rgba(243, 244, 246, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                      color: '#1e293b',
                      fontWeight: '500',
                      fontFamily: 'monospace'
                    }}
                    onFocus={(e) => {
                      if (!selectedCompany) {
                        e.target.style.borderColor = '#667eea';
                        e.target.style.background = 'rgba(255, 255, 255, 1)';
                        e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                      }
                    }}
                    onBlur={(e) => {
                      if (!selectedCompany) {
                        e.target.style.borderColor = 'transparent';
                        e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  />
                  {selectedCompany && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleGenerateLicense('temp')}
                        disabled={generatingLicense === 'temp'}
                        style={{
                          padding: '14px 16px',
                          background: generatingLicense === 'temp' 
                            ? '#94a3b8' 
                            : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: generatingLicense === 'temp' ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: generatingLicense === 'temp' 
                            ? 'none' 
                            : '0 4px 15px rgba(245, 158, 11, 0.4)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {generatingLicense === 'temp' ? (
                          <div style={{
                            width: '14px',
                            height: '14px',
                            border: '2px solid transparent',
                            borderTop: '2px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                        ) : (
                          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        )}
                        Temp
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleGenerateLicense('permanent')}
                        disabled={generatingLicense === 'permanent'}
                        style={{
                          padding: '14px 16px',
                          background: generatingLicense === 'permanent' 
                            ? '#94a3b8' 
                            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: generatingLicense === 'permanent' ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: generatingLicense === 'permanent' 
                            ? 'none' 
                            : '0 4px 15px rgba(16, 185, 129, 0.4)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {generatingLicense === 'permanent' ? (
                          <div style={{
                            width: '14px',
                            height: '14px',
                            border: '2px solid transparent',
                            borderTop: '2px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                        ) : (
                          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4m5-6H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H5z"/>
                          </svg>
                        )}
                        Perm
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Company Details Display */}
            {selectedCompany && (
              <div style={{
                marginTop: '24px',
                padding: '20px',
                background: 'rgba(102, 126, 234, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(102, 126, 234, 0.1)'
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Selected Company Details
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  fontSize: '14px'
                }}>
                  <div>
                    <span style={{ color: '#6b7280', fontWeight: '500' }}>Company: </span>
                    <span style={{ color: '#1f2937', fontWeight: '600' }}>{selectedCompany.company_name}</span>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280', fontWeight: '500' }}>Users: </span>
                    <span style={{ color: '#1f2937', fontWeight: '600' }}>{selectedCompany.company_number_user}</span>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280', fontWeight: '500' }}>Status: </span>
                    <span style={{
                      color: selectedCompany.is_active ? '#059669' : '#dc2626',
                      fontWeight: '600',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: selectedCompany.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      fontSize: '12px'
                    }}>
                      {selectedCompany.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Admin User Credentials Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}>
                <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              Admin User Credentials
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              Enter the admin's login details to grant them access to the system.
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              marginBottom: '24px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Admin Email *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '16px',
                    color: '#9ca3af',
                    pointerEvents: 'none'
                  }}>📧</span>
                  <input
                    type="email"
                    value={formData.admin_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, admin_email: e.target.value }))}
                    placeholder="Enter admin email"
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 48px',
                      border: '2px solid transparent',
                      borderRadius: '12px',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: 'rgba(255, 255, 255, 0.9)',
                      color: '#1e293b',
                      fontWeight: '500'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#10b981';
                      e.target.style.background = 'rgba(255, 255, 255, 1)';
                      e.target.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'transparent';
                      e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Password *
                </label>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'stretch'
                }}>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter or generate password"
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      border: '2px solid transparent',
                      borderRadius: '12px',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: 'rgba(255, 255, 255, 0.9)',
                      color: '#1e293b',
                      fontWeight: '500'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#10b981';
                      e.target.style.background = 'rgba(255, 255, 255, 1)';
                      e.target.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'transparent';
                      e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    style={{
                      padding: '14px 20px',
                      background: 'rgba(243, 244, 246, 0.9)',
                      border: '2px solid transparent',
                      borderRadius: '12px',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(229, 231, 235, 0.9)';
                      e.currentTarget.style.borderColor = '#9ca3af';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(243, 244, 246, 0.9)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Generate
                  </button>
                </div>
              </div>
            </div>
            
            <div style={{
              padding: '20px',
              background: 'rgba(16, 185, 129, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(16, 185, 129, 0.1)'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151'
              }}>
                <input
                  type="checkbox"
                  checked={formData.send_credentials}
                  onChange={(e) => setFormData(prev => ({ ...prev, send_credentials: e.target.checked }))}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    border: '2px solid #d1d5db',
                    cursor: 'pointer',
                    accentColor: '#10b981'
                  }}
                />
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Send Credentials to Email</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    Automatically send the admin credentials to the specified email address.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              type="submit"
              disabled={saving || !formData.company_id || !formData.license_key || !formData.admin_email || !formData.password}
              style={{
                padding: '16px 32px',
                background: saving || !formData.company_id || !formData.license_key || !formData.admin_email || !formData.password
                  ? '#94a3b8' 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: saving || !formData.company_id || !formData.license_key || !formData.admin_email || !formData.password ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: saving || !formData.company_id || !formData.license_key || !formData.admin_email || !formData.password
                  ? 'none' 
                  : '0 4px 20px rgba(102, 126, 234, 0.4)',
                transform: 'translateY(0)',
                minWidth: '200px',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => {
                if (!saving && formData.company_id && formData.license_key && formData.admin_email && formData.password) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(102, 126, 234, 0.5)';
                }
              }}
              onMouseOut={(e) => {
                if (!saving && formData.company_id && formData.license_key && formData.admin_email && formData.password) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4)';
                }
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '3px solid transparent',
                    borderTop: '3px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Creating Admin User...
                </>
              ) : (
                <>
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  Create Admin User
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setFormData({
                  company_id: '',
                  license_key: '',
                  admin_email: '',
                  password: '',
                  send_credentials: false
                });
                setSelectedCompany(null);
              }}
              style={{
                padding: '16px 32px',
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#6b7280',
                border: '2px solid rgba(156, 163, 175, 0.3)',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transform: 'translateY(0)',
                minWidth: '150px',
                justifyContent: 'center'
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
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Clear Form
            </button>

            <button
              type="button"
              onClick={loadCompanies}
              style={{
                padding: '16px 32px',
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#374151',
                border: '2px solid rgba(102, 126, 234, 0.2)',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transform: 'translateY(0)',
                minWidth: '150px',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Refresh
            </button>
          </div>
        </form>

        {/* License Generation Popup */}
        {showLicensePopup && generatedLicense && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: '40px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
              maxWidth: '500px',
              width: '100%',
              position: 'relative',
              animation: 'popupSlideIn 0.3s ease-out'
            }}>
              {/* Close Button */}
              <button
                onClick={handleCloseLicensePopup}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(156, 163, 175, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: '#6b7280'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(156, 163, 175, 0.3)';
                  e.currentTarget.style.color = '#374151';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(156, 163, 175, 0.2)';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>

              {/* Popup Content */}
              <div style={{ textAlign: 'center' }}>
                {/* Success Icon */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: generatedLicense.type === 'temporary' 
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px auto',
                  boxShadow: generatedLicense.type === 'temporary'
                    ? '0 10px 30px rgba(245, 158, 11, 0.4)'
                    : '0 10px 30px rgba(16, 185, 129, 0.4)'
                }}>
                  <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>

                {/* Title */}
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  background: generatedLicense.type === 'temporary'
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: '0 0 8px 0'
                }}>
                  {generatedLicense.type === 'temporary' ? 'Temporary' : 'Permanent'} License Generated
                </h2>

                {/* Company Name */}
                <p style={{
                  fontSize: '16px',
                  color: '#6b7280',
                  marginBottom: '24px',
                  fontWeight: '500'
                }}>
                  For: <strong style={{ color: '#1f2937' }}>{generatedLicense.companyName}</strong>
                </p>

                {/* License Key Display */}
                <div style={{
                  background: 'rgba(243, 244, 246, 0.8)',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '24px',
                  border: '2px dashed rgba(156, 163, 175, 0.3)'
                }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    License Key:
                  </label>
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid rgba(209, 213, 219, 0.5)',
                    fontFamily: 'monospace',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1f2937',
                    wordBreak: 'break-all',
                    lineHeight: '1.5',
                    textAlign: 'center'
                  }}>
                    {generatedLicense.key}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={handleCopyLicense}
                    style={{
                      padding: '14px 24px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                      transform: 'translateY(0)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 30px rgba(102, 126, 234, 0.5)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4)';
                    }}
                  >
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
                    </svg>
                    Copy License Key
                  </button>

                  <button
                    onClick={handleCloseLicensePopup}
                    style={{
                      padding: '14px 24px',
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
                      gap: '8px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(156, 163, 175, 0.1)';
                      e.currentTarget.style.borderColor = '#9ca3af';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                      e.currentTarget.style.borderColor = 'rgba(156, 163, 175, 0.3)';
                    }}
                  >
                    Close
                  </button>
                </div>

                {/* Instructions */}
                <div style={{
                  marginTop: '24px',
                  padding: '16px',
                  background: 'rgba(59, 130, 246, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(59, 130, 246, 0.1)',
                  textAlign: 'left'
                }}>
                  <div style={{
                    fontSize: '14px',
                    color: '#1e40af',
                    fontWeight: '600',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Next Steps
                  </div>
                  <ol style={{
                    fontSize: '13px',
                    color: '#1e40af',
                    margin: 0,
                    paddingLeft: '20px',
                    lineHeight: '1.6'
                  }}>
                    <li>Copy the license key using the button above</li>
                    <li>Go to Company Management section</li>
                    <li>Edit the company and paste the license key</li>
                    <li>Save the company to update the license</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Instructions */}
        <div style={{
          marginTop: '32px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#374151',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            How to Use
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            <div style={{
              padding: '16px',
              background: 'rgba(59, 130, 246, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(59, 130, 246, 0.1)'
            }}>
              <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                1. Select Customer
              </div>
              <div style={{ color: '#6b7280' }}>
                Choose an existing company from the dropdown list. This will auto-populate the admin email and show company details.
              </div>
            </div>
            <div style={{
              padding: '16px',
              background: 'rgba(245, 158, 11, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(245, 158, 11, 0.1)'
            }}>
              <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                2. Generate License
              </div>
              <div style={{ color: '#6b7280' }}>
                Click "Temp" for temporary access or "Perm" for permanent access. The license key will be automatically generated and assigned.
              </div>
            </div>
            <div style={{
              padding: '16px',
              background: 'rgba(16, 185, 129, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.1)'
            }}>
              <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                3. Set Credentials
              </div>
              <div style={{ color: '#6b7280' }}>
                Enter admin email and generate a secure password. Optionally enable email delivery of credentials to the admin.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes popupSlideIn {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .license-management-container {
            padding: 16px !important;
          }
          
          .form-section {
            padding: 24px !important;
          }
          
          .form-fields-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          
          .password-input-container {
            flex-direction: column !important;
            gap: 12px !important;
          }
          
          .generate-password-button {
            align-self: flex-start !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LicenseManagement;