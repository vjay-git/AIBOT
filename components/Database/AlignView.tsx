import React, { useState, useEffect, useMemo } from 'react';

// Types based on your API responses
interface MappingOption {
  id: string;
  label: string;
  filename: string;
}

interface BaseRecord {
  id?: number;
  schema: string;
}

interface TableMappingRecord extends BaseRecord {
  ai_table: string;
  db_table: string;
  description?: string;
}

interface FieldMappingRecord extends BaseRecord {
  ai_field: string;
  ai_field_format?: string;
  db_field: string;
  db_table: string;
}

interface FieldValueMappingRecord extends BaseRecord {
  ai_value: string;
  db_field: string;
  db_table: string;
  db_value: string;
}

interface WordSubstitutionRecord extends BaseRecord {
  new_value: string;
  old_value: string;
}

interface FormattingRulesRecord extends BaseRecord {
  id: number;
  column_pattern: string;
  format: string | null;
  rounding_precision: number | null;
}

interface PossibleValuesRecord extends BaseRecord {
  possible_values: string;
  'table-field': string;
}

interface DefaultsRecord extends BaseRecord {
  user?: string;
  ai_table: string;
  ai_field: string;
  user_default_value?: string;
}

interface DefaultsSystemRecord extends BaseRecord {
  ai_table: string;
  ai_field: string;
  system_default_value: string;
}

interface DefaultsEntityRecord extends BaseRecord {
  ai_field: string;
  ai_table: string;
  entity: string;
  entity_default_value: number;
}

type MappingRecord = TableMappingRecord | FieldMappingRecord | FieldValueMappingRecord | 
                    WordSubstitutionRecord | FormattingRulesRecord | PossibleValuesRecord |
                    DefaultsRecord | DefaultsSystemRecord | DefaultsEntityRecord;

interface EditingCell {
  rowIndex: number;
  columnKey: string;
  value: string;
}

interface AlignViewProps {
  onCopy?: (id: string) => void;
  onOptions?: (id: string) => void;
}

