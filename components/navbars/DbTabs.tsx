import React from 'react';

interface DbTabsProps {
  selectedId: string;
  onSelect: (id: string) => void;
  selectedDatabaseType?: string;
  onAddDatabase?: () => void;
  connectedDatabases?: string[];
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
    
    // Map database types to display names and colors
    const databaseConfig: Record<string, { name: string; icon: string; color: string; bgColor: string }> = {
      'postgresql': { name: 'PostgreSQL', icon: '🐘', color: '#336791', bgColor: '#E8F4FD' },
      'mysql': { name: 'MySQL', icon: '🐬', color: '#4479A1', bgColor: '#E3F2FD' },
      'oracle': { name: 'Oracle', icon: '🏛️', color: '#F80000', bgColor: '#FFEBEE' },
      'excel': { name: 'Excel', icon: '📊', color: '#217346', bgColor: '#E8F5E8' },
      'sap': { name: 'SAP HANA', icon: '💎', color: '#0F7BFF', bgColor: '#E3F2FD' },
      'google': { name: 'Google Cloud', icon: '☁️', color: '#4285F4', bgColor: '#E8F0FE' },
      'azure': { name: 'Azure SQL', icon: '☁️', color: '#0078D4', bgColor: '#E1F5FE' },
      'mariadb': { name: 'MariaDB', icon: '🗄️', color: '#003545', bgColor: '#E0F2F1' }
    };

    if (connectedDatabases.length > 0) {
      connectedDatabases.forEach((dbType, index) => {
        const config = databaseConfig[dbType];
        if (config) {
          tabs.push({
            id: `db-${dbType}-${index}`,
            title: config.name,
            type: 'database',
            dbType: dbType,
            icon: config.icon,
            color: config.color,
            bgColor: config.bgColor
          });
        }
      });
    }

    // Add the current selected database if it's not connected yet
    if (selectedDatabaseType && !connectedDatabases.includes(selectedDatabaseType)) {
      const config = databaseConfig[selectedDatabaseType];
      if (config) {
        tabs.push({
          id: `db-${selectedDatabaseType}-current`,
          title: config.name,
          type: 'current',
          dbType: selectedDatabaseType,
          icon: config.icon,
          color: config.color,
          bgColor: config.bgColor
        });
      }
    }

    // Default tab when no database is selected
    if (tabs.length === 0) {
      tabs.push({
        id: 'add-database',
        title: 'Database',
        type: 'default',
        icon: '🗄️',
        color: '#666',
        bgColor: '#F5F5F5'
      });
    }

    return tabs;
  };

  const dbTabs = getDbTabs();

  return (
    <div className="elegant-db-tabs">
      {/* Database Tabs */}
      <div className="db-tabs-list">
        {dbTabs.map(tab => (
          <div
            key={tab.id}
            className={`db-tab-item ${selectedId === tab.id ? 'active' : ''} ${tab.type}`}
            onClick={() => onSelect(tab.id)}
            style={{
              '--tab-color': tab.color,
              '--tab-bg-color': tab.bgColor
            } as React.CSSProperties}
          >
            <div className="tab-icon">{tab.icon}</div>
            <div className="tab-content">
              <span className="tab-title">{tab.title}</span>
              <div className="tab-status">
                {tab.type === 'database' && (
                  <>
                    <div className="status-dot connected"></div>
                    <span className="status-text">Connected</span>
                  </>
                )}
                {tab.type === 'current' && (
                  <>
                    <div className="status-dot pending"></div>
                    <span className="status-text">Configuring</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Active indicator */}
            {selectedId === tab.id && <div className="active-indicator"></div>}
          </div>
        ))}
      </div>
      
      {/* Add Database Button */}
      <div 
        className="add-database-button"
        onClick={onAddDatabase}
        title="Connect to a new database"
      >
        <div className="add-icon">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="add-text">Add Connection</span>
      </div>

      <style jsx>{`
        .elegant-db-tabs {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 8px 0;
        }

        .db-tabs-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .db-tab-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          background: var(--tab-bg-color, #F8F9FA);
          border: 1px solid rgba(0, 0, 0, 0.06);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 44px;
        }

        .db-tab-item:hover {
          border-color: var(--tab-color, #0052FF);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.8);
        }

        .db-tab-item.active {
          border-color: var(--tab-color, #0052FF);
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.12);
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
        }

        .db-tab-item.current {
          border: 1px dashed var(--tab-color, #0052FF);
          background: rgba(255, 255, 255, 0.7);
        }

        .tab-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          font-size: 14px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          flex-shrink: 0;
        }

        .tab-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .tab-title {
          font-weight: 600;
          font-size: 13px;
          color: var(--tab-color, #374151);
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tab-status {
          display: flex;
          align-items: center;
          gap: 4px;
          min-height: 14px;
        }

        .status-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .status-dot.connected {
          background: #10B981;
          box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.3);
        }

        .status-dot.pending {
          background: #F59E0B;
          box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.3);
          animation: pulse 2s infinite;
        }

        .status-text {
          font-size: 10px;
          font-weight: 500;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .active-indicator {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 16px;
          background: var(--tab-color, #0052FF);
          border-radius: 1px;
          opacity: 0.8;
        }

        .add-database-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px dashed #CBD5E1;
          border-radius: 8px;
          background: #F8FAFC;
          color: #64748B;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 4px;
          min-height: 36px;
        }

        .add-database-button:hover {
          border-color: #0052FF;
          background: #F1F5F9;
          color: #0052FF;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0, 82, 255, 0.1);
        }

        .add-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 4px;
          background: rgba(100, 116, 139, 0.1);
          flex-shrink: 0;
        }

        .add-database-button:hover .add-icon {
          background: rgba(0, 82, 255, 0.1);
        }

        .add-text {
          font-weight: 500;
          font-size: 12px;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .db-tab-item {
            padding: 8px 10px;
            min-height: 40px;
          }
          
          .tab-icon {
            width: 20px;
            height: 20px;
            font-size: 12px;
          }
          
          .tab-title {
            font-size: 12px;
          }

          .status-text {
            font-size: 9px;
          }
        }
      `}</style>
    </div>
  );
};

export default DbTabs;