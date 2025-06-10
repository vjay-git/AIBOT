import React, { useState, useEffect, useCallback } from 'react';
import { DatabaseType, DatabaseTableRow } from '../../types';
import DatabaseHeader from '../../components/Database/DatabaseHeader';
import DatabaseTypeSelect from '../../components/Database/DatabaseTypeSelect';
import FileUploader from '../../components/Database/FileUploader';
import SheetSelector from '../../components/Database/SheetSelector';
import ConnectionFields from '../../components/Database/ConnectionFields';
import DatabaseTable from '../../components/Database/DatabaseTable';
import AlignView from '../../components/Database/AlignView';

// Enhanced subnav items for database with dynamic updates
export const getDatabaseTabs = (connectedDatabases: string[] = []) => {
  if (connectedDatabases.length === 0) {
    return [
      { id: 'database-1', title: 'Database', parentId: 'database' }
    ];
  }

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

  return connectedDatabases.map((dbType, index) => ({
    id: `db-${dbType}-${index}`,
    title: displayNames[dbType] || dbType,
    parentId: 'database'
  }));
};

// Export default tabs for initial load
export const databaseTabs = getDatabaseTabs();

interface DatabaseSession {
  id: string;
  type: string;
  name: string;
  isConnected: boolean;
  connectionDetails?: any;
  tables?: DatabaseTableRow[];
}