const FunctionalAlignView: React.FC<AlignViewProps> = ({ onCopy, onOptions }) => {
  // Constants
  const COMPANY_CONFIG_ID = '4fa74802-6abb-4b65-880e-ac36a9dd1f6a';
  const BASE_URL = 'http://20.204.162.66:5002/data_normalization';

  // State
  const [mappingOptions, setMappingOptions] = useState<MappingOption[]>([]);
  const [selectedMapping, setSelectedMapping] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [data, setData] = useState<MappingRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createFormData, setCreateFormData] = useState<Record<string, any>>({});
  const [updating, setUpdating] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);

  // Mapping configuration
  const mappingConfig: Record<string, MappingOption> = {
    'table_mapping': { id: 'table_mapping', label: 'Table Mapping', filename: 'table_mapping' },
    'field_mapping': { id: 'field_mapping', label: 'Field Mapping', filename: 'field_mapping' },
    'field_value_mapping': { id: 'field_value_mapping', label: 'Field Value Mapping', filename: 'field_value_mapping' },
    'word_substitution': { id: 'word_substitution', label: 'Word Substitution', filename: 'word_substitution' },
    'formatting_rules': { id: 'formatting_rules', label: 'Formatting Rules', filename: 'formatting_rules' },
    'hide_columns_output': { id: 'hide_columns_output', label: 'Hide Columns Output', filename: 'hide_columns_output' },
    'possible_values': { id: 'possible_values', label: 'Possible Values', filename: 'possible_values' },
    'defaults': { id: 'defaults', label: 'Defaults', filename: 'defaults' },
    'defaults_system': { id: 'defaults_system', label: 'Defaults System', filename: 'defaults_system' },
    'defaults_entity': { id: 'defaults_entity', label: 'Defaults Entity', filename: 'defaults_entity' }
  };

  // Load mapping options on component mount
  useEffect(() => {
    const loadMappingOptions = async () => {
      try {
        const response = await fetch(`${BASE_URL}/${COMPANY_CONFIG_ID}/list_files`);
        if (!response.ok) throw new Error('Failed to fetch mapping options');
        
        const result = await response.json();
        const options = result['data settings']?.map((setting: string) => mappingConfig[setting]).filter(Boolean) || [];
        setMappingOptions(options);
        
        // Set default selection to defaults_system if available
        if (options.length > 0) {
          const defaultOption = options.find(opt => opt.id === 'defaults_system') || options[0];
          setSelectedMapping(defaultOption.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load mapping options');
        console.error('Error loading mapping options:', err);
      }
    };

    loadMappingOptions();
  }, []);

  // Load data when mapping selection changes
  useEffect(() => {
    if (!selectedMapping) return;
    loadMappingData();
  }, [selectedMapping]);

  const loadMappingData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BASE_URL}/${COMPANY_CONFIG_ID}/records?filename=${selectedMapping}`);
      if (!response.ok) throw new Error(`Failed to fetch ${selectedMapping} data`);
      
      const result = await response.json();
      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load ${selectedMapping} data`);
      console.error('Error loading mapping data:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    return data.filter((row) => {
      const searchLower = searchTerm.toLowerCase();
      return Object.values(row).some(value => 
        value && value.toString().toLowerCase().includes(searchLower)
      );
    });
  }, [data, searchTerm]);

  // Get column configuration based on mapping type
  const getColumnConfig = (mappingType: string) => {
    switch (mappingType) {
      case 'table_mapping':
        return [
          { key: 'db_table', label: 'DB Table', isDbColumn: true },
          { key: 'ai_table', label: 'AI Table', isDbColumn: false },
          { key: 'description', label: 'Description', isDbColumn: false }
        ];
      case 'field_mapping':
        return [
          { key: 'db_table', label: 'DB Table', isDbColumn: true },
          { key: 'db_field', label: 'DB Field', isDbColumn: true },
          { key: 'ai_field', label: 'AI Field', isDbColumn: false },
          { key: 'ai_field_format', label: 'Comments', isDbColumn: false }
        ];
      case 'field_value_mapping':
        return [
          { key: 'db_table', label: 'DB Table', isDbColumn: true },
          { key: 'db_field', label: 'DB Field', isDbColumn: true },
          { key: 'db_value', label: 'DB Value', isDbColumn: true },
          { key: 'ai_value', label: 'AI Value', isDbColumn: false }
        ];
      case 'word_substitution':
        return [
          { key: 'old_value', label: 'Old Value', isDbColumn: false },
          { key: 'new_value', label: 'New Value', isDbColumn: false }
        ];
      case 'formatting_rules':
        return [
          { key: 'id', label: 'ID', isDbColumn: false },
          { key: 'column_pattern', label: 'Column Pattern', isDbColumn: false },
          { key: 'format', label: 'Format', isDbColumn: false },
          { key: 'rounding_precision', label: 'Rounding Precision', isDbColumn: false }
        ];
      case 'possible_values':
        return [
          { key: 'table-field', label: 'Table-Field', isDbColumn: false },
          { key: 'possible_values', label: 'Possible Values', isDbColumn: false }
        ];
      case 'defaults':
        return [
          { key: 'user', label: 'User', isDbColumn: false },
          { key: 'ai_table', label: 'AI Table', isDbColumn: false },
          { key: 'ai_field', label: 'AI Field', isDbColumn: false },
          { key: 'user_default_value', label: 'User Default Value', isDbColumn: false }
        ];
      case 'defaults_system':
        return [
          { key: 'ai_table', label: 'AI Table', isDbColumn: false },
          { key: 'ai_field', label: 'AI Field', isDbColumn: false },
          { key: 'system_default_value', label: 'System Default Value', isDbColumn: false }
        ];
      case 'defaults_entity':
        return [
          { key: 'ai_table', label: 'AI Table', isDbColumn: false },
          { key: 'ai_field', label: 'AI Field', isDbColumn: false },
          { key: 'entity', label: 'Entity', isDbColumn: false },
          { key: 'entity_default_value', label: 'Entity Default Value', isDbColumn: false }
        ];
      case 'hide_columns_output':
        return []; // Empty array for hide_columns_output
      default:
        return [];
    }
  };

  const columns = getColumnConfig(selectedMapping);

  // Update record API call
  const updateRecord = async (row: MappingRecord, columnKey: string, newValue: string) => {
    setUpdating(true);
    try {
      // Create filter_fields with all current row data (excluding schema)
      const filterFields = Object.keys(row)
        .filter(key => key !== 'schema')
        .reduce((acc, key) => {
          acc[key] = row[key as keyof MappingRecord];
          return acc;
        }, {} as Record<string, any>);

      // Create update_fields with only the changed AI field
      const updateFields = { [columnKey]: newValue };

      const response = await fetch(`${BASE_URL}/${COMPANY_CONFIG_ID}/records?filename=${selectedMapping}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filter_fields: filterFields,
          update_fields: updateFields
        })
      });

      if (!response.ok) throw new Error('Failed to update record');

      // Refresh data after successful update
      await loadMappingData();
      setEditingCell(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update record');
      console.error('Error updating record:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Create new record API call
  const createRecord = async () => {
    setCreating(true);
    try {
      // Use the first row as template if available
      const templateRow = data[0];
      if (!templateRow) {
        throw new Error('No template data available for creating new record');
      }

      // Create payload with template data + user inputs
      const payload = { ...templateRow };
      Object.keys(createFormData).forEach(key => {
        payload[key as keyof MappingRecord] = createFormData[key];
      });

      // Remove schema and id fields
      delete payload.schema;
      delete payload.id;

      const response = await fetch(`${BASE_URL}/${COMPANY_CONFIG_ID}/records?filename=${selectedMapping}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to create record');

      // Refresh data and close modal
      await loadMappingData();
      setShowCreateModal(false);
      setCreateFormData({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create record');
      console.error('Error creating record:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleMappingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMapping(e.target.value);
    setSearchTerm('');
    setEditingCell(null);
    setShowCreateModal(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCellClick = (rowIndex: number, columnKey: string, currentValue: string, isEditable: boolean) => {
    if (isEditable && !updating) {
      setEditingCell({ rowIndex, columnKey, value: currentValue });
    }
  };

  const handleCellEdit = (newValue: string) => {
    if (editingCell) {
      setEditingCell({ ...editingCell, value: newValue });
    }
  };

  const handleCellSave = async () => {
    if (editingCell && editingCell.value !== undefined) {
      const row = filteredData[editingCell.rowIndex];
      await updateRecord(row, editingCell.columnKey, editingCell.value);
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
  };

  const handleCreateClick = () => {
    setShowCreateModal(true);
    // Initialize form with empty values for AI columns
    const aiColumns = columns.filter(col => !col.isDbColumn);
    const initialData = aiColumns.reduce((acc, col) => {
      acc[col.key] = '';
      return acc;
    }, {} as Record<string, any>);
    setCreateFormData(initialData);
  };

  const handleCopy = (row: MappingRecord) => {
    const rowId = row.id?.toString() || Math.random().toString();
    onCopy?.(rowId);
    console.log('Copy row:', row);
  };

  const handleOptions = (row: MappingRecord) => {
    const rowId = row.id?.toString() || Math.random().toString();
    onOptions?.(rowId);
    console.log('Options for row:', row);
  };

  const selectedOption = mappingOptions.find(opt => opt.id === selectedMapping);
  const editableColumns = columns.filter(col => !col.isDbColumn);

  // Styles
  const containerStyle = { padding: '24px', backgroundColor: '#F8F9FB', minHeight: '100vh' };
  const controlsStyle = { marginBottom: '24px' };
  const labelStyle = { marginBottom: '8px', fontSize: '16px', fontWeight: '500', color: '#1A1A1A' };
  const selectStyle = {
    width: '100%',
    maxWidth: '260px',
    padding: '12px 16px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    fontSize: '16px',
    color: '#1A1A1A',
    appearance: 'none' as const
  };

  const resultsStyle = { 
    backgroundColor: '#FFFFFF', 
    borderRadius: '12px', 
    overflow: 'hidden', 
    boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1)' 
  };

  const headerStyle = { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: '16px 24px', 
    borderBottom: '1px solid #E5E9F5' 
  };

  const titleStyle = { 
    fontSize: '16px', 
    fontWeight: '600', 
    color: '#1A1A1A', 
    display: 'flex', 
    alignItems: 'center' 
  };

  const countStyle = { 
    fontSize: '14px', 
    fontWeight: '400', 
    color: '#4D9E3F', 
    backgroundColor: '#E9F7E5', 
    padding: '4px 8px', 
    borderRadius: '16px', 
    marginLeft: '12px' 
  };

  const createButtonStyle = { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    padding: '8px 16px', 
    backgroundColor: '#0052FF', 
    border: 'none', 
    borderRadius: '8px', 
    color: '#FFFFFF', 
    fontSize: '14px', 
    fontWeight: '500', 
    cursor: 'pointer' 
  };

  const searchContainerStyle = { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '16px', 
    padding: '16px 24px', 
    borderBottom: '1px solid #E5E9F5' 
  };

  const searchInputContainerStyle = { 
    position: 'relative' as const, 
    flex: '1', 
    maxWidth: '300px' 
  };

  const searchIconStyle = { 
    position: 'absolute' as const, 
    left: '12px', 
    top: '50%', 
    transform: 'translateY(-50%)', 
    color: '#666666' 
  };

  const searchInputStyle = { 
    width: '100%', 
    padding: '10px 16px 10px 40px', 
    border: '1px solid #E0E0E0', 
    borderRadius: '8px', 
    fontSize: '14px', 
    color: '#1A1A1A' 
  };

  const filterButtonStyle = { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    padding: '10px 16px', 
    backgroundColor: '#FFFFFF', 
    border: '1px solid #E0E0E0', 
    borderRadius: '8px', 
    fontSize: '14px', 
    color: '#1A1A1A', 
    cursor: 'pointer' 
  };

  const loadingStyle = { padding: '40px', textAlign: 'center' as const, color: '#666' };
  const errorStyle = { padding: '40px', textAlign: 'center' as const, color: '#dc2626', backgroundColor: '#fef2f2' };

  const emptyStateStyle = { 
    padding: '40px', 
    textAlign: 'center' as const, 
    color: '#666', 
    backgroundColor: '#F8F9FB' 
  };

  const tableHeaderStyle = { 
    display: 'flex', 
    alignItems: 'center', 
    padding: '12px 24px', 
    backgroundColor: '#F3F6FF', 
    borderBottom: '1px solid #E5E9F5' 
  };

  const checkboxCellStyle = { 
    width: '40px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  };

  const actionsCellStyle = { 
    width: '80px', 
    textAlign: 'center' as const, 
    fontSize: '14px', 
    fontWeight: '500', 
    color: '#666666' 
  };

  const tableBodyStyle = { maxHeight: '500px', overflowY: 'auto' as const };

  const modalOverlayStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const modalStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto' as const
  };

  return (
    <div style={containerStyle}>
      {/* Controls Section */}
      <div style={controlsStyle}>
        <div style={labelStyle}>Select Mapping</div>
        <select value={selectedMapping} onChange={handleMappingChange} style={selectStyle}>
          <option value="">Select Mapping</option>
          {mappingOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results Section */}
      <div style={resultsStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={titleStyle}>
            {selectedOption?.label || 'No Mapping Selected'}
            <span style={countStyle}>
              {filteredData.length} Results Found
            </span>
          </div>
          <button 
            style={createButtonStyle}
            onClick={handleCreateClick}
            disabled={!selectedMapping || selectedMapping === 'hide_columns_output' || creating}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3.33331V12.6666" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.33301 8H12.6663" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>

        {/* Search and Filters */}
        <div style={searchContainerStyle}>
          <div style={searchInputContainerStyle}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={searchIconStyle}>
              <path d="M14 14L10 10M11.3333 6.66667C11.3333 9.244 9.244 11.3333 6.66667 11.3333C4.08934 11.3333 2 9.244 2 6.66667C2 4.08934 4.08934 2 6.66667 2C9.244 2 11.3333 4.08934 11.3333 6.66667Z" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search" 
              value={searchTerm}
              onChange={handleSearchChange}
              style={searchInputStyle}
            />
          </div>
          <button style={filterButtonStyle}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.66699 4H13.3337" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 8H12" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.66699 12H9.33366" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Filters
          </button>
        </div>

        {/* Loading State */}
        {loading && <div style={loadingStyle}>Loading {selectedOption?.label || 'data'}...</div>}

        {/* Error State */}
        {error && <div style={errorStyle}>{error}</div>}

        {/* Table */}
        {!loading && !error && selectedMapping && (
          <div style={{ width: '100%' }}>
            {/* Show special message for hide_columns_output */}
            {selectedMapping === 'hide_columns_output' ? (
              <div style={emptyStateStyle}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto 16px', display: 'block' }}>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#666" strokeWidth="2" fill="none"/>
                  <circle cx="12" cy="12" r="3" stroke="#666" strokeWidth="2" fill="none"/>
                  <path d="M21 3L3 21" stroke="#666" strokeWidth="2"/>
                </svg>
                <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>Hide Columns Output</div>
                <div style={{ fontSize: '14px', color: '#888' }}>No columns configured to be hidden</div>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div style={tableHeaderStyle}>
                  <div style={checkboxCellStyle}>
                    <input type="checkbox" style={{ margin: 0 }} />
                  </div>
                  {columns.map((column) => {
                    const headerCellStyle = { 
                      flex: 1, 
                      padding: '0 8px', 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: column.isDbColumn ? '#4A5568' : '#666666',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    };
                    
                    return (
                      <div key={column.key} style={headerCellStyle}>
                        {column.label}
                        {column.isDbColumn && (
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" title="Read-only database column">
                            <path d="M8 1L10.5 6H5.5L8 1Z" fill="#4A5568"/>
                            <rect x="6" y="6" width="4" height="8" fill="#4A5568"/>
                          </svg>
                        )}
                        {!column.isDbColumn && (
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" title="Editable AI column">
                            <path d="M11.013 2.154a1.2 1.2 0 0 1 1.697 1.697l-8.013 8.013a1 1 0 0 1-.447.263l-2.5.5a.5.5 0 0 1-.607-.607l.5-2.5a1 1 0 0 1 .263-.447l8.013-8.013z" fill="#0052FF"/>
                          </svg>
                        )}
                      </div>
                    );
                  })}
                  <div style={actionsCellStyle}>Actions</div>
                </div>

                {/* Table Body */}
                <div style={tableBodyStyle}>
                  {filteredData.length === 0 ? (
                    <div style={loadingStyle}>No data found</div>
                  ) : (
                    filteredData.map((row, index) => {
                      const rowStyle = { 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '12px 24px', 
                        borderBottom: '1px solid #E5E9F5', 
                        transition: 'background-color 0.2s ease' 
                      };
                      
                      const actionsStyle = { 
                        width: '80px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '8px' 
                      };
                      
                      const buttonStyle = { 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        width: '32px', 
                        height: '32px', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        borderRadius: '4px', 
                        transition: 'background-color 0.2s ease' 
                      };

                      return (
                        <div 
                          key={row.id || index} 
                          style={rowStyle}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8F9FB'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div style={checkboxCellStyle}>
                            <input type="checkbox" style={{ margin: 0 }} />
                          </div>
                          {columns.map((column) => {
                            const isEditing = editingCell?.rowIndex === index && editingCell?.columnKey === column.key;
                            const isEditable = !column.isDbColumn;
                            const currentValue = row[column.key as keyof MappingRecord]?.toString() || '';
                            
                            const cellStyle = { 
                              flex: 1, 
                              margin: '0 4px',
                              padding: column.isDbColumn ? '6px 10px' : '6px 8px',
                              fontSize: '14px', 
                              color: column.isDbColumn ? '#4A5568' : '#1A1A1A',
                              backgroundColor: column.isDbColumn ? '#F7FAFC' : (isEditable ? '#FEFEFE' : 'transparent'),
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap' as const,
                              borderRadius: column.isDbColumn ? '6px' : '4px',
                              fontStyle: column.isDbColumn ? 'italic' : 'normal',
                              border: column.isDbColumn ? '1px solid #E2E8F0' : (isEditable ? '1px solid #E0E0E0' : 'none'),
                              position: 'relative' as const,
                              cursor: isEditable ? 'pointer' : 'default'
                            };
                            
                            const badgeStyle = {
                              position: 'absolute' as const,
                              top: '2px',
                              right: '4px',
                              fontSize: '10px',
                              color: '#9CA3AF',
                              fontWeight: '500'
                            };

                            const editInputStyle = {
                              width: '100%',
                              padding: '4px 6px',
                              border: '2px solid #0052FF',
                              borderRadius: '4px',
                              fontSize: '14px',
                              color: '#1A1A1A',
                              backgroundColor: '#FFFFFF',
                              outline: 'none'
                            };

                            return (
                              <div key={column.key} style={cellStyle} onClick={() => handleCellClick(index, column.key, currentValue, isEditable)}>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editingCell.value}
                                    onChange={(e) => handleCellEdit(e.target.value)}
                                    onBlur={handleCellSave}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleCellSave();
                                      if (e.key === 'Escape') handleCellCancel();
                                    }}
                                    style={editInputStyle}
                                    autoFocus
                                    disabled={updating}
                                  />
                                ) : (
                                  <>
                                    {currentValue || '-'}
                                    {column.isDbColumn && <div style={badgeStyle}>DB</div>}
                                    {isEditable && (
                                      <div style={{
                                        position: 'absolute' as const,
                                        top: '2px',
                                        right: '4px',
                                        fontSize: '10px',
                                        color: '#0052FF',
                                        fontWeight: '500'
                                      }}>
                                        ✏️
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                          <div style={actionsStyle}>
                            <button 
                              onClick={() => handleCopy(row)}
                              style={buttonStyle}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F1F6'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              title="Copy row"
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13.3337 6H7.33366C6.59828 6 6.00033 6.59795 6.00033 7.33333V13.3333C6.00033 14.0687 6.59828 14.6667 7.33366 14.6667H13.3337C14.069 14.6667 14.667 14.0687 14.667 13.3333V7.33333C14.667 6.59795 14.069 6 13.3337 6Z" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M3.33366 10H2.66699C2.31337 10 1.97423 9.85953 1.72418 9.60948C1.47413 9.35943 1.33366 9.02029 1.33366 8.66667V2.66667C1.33366 2.31304 1.47413 1.9739 1.72418 1.72386C1.47423 1.47381 2.31337 1.33333 2.66699 1.33333H8.66699C9.02061 1.33333 9.35975 1.47381 9.6098 1.72386C9.85985 1.9739 10.0003 2.31304 10.0003 2.66667V3.33333" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleOptions(row)}
                              style={buttonStyle}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F1F6'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              title="More options"
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.00033 8.66667C8.36852 8.66667 8.66699 8.36819 8.66699 8C8.66699 7.63181 8.36852 7.33334 8.00033 7.33334C7.63214 7.33334 7.33366 7.63181 7.33366 8C7.33366 8.36819 7.63214 8.66667 8.00033 8.66667Z" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12.6663 8.66667C13.0345 8.66667 13.333 8.36819 13.333 8C13.333 7.63181 13.0345 7.33334 12.6663 7.33334C12.2981 7.33334 11.9997 7.63181 11.9997 8C11.9997 8.36819 12.2981 8.66667 12.6663 8.66667Z" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M3.33366 8.66667C3.70185 8.66667 4.00033 8.36819 4.00033 8C4.00033 7.63181 3.70185 7.33334 3.33366 7.33334C2.96547 7.33334 2.66699 7.63181 2.66699 8C2.66699 8.36819 2.96547 8.66667 3.33366 8.66667Z" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={modalOverlayStyle} onClick={() => setShowCreateModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#1A1A1A' }}>
                Create New {selectedOption?.label}
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                Fill in the AI fields to create a new record
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              {editableColumns.map((column) => (
                <div key={column.key} style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#1A1A1A' }}>
                    {column.label}
                  </label>
                  <input
                    type="text"
                    value={createFormData[column.key] || ''}
                    onChange={(e) => setCreateFormData({ ...createFormData, [column.key]: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #E0E0E0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#1A1A1A'
                    }}
                    placeholder={`Enter ${column.label.toLowerCase()}`}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  color: '#666666',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={createRecord}
                disabled={creating}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#0052FF',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  opacity: creating ? 0.7 : 1
                }}
              >
                {creating ? 'Creating...' : 'Create Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FunctionalAlignView;