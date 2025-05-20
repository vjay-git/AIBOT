import React, { useState } from 'react';

const LicenseManagement = () => {
  const [customerName, setCustomerName] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saveLoginDetails, setSaveLoginDetails] = useState(false);

  const handleGeneratePassword = () => {
    // Generate a random secure password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let generatedPassword = '';
    for (let i = 0; i < 12; i++) {
      generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generatedPassword);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitted license details:', {
      customerName,
      licenseKey,
      adminEmail,
      password,
      saveLoginDetails
    });
    // API call would go here
  };

  return (
    <div className="license-management-container">
      <h1 className="page-title">Customer Admin User</h1>
      <p className="page-description">Issue and manage license keys to control customer access and usage limits.</p>
      
      <form className="license-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h2 className="section-title">Customer and License Details</h2>
          <p className="section-description">Select the customer and assign a valid license key to proceed with admin user setup.</p>
          
          <div className="form-fields-grid">
            <div className="form-field">
              <label htmlFor="customer-name">Customer Name</label>
              <select 
                id="customer-name"
                className="select-input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              >
                <option value="">Select Type</option>
                <option value="customer1">Acme Inc.</option>
                <option value="customer2">TechCorp LLC</option>
                <option value="customer3">MediGlobal</option>
              </select>
            </div>
            
            <div className="form-field">
              <label htmlFor="license-key">Assign License Key</label>
              <select 
                id="license-key"
                className="select-input"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
              >
                <option value="">Select Type</option>
                <option value="license1">LK-8472-1234-ABCD</option>
                <option value="license2">LK-9571-5678-EFGH</option>
                <option value="license3">LK-6390-9012-IJKL</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h2 className="section-title">Admin User Credentials</h2>
          <p className="section-description">Enter the admin's login details to grant them access to Echo.</p>
          
          <div className="form-fields-grid">
            <div className="form-field">
              <label htmlFor="admin-email">Admin Email</label>
              <div className="email-input-container">
                <span className="email-icon">✉️</span>
                <input 
                  id="admin-email"
                  type="email"
                  className="text-input with-icon"
                  placeholder="Enter Email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <div className="password-input-container">
                <input 
                  id="password"
                  type="password"
                  className="text-input with-button"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  className="generate-password-button"
                  onClick={handleGeneratePassword}
                >
                  Generate Password
                </button>
              </div>
            </div>
            
            <div className="form-field checkbox-field">
              <label htmlFor="send-credentials">Send Credentials to Email</label>
              <div className="checkbox-container">
                <input 
                  id="save-login-details"
                  type="checkbox"
                  className="checkbox-input"
                  checked={saveLoginDetails}
                  onChange={(e) => setSaveLoginDetails(e.target.checked)}
                />
                <label htmlFor="save-login-details" className="checkbox-label">
                  Save my login details for next time.
                </label>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LicenseManagement; 