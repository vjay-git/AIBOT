import React from 'react';

interface DatabaseHeaderProps {
  activeTab: 'database' | 'align';
  onTabChange: (tab: 'database' | 'align') => void;
}

const DatabaseHeader: React.FC<DatabaseHeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="database-header">
      <div className="tab-container">
        <button 
          className={`tab-button ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => onTabChange('database')}
        >
          Database
        </button>
        <button 
          className={`tab-button ${activeTab === 'align' ? 'active' : ''}`}
          onClick={() => onTabChange('align')}
        >
          Align
        </button>
      </div>
    </div>
  );
};

export default DatabaseHeader; 