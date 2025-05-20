import React, { useState } from 'react';

const CompanyProfile = () => {
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [domainName, setDomainName] = useState('');
  const [subdomainName, setSubdomainName] = useState('');
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="company-profile-container">
      <h1 className="page-title">Company Profile</h1>
      <p className="page-description">Set up your company profile to personalize your experience</p>
      
      <div className="company-profile-form">
        <div className="form-row">
          <div className="form-column logo-column">
            <h2 className="section-title">Company Logo</h2>
            <p className="section-description">Your company logo</p>
            
            <div className="logo-upload-container">
              {logoPreview ? (
                <div className="logo-preview">
                  <img src={logoPreview} alt="Company logo preview" />
                </div>
              ) : (
                <div className="logo-placeholder">
                  <div className="logo-letter">A</div>
                </div>
              )}
              
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                onChange={handleLogoChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>
          
          <div className="form-column details-column">
            <h2 className="section-title">Company Logo</h2>
            
            <div className="form-fields">
              <div className="form-field">
                <label htmlFor="company-name">Company Name</label>
                <div className="input-container">
                  <span className="input-icon">🏢</span>
                  <input
                    type="text"
                    id="company-name"
                    className="text-input with-icon"
                    placeholder="Company Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="form-field">
                <label htmlFor="company-email">Company Email</label>
                <div className="input-container">
                  <span className="input-icon">✉️</span>
                  <input
                    type="email"
                    id="company-email"
                    className="text-input with-icon"
                    placeholder="company@gmail.com"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-row domain-section">
          <div className="form-column">
            <h2 className="section-title">Domain Settings</h2>
            <p className="section-description">Manage your domain settings to customize access and authentication for your organization.</p>
            
            <div className="form-fields">
              <div className="form-field">
                <label htmlFor="domain-name">Domain Name</label>
                <input
                  type="text"
                  id="domain-name"
                  className="text-input"
                  placeholder="Enter your domain"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                />
              </div>
              
              <div className="form-field">
                <label htmlFor="subdomain-name">Sub-Domain Name</label>
                <input
                  type="text"
                  id="subdomain-name"
                  className="text-input"
                  placeholder="Enter subdomain"
                  value={subdomainName}
                  onChange={(e) => setSubdomainName(e.target.value)}
                />
                <p className="field-hint">Subdomain separate services, departments, or apps while staying linked to the main domain.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button className="save-button" onClick={handleSaveChanges}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile; 