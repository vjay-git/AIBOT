import React, { useState } from 'react';

interface ConnectionFieldsProps {
  onConnect: (processedFolder: string) => void; // Removed columnMapping parameter
  selectedDatabaseType?: string;
}

const ConnectionFields: React.FC<ConnectionFieldsProps> = ({ onConnect, selectedDatabaseType }) => {
  const [processedFolder, setProcessedFolder] = useState('');
  
  // PostgreSQL specific fields
  const [hostUrl, setHostUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleProcessedFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProcessedFolder(e.target.value);
  };

  const handleConnect = () => {
    if (selectedDatabaseType === 'postgresql') {
      // For PostgreSQL, we might want to include the connection details
      onConnect(processedFolder);
      console.log('PostgreSQL Connection Details:', { hostUrl, username, password });
    } else {
      onConnect(processedFolder);
    }
  };

  // Render PostgreSQL specific fields
  const renderPostgreSQLFields = () => (
    <div className="postgresql-fields">
      <div className="fields-grid">
        <div className="input-group">
          <label className="input-label" htmlFor="host-url">Host URL</label>
          <input 
            type="text" 
            id="host-url"
            className="text-input" 
            placeholder="localhost:5432 or your-host.com:5432"
            value={hostUrl}
            onChange={(e) => setHostUrl(e.target.value)}
          />
        </div>
        
        <div className="input-group">
          <label className="input-label" htmlFor="username">Username</label>
          <input 
            type="text" 
            id="username"
            className="text-input" 
            placeholder="Enter your PostgreSQL username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        
        <div className="input-group">
          <label className="input-label" htmlFor="password">Password</label>
          <input 
            type="password" 
            id="password"
            className="text-input" 
            placeholder="Enter your PostgreSQL password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="connection-fields-section">      
      <div className="connection-form">
        {/* Show PostgreSQL specific fields when PostgreSQL is selected */}
        {selectedDatabaseType === 'postgresql' && (
          <div className="postgresql-fields">
            <h3 className="fields-title">
              <span className="title-icon">🐘</span>
              PostgreSQL Connection
            </h3>
            <div className="fields-grid">
              <div className="input-group">
                <label className="input-label" htmlFor="host-url">Host URL</label>
                <input 
                  type="text" 
                  id="host-url"
                  className="text-input" 
                  placeholder="localhost:5432"
                  value={hostUrl}
                  onChange={(e) => setHostUrl(e.target.value)}
                />
              </div>
              
              <div className="input-group">
                <label className="input-label" htmlFor="username">Username</label>
                <input 
                  type="text" 
                  id="username"
                  className="text-input" 
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              
              <div className="input-group">
                <label className="input-label" htmlFor="password">Password</label>
                <input 
                  type="password" 
                  id="password"
                  className="text-input" 
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="processed-folder">Processed Folder</label>
                <input 
                  type="text" 
                  id="processed-folder"
                  className="text-input" 
                  placeholder="Enter folder path"
                  value={processedFolder}
                  onChange={handleProcessedFolderChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* Show only processed folder for other database types */}
        {selectedDatabaseType && selectedDatabaseType !== 'postgresql' && (
          <div className="other-db-fields">
            <h3 className="fields-title">
              <span className="title-icon">{getDatabaseIcon(selectedDatabaseType)}</span>
              {getDisplayName(selectedDatabaseType)} Connection
            </h3>
            <div className="single-field">
              <div className="input-group">
                <label className="input-label" htmlFor="processed-folder">Processed Folder</label>
                <input 
                  type="text" 
                  id="processed-folder"
                  className="text-input" 
                  placeholder="Enter processed folder path"
                  value={processedFolder}
                  onChange={handleProcessedFolderChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* Connect Button */}
        {selectedDatabaseType && (
          <div className="connection-actions">
            <button 
              className="connect-button"
              onClick={handleConnect}
              disabled={selectedDatabaseType === 'postgresql' && (!hostUrl || !username || !password || !processedFolder)}
            >
              <span className="button-icon">{getDatabaseIcon(selectedDatabaseType)}</span>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 12L12 8M12 8H9M12 8V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Connect to {getDisplayName(selectedDatabaseType)}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .connection-fields-section {
          width: 100%;
        }

        .connection-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .postgresql-fields, .other-db-fields {
          background: linear-gradient(135deg, #336791 0%, #2d5a87 100%);
          border-radius: 12px;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        .other-db-fields {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .postgresql-fields::before, .other-db-fields::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
        }

        .fields-title {
          position: relative;
          z-index: 1;
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 16px 0;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .title-icon {
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          backdrop-filter: blur(10px);
        }

        .fields-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .single-field {
          position: relative;
          z-index: 1;
          max-width: 400px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-label {
          font-size: 12px;
          font-weight: 600;
          color: #ffffff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .text-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          font-size: 14px;
          color: #1f2937;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          transition: all 0.2s ease;
          outline: none;
        }

        .text-input:focus {
          border-color: rgba(255, 255, 255, 0.8);
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
        }

        .text-input::placeholder {
          color: #9ca3af;
          font-size: 13px;
        }

        .connection-actions {
          display: flex;
          justify-content: flex-end;
        }

        .connect-button {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
        }

        .button-icon {
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .connect-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }

        .connect-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .fields-grid {
            grid-template-columns: 1fr;
          }
          
          .connection-actions {
            justify-content: center;
          }
          
          .connect-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );

  // Helper function to get display name
  function getDisplayName(type: string) {
    const displayNames: Record<string, string> = {
      'postgresql': 'PostgreSQL',
      'mysql': 'MySQL',
      'oracle': 'Oracle',
      'excel': 'Excel',
      'sap': 'SAP HANA',
      'google': 'Google Cloud SQL',
      'azure': 'Azure SQL',
      'mariadb': 'MariaDB'
    };
    return displayNames[type] || type;
  }

  // Helper function to get database icon (same as DbTabs)
  function getDatabaseIcon(type: string) {
    const databaseIcons: Record<string, string> = {
      'postgresql': '🐘',
      'mysql': '🐬',
      'oracle': '🏛️',
      'excel': '📊',
      'sap': '💎',
      'google': '☁️',
      'azure': '☁️',
      'mariadb': '🗄️'
    };
    return databaseIcons[type] || '🗄️';
  }
};

export default ConnectionFields;