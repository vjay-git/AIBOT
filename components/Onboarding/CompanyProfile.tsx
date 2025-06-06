import React, { useState } from 'react';

const CompanyProfile = () => {
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [domainName, setDomainName] = useState('');
  const [subdomainName, setSubdomainName] = useState('');
  const [logoImage, setLogoImage] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoImage(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = () => {
    console.log('Saving company profile:', {
      companyName,
      companyEmail,
      domainName,
      subdomainName,
      logoImage
    });
    // API call would go here
  };

  return (
    <div className="company-profile-page">
      <div className="company-profile-container">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Company Profile</h1>
          <p className="page-description">Set up your company profile to personalize your experience</p>
        </div>

        {/* Form Content */}
        <div className="form-content">
          {/* Company Logo and Details Section */}
          <div className="main-section">
            {/* Logo Section */}
            <div className="logo-section">
              <h2 className="section-title">Company Logo</h2>
              <p className="section-description">Your company logo</p>
              
              <div className="logo-upload-area">
                <div className="logo-container">
                  {logoPreview ? (
                    <div className="logo-preview">
                      <img src={logoPreview} alt="Company logo preview" />
                    </div>
                  ) : (
                    <div className="logo-placeholder">
                      <span className="logo-letter">A</span>
                    </div>
                  )}
                </div>
                
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="file-input"
                />
                
                <label htmlFor="logo-upload" className="upload-btn">
                  {logoPreview ? 'Change Logo' : 'Upload Logo'}
                </label>
              </div>
            </div>
            
            {/* Company Details Section */}
            <div className="details-section">
              <h2 className="section-title">Company Logo</h2>
              
              <div className="form-fields">
                <div className="field-group">
                  <label htmlFor="company-name" className="field-label">
                    Company Name
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon">🏢</span>
                    <input
                      type="text"
                      id="company-name"
                      className="form-input with-icon"
                      placeholder="Company Name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="field-group">
                  <label htmlFor="company-email" className="field-label">
                    Company Email
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon">📧</span>
                    <input
                      type="email"
                      id="company-email"
                      className="form-input with-icon"
                      placeholder="company@gmail.com"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Domain Settings Section */}
          <div className="domain-section">
            <div className="domain-header">
              <h2 className="section-title">Domain Settings</h2>
              <p className="section-description">
                Manage your domain settings to customize access and authentication for your organization.
              </p>
            </div>
            
            <div className="domain-fields">
              <div className="field-group">
                <label htmlFor="domain-name" className="field-label">
                  Domain Name
                </label>
                <input
                  type="text"
                  id="domain-name"
                  className="form-input"
                  placeholder="Enter your domain"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                />
              </div>
              
              <div className="field-group">
                <label htmlFor="subdomain-name" className="field-label">
                  Sub-Domain Name
                </label>
                <input
                  type="text"
                  id="subdomain-name"
                  className="form-input"
                  placeholder="Enter subdomain"
                  value={subdomainName}
                  onChange={(e) => setSubdomainName(e.target.value)}
                />
                <p className="field-hint">
                  Subdomain separate services, departments, or apps while staying linked to the main domain.
                </p>
              </div>
            </div>
          </div>
          
          {/* Save Button */}
          <div className="form-actions">
            <button onClick={handleSaveChanges} className="save-btn">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;