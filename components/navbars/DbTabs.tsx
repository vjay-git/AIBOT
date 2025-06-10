import React from 'react';

interface DbTabsProps {
  selectedId: string;
  onSelect: (id: string) => void;
  selectedDatabaseType?: string;
  onAddDatabase?: () => void;
  connectedDatabases?: string[]; // NEW: Array of connected database types
}

const DbTabs: React.FC<DbTabsProps> = ({ 
  selectedId, 
  onSelect, 
  selectedDatabaseType,
  onAddDatabase,
  connectedDatabases = []
}) => {
  // Create dynamic tabs based on connected databases
  const getDbTabs = () => {
    const tabs = [];
    
    if (connectedDatabases.length > 0) {
      // Map database types to display names
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

      connectedDatabases.forEach((dbType, index) => {
        tabs.push({
          id: `db-${dbType}-${index}`,
          title: displayNames[dbType] || dbType,
          type: 'database',
          dbType: dbType
        });
      });
    } else {
      // Default tab when no database is connected
      tabs.push({
        id: 'add-database',
        title: 'Database',
        type: 'default'
      });
    }

    return tabs;
  };

  const dbTabs = getDbTabs();

  return (
    <div className="db-tables">
      {dbTabs.map(tab => (
        <div
          key={tab.id}
          className={`table-item ${selectedId === tab.id ? 'active' : ''}`}
          onClick={() => onSelect(tab.id)}
        >
          <span>{tab.title}</span>
          
          {/* Show database type icon for connected databases */}
          {tab.type === 'database' && (
            <div className="database-icon">
              {tab.dbType === 'postgresql' && '🟦'}
              {tab.dbType === 'mysql' && '🟦'}
              {tab.dbType === 'oracle' && '🔴'}
              {tab.dbType === 'excel' && '🟩'}
              {tab.dbType === 'sap' && '🟦'}
              {tab.dbType === 'google' && '🟨'}
              {tab.dbType === 'azure' && '🟦'}
              {tab.dbType === 'mariadb' && '🟦'}
            </div>
          )}
        </div>
      ))}
      
      {/* Add Database Button - Show when we have at least one connected database OR always show */}
      <div 
        className="table-item add-database-item"
        onClick={onAddDatabase}
        title="Connect to a new database"
        style={{
          borderTop: connectedDatabases.length > 0 ? '1px solid #E0E0E0' : 'none',
          marginTop: connectedDatabases.length > 0 ? '8px' : '0',
          paddingTop: connectedDatabases.length > 0 ? '12px' : '12px'
        }}
      >
        <div className="add-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 3.33333V12.6667M3.33333 8H12.6667" stroke="#0052FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span>{connectedDatabases.length > 0 ? 'Add Database' : 'Connect Database'}</span>
      </div>
    </div>
  );
};

export default DbTabs;