import React, { useState } from 'react';
import SchemaTabs from 'components/navbars/SchemaTabs';
import SchemaPage from './index';

const MLTrainingPage: React.FC = () => {
  // State to manage table selection
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [aiTables, setAiTables] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');

  // Handle table selection from Schema Tabs
  const handleTableSelect = (table: string) => {
    console.log('🎯 Parent: Table selected:', table);
    setSelectedTable(table);
  };

  // Handle when AI tables are loaded
  const handleTablesLoad = (tables: string[]) => {
    console.log('📋 Parent: Tables loaded:', tables);
    setAiTables(tables);
  };

  // Handle selection changes in Schema Tabs (for modal/details)
  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  return (
    <div className="ml-training-container">
      {/* Left Sidebar - Schema Tabs */}
      <div className="sidebar">
        <SchemaTabs
          selectedId={selectedId}
          onSelect={handleSelect}
          onTableSelect={handleTableSelect}
          onTablesLoad={handleTablesLoad}
        />
      </div>

      {/* Main Content - Schema Page */}
      <div className="main-content">
        <SchemaPage
          selectedTable={selectedTable}
          aiTables={aiTables}
        />
      </div>
    </div>
  );
};

export default MLTrainingPage;