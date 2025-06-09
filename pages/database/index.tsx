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
                type: selectedDatabaseType, // Ensure type is set
                name: getDisplayName(selectedDatabaseType), // Ensure name is updated
                connectionDetails: {
                  processedFolder,
                  databaseType: selectedDatabaseType,
                  ...(selectedDatabaseType === 'postgresql' && {
                    // Connection details would be saved here
                  })
                },
                tables: [] // Start with empty tables - user will add their own
              }
            : session
        ));
        
        setIsConnectionSuccessful(true);
        updateDatabaseTabs();
      }
      
      setLoading(false);
    }, 2000); // 2 second simulation
  };

  // Get current session
  const getCurrentSession = () => {
    return databaseSessions.find(session => session.id === activeSessionId);
  };

  // Handle table operations (for future use)
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
    // Implementation for row selection
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
      <div className="loading" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #0052FF',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Connecting to {getDisplayName(selectedDatabaseType)}...
        </p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div className="database-page">
      <DatabaseHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'database' ? (
        <>
          {/* Show connection success message */}
          {isConnectionSuccessful && currentSession?.isConnected && (
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #0052FF',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                backgroundColor: '#0052FF',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.5 4.5L6 12L2.5 8.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1A1A1A' }}>
                  Successfully Connected to {getDisplayName(selectedDatabaseType)}
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  Your database connection is active. You can now start working with your data.
                </p>
              </div>
            </div>
          )}

          {/* Show connection form only if not connected */}
          {!currentSession?.isConnected && (
            <>
              <DatabaseTypeSelect onSelectType={handleDatabaseTypeSelect} />
              
              {selectedDatabaseType === 'excel' && (
                <>
                  <FileUploader onFileSelected={handleFileUpload} />
                  <SheetSelector sheets={availableSheets} onSelectSheet={handleSheetSelect} />
                </>
              )}

              <ConnectionFields 
                onConnect={handleConnect} 
                selectedDatabaseType={selectedDatabaseType}
              />
            </>
          )}

          {/* Show empty state for tables when connected */}
          {currentSession?.isConnected && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              border: '1px solid #E0E0E0'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#F8F9FB',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6h18M3 12h18M9 18h12" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#1A1A1A' }}>
                No Tables Yet
              </h3>
              <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#666', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                Your {getDisplayName(selectedDatabaseType)} database is connected successfully. 
                Start by importing your tables or creating new ones to begin working with your data.
              </p>
              <button style={{
                backgroundColor: '#0052FF',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '0 auto'
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 3.33333V12.6667M3.33333 8H12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Import Tables
              </button>
            </div>
          )}

          {/* Show tables if any exist */}
          {currentSession?.tables && currentSession.tables.length > 0 && (
            <DatabaseTable 
              data={currentSession.tables} 
              onEdit={handleEditRow} 
              onDelete={handleDeleteRow} 
              onSelectRow={handleRowSelect}
              selectedRows={[]}
            />
          )}
        </>
      ) : (
        <AlignView 
          onCopy={handleCopyAlignmentRow} 
          onOptions={handleAlignmentRowOptions} 
        />
      )}
    </div>
  );
};

export default Database;