const Database = () => {
  // State variables
  const [activeTab, setActiveTab] = useState<'database' | 'align'>('database');
  const [loading, setLoading] = useState(false);
  
  // Database sessions management
  const [databaseSessions, setDatabaseSessions] = useState<DatabaseSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  
  // Current session state
  const [selectedDatabaseType, setSelectedDatabaseType] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [isConnectionSuccessful, setIsConnectionSuccessful] = useState(false);

  // Initialize with first session
  useEffect(() => {
    if (databaseSessions.length === 0) {
      createNewDatabaseSession();
    }
  }, []);

  // Create new database session
  const createNewDatabaseSession = () => {
    const newSession: DatabaseSession = {
      id: `session-${Date.now()}`,
      type: '',
      name: 'New Database Connection',
      isConnected: false,
      tables: []
    };

    setDatabaseSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    
    // Reset current form state
    setSelectedDatabaseType('');
    setUploadedFile(null);
    setSelectedSheet('');
    setIsConnectionSuccessful(false);
    
    // Update window.databaseTabs
    updateDatabaseTabs();
  };

  // Update database tabs
  const updateDatabaseTabs = () => {
    if (typeof window !== 'undefined') {
      const connectedDatabases = databaseSessions
        .filter(session => session.isConnected)
        .map(session => session.type);
      
      console.log('🔄 Updating database tabs with connected databases:', connectedDatabases);
      
      const updatedTabs = getDatabaseTabs(connectedDatabases);
      (window as any).databaseTabs = updatedTabs;
      
      // Dispatch event to notify layout of tab changes
      const event = new CustomEvent('databaseTabsUpdated', {
        detail: { 
          tabs: updatedTabs,
          connectedDatabases: connectedDatabases 
        }
      });
      window.dispatchEvent(event);
      
      console.log('✅ Database tabs updated:', updatedTabs);
    }
  };

  // Listen for add database events from Layout
  useEffect(() => {
    const handleAddDatabaseEvent = () => {
      createNewDatabaseSession();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('addNewDatabase', handleAddDatabaseEvent);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('addNewDatabase', handleAddDatabaseEvent);
      }
    };
  }, []);

  // Update window when database type changes
  useEffect(() => {
    if (selectedDatabaseType) {
      // Emit event to notify Layout of database type change
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('databaseTypeChanged', {
          detail: { databaseType: selectedDatabaseType }
        });
        window.dispatchEvent(event);
      }
    }
  }, [selectedDatabaseType]);

  // Handle database type selection
  const handleDatabaseTypeSelect = (type: string) => {
    setSelectedDatabaseType(type);
    console.log(`Selected database type: ${type}`);
    
    // Update current session
    if (activeSessionId) {
      setDatabaseSessions(prev => prev.map(session => 
        session.id === activeSessionId 
          ? { ...session, type, name: getDisplayName(type) }
          : session
      ));
    }

    // IMMEDIATELY update the navbar to show the selected database type
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('databaseTypeChanged', {
        detail: { databaseType: type }
      });
      window.dispatchEvent(event);
      
      // Also trigger tab update to show current selection
      const connectedDatabases = databaseSessions
        .filter(session => session.isConnected)
        .map(session => session.type);
      
      // Add current selection as "current" type if not connected
      const currentSelection = type;
      
      const tabsEvent = new CustomEvent('databaseTabsUpdated', {
        detail: { 
          tabs: getDatabaseTabs(connectedDatabases),
          connectedDatabases: connectedDatabases,
          currentSelection: currentSelection
        }
      });
      window.dispatchEvent(tabsEvent);
    }

    // Generate sample sheets for Excel
    if (type === 'excel') {
      setAvailableSheets(['Sheet-1', 'Sheet-2', 'Sheet-3']);
    }
  };

  // Get display name for database type
  const getDisplayName = (type: string) => {
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
  };

  // Handle file upload
  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    console.log(`Uploaded file: ${file.name}`);
  };

  // Handle sheet selection
  const handleSheetSelect = (sheet: string) => {
    setSelectedSheet(sheet);
    console.log(`Selected sheet: ${sheet}`);
  };

  // Handle database connection
  const handleConnect = (processedFolder: string) => {
    setLoading(true);
    
    // Simulate connection process
    setTimeout(() => {
      console.log(`Connecting with processed folder: ${processedFolder}`);
      
      // Mark current session as connected
      if (activeSessionId) {
        setDatabaseSessions(prev => prev.map(session => 
          session.id === activeSessionId 
            ? { 
                ...session, 
                isConnected: true,
                type: selectedDatabaseType,
                name: getDisplayName(selectedDatabaseType),
                connectionDetails: {
                  processedFolder,
                  databaseType: selectedDatabaseType,
                  ...(selectedDatabaseType === 'postgresql' && {
                    // Connection details would be saved here
                  })
                },
                tables: []
              }
            : session
        ));
        
        setIsConnectionSuccessful(true);
        updateDatabaseTabs();
      }
      
      setLoading(false);
    }, 2000);
  };

  // Get current session
  const getCurrentSession = () => {
    return databaseSessions.find(session => session.id === activeSessionId);
  };

  // Handle table operations
  const handleEditRow = (id: string) => {
    console.log(`Editing row with ID: ${id}`);
  };

  const handleDeleteRow = (id: string) => {
    console.log(`Deleting row with ID: ${id}`);
    const currentSession = getCurrentSession();
    if (currentSession) {
      const updatedTables = currentSession.tables?.filter(row => row.id !== id) || [];
      setDatabaseSessions(prev => prev.map(session => 
        session.id === activeSessionId 
          ? { ...session, tables: updatedTables }
          : session
      ));
    }
  };

  const handleRowSelect = (id: string, selected: boolean) => {
    console.log(`Row ${id} selected: ${selected}`);
  };

  // Copy alignment row
  const handleCopyAlignmentRow = (id: string) => {
    console.log(`Copying alignment row with ID: ${id}`);
  };

  // Options for alignment row
  const handleAlignmentRowOptions = (id: string) => {
    console.log(`Options for alignment row with ID: ${id}`);
  };

  const currentSession = getCurrentSession();

  if (loading) {
    return (
      <div className="aesthetic-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-content">
            <h3>Establishing Connection</h3>
            <p>Connecting to {getDisplayName(selectedDatabaseType)}...</p>
            <div className="loading-progress">
              <div className="progress-bar"></div>
            </div>
          </div>
        </div>
        
        <style jsx>{`
          .aesthetic-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            margin: 20px;
          }

          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 24px;
            padding: 40px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          }

          .loading-spinner {
            width: 60px;
            height: 60px;
            border: 4px solid #f3f4f6;
            border-top: 4px solid #0052FF;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          .loading-content h3 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
          }

          .loading-content p {
            margin: 0;
            font-size: 16px;
            color: #6b7280;
          }

          .loading-progress {
            width: 200px;
            height: 4px;
            background: #e5e7eb;
            border-radius: 2px;
            overflow: hidden;
          }

          .progress-bar {
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, #0052FF, #00D4AA);
            border-radius: 2px;
            animation: progress 2s ease-in-out infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes progress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="aesthetic-database-page">
      <DatabaseHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'database' ? (
        <div className="database-content">
          {/* Connection Success Banner */}
          {isConnectionSuccessful && currentSession?.isConnected && (
            <div className="success-banner">
              <div className="success-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="success-content">
                <h3>🎉 Successfully Connected!</h3>
                <p>Your {getDisplayName(selectedDatabaseType)} database is now active and ready to use.</p>
              </div>
            </div>
          )}

          {/* Connection Form */}
          {!currentSession?.isConnected && (
            <div className="connection-form-container">
              <div className="form-card">
                <div className="database-type-section">
                  <DatabaseTypeSelect onSelectType={handleDatabaseTypeSelect} />
                </div>
                
                {selectedDatabaseType === 'excel' && (
                  <div className="excel-section">
                    <div className="excel-grid">
                      <FileUploader onFileSelected={handleFileUpload} />
                      <SheetSelector sheets={availableSheets} onSelectSheet={handleSheetSelect} />
                    </div>
                  </div>
                )}

                {selectedDatabaseType && (
                  <ConnectionFields 
                    onConnect={handleConnect} 
                    selectedDatabaseType={selectedDatabaseType}
                  />
                )}
              </div>
            </div>
          )}

          {/* Connected State */}
          {currentSession?.isConnected && (
            <div className="connected-state">
              <div className="empty-state-card">
                <div className="empty-state-icon">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="16" width="48" height="32" rx="4" fill="#F3F4F6"/>
                    <rect x="12" y="20" width="40" height="2" fill="#D1D5DB"/>
                    <rect x="12" y="26" width="40" height="2" fill="#D1D5DB"/>
                    <rect x="12" y="32" width="40" height="2" fill="#D1D5DB"/>
                    <rect x="12" y="38" width="40" height="2" fill="#D1D5DB"/>
                  </svg>
                </div>
                <div className="empty-state-content">
                  <h3>Ready to Import Data</h3>
                  <p>Your {getDisplayName(selectedDatabaseType)} database is connected. Start by importing your tables or creating new ones to begin working with your data.</p>
                  <button className="import-button">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 3V17M3 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Import Tables
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tables Section */}
          {currentSession?.tables && currentSession.tables.length > 0 && (
            <DatabaseTable 
              data={currentSession.tables} 
              onEdit={handleEditRow} 
              onDelete={handleDeleteRow} 
              onSelectRow={handleRowSelect}
              selectedRows={[]}
            />
          )}
        </div>
      ) : (
        <AlignView 
          onCopy={handleCopyAlignmentRow} 
          onOptions={handleAlignmentRowOptions} 
        />
      )}

      <style jsx>{`
        .aesthetic-database-page {
          padding: 20px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
        }

        .database-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .success-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
          animation: slideIn 0.5s ease-out;
        }

        .success-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          backdrop-filter: blur(10px);
        }

        .success-content h3 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .success-content p {
          margin: 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .connection-form-container {
          display: flex;
          justify-content: center;
        }

        .form-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          width: 100%;
          max-width: 1000px;
        }

        .database-type-section {
          margin-bottom: 20px;
        }

        .excel-section {
          background: linear-gradient(135deg, rgba(33, 115, 70, 0.05) 0%, rgba(33, 115, 70, 0.1) 100%);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(33, 115, 70, 0.2);
          margin-bottom: 20px;
        }

        .excel-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .connected-state {
          display: flex;
          justify-content: center;
        }

        .empty-state-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 32px 24px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          max-width: 500px;
          width: 100%;
        }

        .empty-state-icon {
          margin-bottom: 20px;
          padding: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        .empty-state-content h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .empty-state-content p {
          margin: 0 0 24px 0;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
          max-width: 400px;
        }

        .import-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #0052FF 0%, #00D4AA 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 6px 16px rgba(0, 82, 255, 0.3);
        }

        .import-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(0, 82, 255, 0.4);
        }

        .import-button:active {
          transform: translateY(0);
        } 255, 0.2);
          max-width: 500px;
          width: 100%;
        }

        .empty-state-icon {
          margin-bottom: 24px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }

        .empty-state-content h3 {
          margin: 0 0 12px 0;
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .empty-state-content p {
          margin: 0 0 32px 0;
          font-size: 16px;
          color: #6b7280;
          line-height: 1.6;
          max-width: 400px;
        }

        .import-button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 32px;
          background: linear-gradient(135deg, #0052FF 0%, #00D4AA 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 24px rgba(0, 82, 255, 0.3);
        }

        .import-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0, 82, 255, 0.4);
        }

        .import-button:active {
          transform: translateY(0);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .aesthetic-database-page {
            padding: 12px;
          }

          .form-card, .empty-state-card {
            padding: 20px;
          }

          .success-banner {
            padding: 12px 16px;
          }

          .empty-state-content h3 {
            font-size: 18px;
          }

          .empty-state-content p {
            font-size: 13px;
          }

          .import-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Database;