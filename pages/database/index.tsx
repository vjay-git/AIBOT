import React, { useState, useEffect } from 'react';
import { fetchDatabaseData } from '../../utils/apiMocks';
import { DatabaseType, DatabaseTableRow, AlignmentRow } from '../../types';
import DatabaseHeader from '../../components/Database/DatabaseHeader';
import DatabaseTypeSelect from '../../components/Database/DatabaseTypeSelect';
import FileUploader from '../../components/Database/FileUploader';
import SheetSelector from '../../components/Database/SheetSelector';
import ConnectionFields from '../../components/Database/ConnectionFields';
import DatabaseTable from '../../components/Database/DatabaseTable';
import AlignView from '../../components/Database/AlignView';

// Subnav items for database
export const databaseTabs = [
  { id: 'database-1', title: 'Database 1' },
];

const Database = () => {
  // State variables
  const [activeTab, setActiveTab] = useState<'database' | 'align'>('database');
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<DatabaseTableRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedDatabaseType, setSelectedDatabaseType] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [alignmentData, setAlignmentData] = useState<AlignmentRow[]>([]);

  // Load database data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchDatabaseData();
        
        // Transform the data into the format we need with unique IDs
        const formattedData = data.tables.map((table, index) => ({
          id: `table-${index}`,
          name: table.name,
          inputFolder: table.inputFolder,
          processedFolder: table.processedFolder,
        }));
        
        setTableData(formattedData);
        
        // Mock alignment data
        const mockAlignmentData: AlignmentRow[] = [
          { id: 'align-1', aiTable: 'GL_Accounts', aiField1: 'GL_Company_code', aiField2: 'GL_Company_code', systemDefaultValue: '100' },
          { id: 'align-2', aiTable: 'Phoenix Baker', aiField1: 'GL_Account_number', aiField2: 'GL_Account_number', systemDefaultValue: '200' },
          { id: 'align-3', aiTable: 'Lana Steiner', aiField1: 'GL_Account_name', aiField2: 'GL_Account_name', systemDefaultValue: '300' },
          { id: 'align-4', aiTable: 'Demi Wilkinson', aiField1: 'GL_Account_type', aiField2: 'GL_Account_type', systemDefaultValue: '400' },
          { id: 'align-5', aiTable: 'Candice Wu', aiField1: 'GL_Account_balance', aiField2: 'GL_Currency_code', systemDefaultValue: '500' },
          { id: 'align-6', aiTable: 'Natali Craig', aiField1: 'GL_Account_currency', aiField2: 'GL_Balance', systemDefaultValue: '600' },
          { id: 'align-7', aiTable: 'Drew Cano', aiField1: 'GL_Account_status', aiField2: 'GL_Opening_balance', systemDefaultValue: '700' },
          { id: 'align-8', aiTable: 'Orlando Diggs', aiField1: 'GL_Account_open_date', aiField2: 'GL_Closing_balance', systemDefaultValue: '800' },
        ];
        setAlignmentData(mockAlignmentData);
        
        // Simulate available sheets if Excel is selected
        setAvailableSheets(['Sheet-1', 'Sheet-2', 'Sheet-3']);
      } catch (error) {
        console.error('Error loading database data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Handle database type selection
  const handleDatabaseTypeSelect = (type: string) => {
    setSelectedDatabaseType(type);
    console.log(`Selected database type: ${type}`);
    // TODO: In a real app, load the appropriate connection options based on the type
  };

  // Handle file upload
  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    console.log(`Uploaded file: ${file.name}`);
    // TODO: In a real app, parse the Excel file and extract the sheets
  };

  // Handle sheet selection
  const handleSheetSelect = (sheet: string) => {
    setSelectedSheet(sheet);
    console.log(`Selected sheet: ${sheet}`);
    // TODO: In a real app, load the sheet data
  };

  // Handle database connection
  const handleConnect = (columnMapping: string, processedFolder: string) => {
    console.log(`Connecting with column mapping: ${columnMapping}, processed folder: ${processedFolder}`);
    // TODO: In a real app, establish the database connection
  };

  // Table row selection
  const handleRowSelect = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedRows([...selectedRows, id]);
    } else {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    }
  };

  // Edit table row
  const handleEditRow = (id: string) => {
    console.log(`Editing row with ID: ${id}`);
    // TODO: Implement edit functionality
  };

  // Delete table row
  const handleDeleteRow = (id: string) => {
    console.log(`Deleting row with ID: ${id}`);
    setTableData(tableData.filter(row => row.id !== id));
  };

  // Copy alignment row
  const handleCopyAlignmentRow = (id: string) => {
    console.log(`Copying alignment row with ID: ${id}`);
    // TODO: Implement copy functionality
  };

  // Options for alignment row
  const handleAlignmentRowOptions = (id: string) => {
    console.log(`Options for alignment row with ID: ${id}`);
    // TODO: Implement options menu
  };

  if (loading) {
    return <div className="loading">Loading database data...</div>;
  }

  return (
    <div className="database-page">
      <DatabaseHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'database' ? (
        <>
          <DatabaseTypeSelect onSelectType={handleDatabaseTypeSelect} />
          
          {selectedDatabaseType === 'excel' && (
            <>
              <FileUploader onFileSelected={handleFileUpload} />
              <SheetSelector sheets={availableSheets} onSelectSheet={handleSheetSelect} />
            </>
          )}

          <ConnectionFields onConnect={handleConnect} />
          
          <DatabaseTable 
            data={tableData} 
            onEdit={handleEditRow} 
            onDelete={handleDeleteRow} 
            onSelectRow={handleRowSelect}
            selectedRows={selectedRows}
          />
        </>
      ) : (
        <AlignView 
          data={alignmentData} 
          onCopy={handleCopyAlignmentRow} 
          onOptions={handleAlignmentRowOptions} 
        />
      )}
    </div>
  );
};

export default Database;