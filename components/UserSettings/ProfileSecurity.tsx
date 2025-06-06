import React, { useState } from 'react';

interface ProfileSecurityProps {
  userData?: {
    name: string;
    email: string;
    licenseKey: string;
  };
}

const ProfileSecurity: React.FC<ProfileSecurityProps> = ({ 
  userData = {
    name: "",
    email: "",
    licenseKey: ""
  }
}) => {
  return (
    <div className="profile-security-container">
      <h1 className="page-title">Profile & Security</h1>
      
      <div className="sections-container">
        {/* Profile Section */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Profile</h2>
            <p className="section-description">Your personal information</p>
          </div>

          <div className="section-content profile-section">
            <div className="column-left">
              <div className="field-group">
                <label className="field-label">Full Name</label>
                <div className="input-container">
                  <span className="input-icon1">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.0002 10.0001C12.3013 10.0001 14.1668 8.1346 14.1668 5.83341C14.1668 3.53223 12.3013 1.66675 10.0002 1.66675C7.69898 1.66675 5.8335 3.53223 5.8335 5.83341C5.8335 8.1346 7.69898 10.0001 10.0002 10.0001Z" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17.1585 18.3333C17.1585 15.1083 13.9501 12.5 10.0001 12.5C6.05013 12.5 2.8418 15.1083 2.8418 18.3333" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <input 
                    type="text" 
                    className="text-input" 
                    value={userData.name}
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="column-right">
              <div className="avatar-container">
                <div className="avatar">
                  <span>AR</span>
                </div>
                <div className="avatar-label">Avatar</div>
              </div>
            </div>
          </div>

          <div className="field-group full-width">
            <label className="field-label">Email</label>
            <div className="input-container">
              <span className="input-icon1">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.5 6.25V13.75C17.5 14.4167 17.2433 14.9867 16.73 15.46C16.2167 15.9333 15.6033 16.17 14.89 16.17H5.11C4.39667 16.17 3.78333 15.9333 3.27 15.46C2.75667 14.9867 2.5 14.4167 2.5 13.75V6.25M17.5 6.25C17.5 5.58333 17.2433 5.01333 16.73 4.54C16.2167 4.06667 15.6033 3.83 14.89 3.83H5.11C4.39667 3.83 3.78333 4.06667 3.27 4.54C2.75667 5.01333 2.5 5.58333 2.5 6.25M17.5 6.25L10 11.25L2.5 6.25" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <input 
                type="email" 
                className="text-input" 
                value={userData.email}
                readOnly
              />
            </div>
          </div>
        </section>

        {/* License Key Section (instead of password) */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">License Key</h2>
            <p className="section-description">Your product license information</p>
          </div>

          <div className="field-group full-width">
            <label className="field-label">License Key</label>
            <div className="input-container">
              <span className="input-icon1">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.8333 9.16675H4.16667C3.24619 9.16675 2.5 9.91294 2.5 10.8334V16.6667C2.5 17.5872 3.24619 18.3334 4.16667 18.3334H15.8333C16.7538 18.3334 17.5 17.5872 17.5 16.6667V10.8334C17.5 9.91294 16.7538 9.16675 15.8333 9.16675Z" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5.83325 9.16667V5.83333C5.83325 4.72827 6.27224 3.66846 7.05364 2.88706C7.83504 2.10565 8.89485 1.66667 9.99992 1.66667C11.105 1.66667 12.1648 2.10565 12.9462 2.88706C13.7276 3.66846 14.1666 4.72827 14.1666 5.83333V9.16667" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 14.1667C10.4602 14.1667 10.8333 13.7936 10.8333 13.3334C10.8333 12.8731 10.4602 12.5 10 12.5C9.53976 12.5 9.16666 12.8731 9.16666 13.3334C9.16666 13.7936 9.53976 14.1667 10 14.1667Z" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <input 
                type="text" 
                className="text-input license-key" 
                value={userData.licenseKey}
                readOnly
              />
            </div>
          </div>
        </section>
      </div>

      <div className="actions-container">
        <button className="save-button">Save Changes</button>
      </div>
    </div>
  );
};

export default ProfileSecurity; 