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

interface FieldOption {
  id: string;
  name: string;
  type: string;
}

interface AlignViewProps {
  onCopy?: (id: string) => void;
  onOptions?: (id: string) => void;
}

const ElegantAlignView: React.FC<AlignViewProps> = ({ onCopy, onOptions }) => {
  // Constants
  const COMPANY_CONFIG_ID = '4fa74802-6abb-4b65-880e-ac36a9dd1f6a';
  const BASE_URL = 'http://20.204.162.66:5001/data_normalization';

  // State
  const [mappingOptions, setMappingOptions] = useState<MappingOption[]>([]);
  const [selectedMapping, setSelectedMapping] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [data, setData] = useState<MappingRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [showProposeModal, setShowProposeModal] = useState<boolean>(false);
  const [proposeFormData, setProposeFormData] = useState<Record<string, any>>({});
  const [updating, setUpdating] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Enhanced field selection modal state (for field_mapping)
  const [showFieldSelectionModal, setShowFieldSelectionModal] = useState<boolean>(false);
  const [availableFields, setAvailableFields] = useState<FieldOption[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [customFieldName, setCustomFieldName] = useState<string>('');
  const [currentEditingRow, setCurrentEditingRow] = useState<MappingRecord | null>(null);
  const [loadingFields, setLoadingFields] = useState<boolean>(false);

  // Filter state
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<{
    showDbOnly: boolean;
    showAiOnly: boolean;
    showEmptyValues: boolean;
    hideEmptyValues: boolean;
  }>({
    showDbOnly: false,
    showAiOnly: false,
    showEmptyValues: false,
    hideEmptyValues: false
  });

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
        return [];
      default:
        return [];
    }
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

  // Filter data based on search term and active filters
  const filteredData = useMemo(() => {
    let filtered = data;

    // Get current columns for this mapping type
    const currentColumns = getColumnConfig(selectedMapping);

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((row) => {
        return Object.values(row).some(value => 
          value && value.toString().toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply empty value filters
    if (activeFilters.hideEmptyValues) {
      filtered = filtered.filter((row) => {
        return currentColumns.every(col => {
          const value = row[col.key as keyof MappingRecord];
          return value && value.toString().trim() !== '';
        });
      });
    }

    if (activeFilters.showEmptyValues) {
      filtered = filtered.filter((row) => {
        return currentColumns.some(col => {
          const value = row[col.key as keyof MappingRecord];
          return !value || value.toString().trim() === '';
        });
      });
    }

    return filtered;
  }, [data, searchTerm, activeFilters, selectedMapping]);

  const columns = getColumnConfig(selectedMapping);

  // Update record API call
  const updateRecord = async (row: MappingRecord, columnKey: string, newValue: string) => {
    setUpdating(true);
    try {
      const filterFields = Object.keys(row)
        .filter(key => key !== 'schema')
        .reduce((acc, key) => {
          acc[key] = row[key as keyof MappingRecord];
          return acc;
        }, {} as Record<string, any>);

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
      const payload = { ...proposeFormData };
      payload.schema = 'public';

      const response = await fetch(`${BASE_URL}/${COMPANY_CONFIG_ID}/records?filename=${selectedMapping}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to create record');

      await loadMappingData();
      setShowProposeModal(false);
      setProposeFormData({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create record');
      console.error('Error creating record:', err);
    } finally {
      setCreating(false);
    }
  };

  // Enhanced delete record to handle multiple related records if needed
  const deleteRecord = async (row: MappingRecord) => {
    if (!row.id) return;
    
    setDeleting(row.id.toString());
    try {
      // For field_mapping, you might want to show which related records will be affected
      if (selectedMapping === 'field_mapping') {
        const fieldRow = row as FieldMappingRecord;
        console.log(`Deleting field mapping: ${fieldRow.db_table}.${fieldRow.db_field} -> ${fieldRow.ai_field}`);
      }
      
      // Implement actual delete API call here
      const response = await fetch(`${BASE_URL}/${COMPANY_CONFIG_ID}/records?filename=${selectedMapping}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filter_fields: {
            id: row.id
          }
        })
      });

      if (!response.ok) throw new Error('Failed to delete record');
      
      await loadMappingData();
      setShowDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete record');
      console.error('Error deleting record:', err);
    } finally {
      setDeleting(null);
    }
  };

  // Load available fields for field selection (field_mapping only)
  const loadAvailableFields = async (row: FieldMappingRecord) => {
    setLoadingFields(true);
    try {
      const payload = {
        schema_name: row.schema || "public",
        db_table: row.db_table,
        db_field: row.db_field,
        ai_field: row.ai_field,
        ai_field_format: row.ai_field_format || "string"
      };

      const response = await fetch('http://20.204.162.66:5001/data_normalization/propose_ai_fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to fetch proposed AI fields');
      
      const result = await response.json();
      
      // Filter out current AI field from proposals to avoid duplicates
      const fields = result.proposals?.map((proposal: any, index: number) => ({
        id: `field-${index}`,
        name: proposal.ai_field_proposed,
        type: proposal.proposed_format || 'string'
      })).filter((field: FieldOption) => field.name !== row.ai_field) || [];
      
      setAvailableFields(fields);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load proposed AI fields');
      console.error('Error loading proposed AI fields:', err);
    } finally {
      setLoadingFields(false);
    }
  };

  // Enhanced field selection handlers
  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields(prev => {
      if (prev.includes(fieldId)) {
        // Remove field if already selected
        return prev.filter(id => id !== fieldId);
      } else {
        // Add field if not selected
        return [...prev, fieldId];
      }
    });
  };

  const handleCustomFieldChange = (value: string) => {
    setCustomFieldName(value);
    // Automatically select custom option when user types
    if (value.trim() && !selectedFields.includes('custom')) {
      setSelectedFields(prev => [...prev, 'custom']);
    }
    // Deselect custom option when field is cleared
    if (!value.trim() && selectedFields.includes('custom')) {
      setSelectedFields(prev => prev.filter(id => id !== 'custom'));
    }
  };

  const handleMappingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMapping(e.target.value);
    setSearchTerm('');
    setEditingCell(null);
    setShowProposeModal(false);
    setShowFieldSelectionModal(false);
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

  // Handle Propose button click
  const handlePropose = async (row: MappingRecord) => {
    if (selectedMapping === 'field_mapping') {
      setCurrentEditingRow(row);
      await loadAvailableFields(row as FieldMappingRecord);
      setShowFieldSelectionModal(true);
    } else {
      const formData = columns.reduce((acc, col) => {
        acc[col.key] = row[col.key as keyof MappingRecord]?.toString() || '';
        return acc;
      }, {} as Record<string, any>);
      setProposeFormData(formData);
      setShowProposeModal(true);
    }
  };

  // Enhanced field selection for field_mapping - creates new rows for each selected field
  const handleFieldSelection = async () => {
    if (!currentEditingRow || (selectedFields.length === 0 && !customFieldName.trim())) return;

    try {
      setUpdating(true);
      
      // Determine which fields to apply
      const fieldsToApply = [];
      
      // Add selected AI-proposed fields
      selectedFields.forEach(fieldId => {
        if (fieldId !== 'custom') {
          const selectedFieldData = availableFields.find(field => field.id === fieldId);
          if (selectedFieldData) {
            fieldsToApply.push({
              name: selectedFieldData.name,
              type: selectedFieldData.type,
              isCustom: false
            });
          }
        }
      });
      
      // Add custom field if specified
      if (selectedFields.includes('custom') && customFieldName.trim()) {
        fieldsToApply.push({
          name: customFieldName.trim(),
          type: 'custom',
          isCustom: true
        });
      } else if (!selectedFields.includes('custom') && customFieldName.trim()) {
        // Custom field entered but not explicitly selected
        fieldsToApply.push({
          name: customFieldName.trim(),
          type: 'custom',
          isCustom: true
        });
      }

      if (fieldsToApply.length === 0) return;

      // If only one field is selected, update the existing row
      if (fieldsToApply.length === 1) {
        await updateRecord(currentEditingRow, 'ai_field', fieldsToApply[0].name);
      } else {
        // Multiple fields: Update existing row with first field, create new rows for the rest
        const baseRowData = currentEditingRow as FieldMappingRecord;
        
        // Update the existing row with the first field
        await updateRecord(currentEditingRow, 'ai_field', fieldsToApply[0].name);
        
        // Create new rows for remaining fields
        for (let i = 1; i < fieldsToApply.length; i++) {
          const field = fieldsToApply[i];
          
          // Create new record with same DB table/field but different AI field
          const newRecordPayload = {
            schema: baseRowData.schema || 'public',
            db_table: baseRowData.db_table,
            db_field: baseRowData.db_field,
            ai_field: field.name,
            ai_field_format: baseRowData.ai_field_format || 'string'
          };

          const response = await fetch(`${BASE_URL}/${COMPANY_CONFIG_ID}/records?filename=${selectedMapping}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRecordPayload)
          });

          if (!response.ok) {
            console.error(`Failed to create record for field: ${field.name}`);
            // Continue with other fields even if one fails
            continue;
          }
        }
        
        // Reload the data to show all new rows
        await loadMappingData();
      }

      setShowFieldSelectionModal(false);
      setSelectedFields([]);
      setCustomFieldName('');
      setCurrentEditingRow(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update AI field(s)');
      console.error('Error updating AI field(s):', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (row: MappingRecord) => {
    setShowDeleteConfirm(row.id?.toString() || '');
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterChange = (filterKey: keyof typeof activeFilters) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      
      // Handle mutually exclusive filters
      if (filterKey === 'showEmptyValues' && !prev.showEmptyValues) {
        newFilters.hideEmptyValues = false;
      }
      if (filterKey === 'hideEmptyValues' && !prev.hideEmptyValues) {
        newFilters.showEmptyValues = false;
      }
      if (filterKey === 'showDbOnly' && !prev.showDbOnly) {
        newFilters.showAiOnly = false;
      }
      if (filterKey === 'showAiOnly' && !prev.showAiOnly) {
        newFilters.showDbOnly = false;
      }
      
      newFilters[filterKey] = !prev[filterKey];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setActiveFilters({
      showDbOnly: false,
      showAiOnly: false,
      showEmptyValues: false,
      hideEmptyValues: false
    });
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).filter(Boolean).length;
  };

  // Enhanced helper functions for new row logic
  const getRelatedFieldMappings = (row: FieldMappingRecord) => {
    if (selectedMapping !== 'field_mapping') return [];
    
    return filteredData.filter((r) => {
      const fieldRow = r as FieldMappingRecord;
      return fieldRow.db_table === row.db_table && 
             fieldRow.db_field === row.db_field &&
             fieldRow.id !== row.id; // Exclude current row
    });
  };

  const getModalDescription = () => {
    if (selectedMapping === 'field_mapping' && currentEditingRow) {
      const fieldRow = currentEditingRow as FieldMappingRecord;
      return `Choose multiple AI-proposed fields or create a custom field. Each selected field will create a new row with the same DB table (${fieldRow.db_table}) and DB field (${fieldRow.db_field}).`;
    }
    return "Choose multiple AI-proposed fields or create a custom field. Our AI has analyzed the database structure to suggest the most suitable options.";
  };

  const getSelectionSummary = () => {
    const selectedCount = selectedFields.length + (customFieldName.trim() && !selectedFields.includes('custom') ? 1 : 0);
    
    if (selectedCount === 0) return null;
    
    if (selectedCount === 1) {
      return "1 field selected - will update the current row";
    }
    
    return `${selectedCount} fields selected - will update current row and create ${selectedCount - 1} new row${selectedCount - 1 === 1 ? '' : 's'}`;
  };

  const getApplyButtonText = () => {
    const selectedCount = selectedFields.length + (customFieldName.trim() && !selectedFields.includes('custom') ? 1 : 0);
    
    if (updating) return 'Updating...';
    
    if (selectedCount === 0) return 'No Fields Selected';
    if (selectedCount === 1) return 'Update Current Row';
    
    return `Update + Create ${selectedCount - 1} New Row${selectedCount - 1 === 1 ? '' : 's'}`;
  };

  const selectedOption = mappingOptions.find(opt => opt.id === selectedMapping);

  return (
    <div className="align-view-elegant">
      <style jsx>{`
        .align-view-elegant {
          padding: 32px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        .elegant-controls {
          margin-bottom: 20px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 20px 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .elegant-label {
          font-size: 14px;
          font-weight: 600;
          color: #334155;
          letter-spacing: -0.025em;
          white-space: nowrap;
        }

        .elegant-select {
          flex: 1;
          max-width: 280px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.95);
          border: 2px solid rgba(0, 21, 118, 0.1);
          border-radius: 12px;
          font-size: 14px;
          color: #1e293b;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 7.5L10 12.5L15 7.5' stroke='%23001576' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        }

        .elegant-select:focus {
          outline: none;
          border-color: #001576;
          box-shadow: 0 0 0 3px rgba(0, 21, 118, 0.1), 0 4px 12px rgba(0, 0, 0, 0.06);
        }

        .elegant-results {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 64px rgba(0, 0, 0, 0.08), 0 8px 32px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .elegant-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 28px 32px;
          background: linear-gradient(135deg, #001576 0%, #002bb8 100%);
          color: white;
        }

        .elegant-title {
          font-size: 20px;
          font-weight: 700;
          display: flex;
          align-items: center;
          letter-spacing: -0.025em;
        }

        .elegant-count {
          font-size: 13px;
          font-weight: 500;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 6px 12px;
          border-radius: 20px;
          margin-left: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .elegant-search-container {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px 32px;
          background: rgba(248, 250, 252, 0.8);
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
        }

        .elegant-search-wrapper {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .elegant-search-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          z-index: 1;
        }

        .elegant-search-input {
          width: 100%;
          padding: 16px 20px 16px 50px;
          border: 2px solid rgba(226, 232, 240, 0.8);
          border-radius: 16px;
          font-size: 14px;
          color: #1e293b;
          background: rgba(255, 255, 255, 0.9);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .elegant-search-input:focus {
          outline: none;
          border-color: #001576;
          box-shadow: 0 0 0 4px rgba(0, 21, 118, 0.1), 0 4px 16px rgba(0, 0, 0, 0.08);
        }

        .elegant-filter-button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid rgba(226, 232, 240, 0.8);
          border-radius: 14px;
          font-size: 14px;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          position: relative;
        }

        .elegant-filter-button:hover {
          background: rgba(249, 250, 251, 0.95);
          border-color: #94a3b8;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }

        .elegant-filter-button.active {
          background: rgba(0, 21, 118, 0.1);
          border-color: #001576;
          color: #001576;
        }

        .elegant-filter-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: linear-gradient(135deg, #001576 0%, #002bb8 100%);
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0, 21, 118, 0.3);
        }

        .elegant-filters-panel {
          background: rgba(248, 250, 252, 0.95);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(226, 232, 240, 0.8);
          border-radius: 16px;
          padding: 20px;
          margin-top: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        }

        .elegant-filters-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .elegant-filters-title {
          font-size: 16px;
          font-weight: 600;
          color: #334155;
        }

        .elegant-clear-filters {
          background: none;
          border: none;
          color: #001576;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.2s ease;
        }

        .elegant-clear-filters:hover {
          background: rgba(0, 21, 118, 0.1);
        }

        .elegant-filter-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .elegant-filter-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.8);
          border: 2px solid rgba(226, 232, 240, 0.6);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .elegant-filter-option:hover {
          background: rgba(255, 255, 255, 0.95);
          border-color: #94a3b8;
        }

        .elegant-filter-option.active {
          background: rgba(0, 21, 118, 0.1);
          border-color: #001576;
          color: #001576;
        }

        .elegant-filter-checkbox {
          accent-color: #001576;
          transform: scale(1.1);
        }

        .elegant-filter-label {
          font-size: 14px;
          font-weight: 500;
          flex: 1;
        }

        .elegant-filter-description {
          font-size: 12px;
          color: #64748b;
          margin-left: 22px;
          margin-top: 2px;
        }

        .elegant-table-header {
          display: flex;
          align-items: center;
          padding: 20px 32px;
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
        }

        .elegant-table-body {
          max-height: 600px;
          overflow-y: auto;
        }

        .elegant-table-body::-webkit-scrollbar {
          width: 8px;
        }

        .elegant-table-body::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        .elegant-table-body::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #cbd5e1, #94a3b8);
          border-radius: 4px;
        }

        .elegant-table-row {
          display: flex;
          align-items: center;
          padding: 18px 32px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.4);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .elegant-table-row:hover {
          background: linear-gradient(135deg, rgba(0, 21, 118, 0.02) 0%, rgba(0, 43, 184, 0.03) 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
        }

        .elegant-cell {
          flex: 1;
          margin: 0 8px;
          padding: 12px 16px;
          font-size: 14px;
          border-radius: 12px;
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .elegant-cell.db-column {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          color: #475569;
          border: 2px solid rgba(148, 163, 184, 0.3);
          font-style: italic;
        }

        .elegant-cell.ai-column {
          background: linear-gradient(135deg, rgba(0, 21, 118, 0.08) 0%, rgba(0, 43, 184, 0.08) 100%);
          color: #1e293b;
          border: 2px solid rgba(0, 21, 118, 0.2);
          cursor: pointer;
        }

        .elegant-cell.ai-column:hover {
          background: linear-gradient(135deg, rgba(0, 21, 118, 0.12) 0%, rgba(0, 43, 184, 0.12) 100%);
          border-color: rgba(0, 21, 118, 0.4);
          transform: translateY(-1px);
        }

        .elegant-cell-badge {
          position: absolute;
          top: 4px;
          right: 8px;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
        }

        .elegant-cell-badge.db {
          color: #64748b;
          border: 1px solid rgba(100, 116, 139, 0.3);
        }

        .elegant-cell-badge.ai {
          color: #001576;
          border: 1px solid rgba(0, 21, 118, 0.3);
        }

        .elegant-related-indicator {
          position: absolute;
          top: 4px;
          left: 8px;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 6px;
          background: rgba(34, 197, 94, 0.1);
          color: #15803d;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .elegant-edit-input {
          width: 100%;
          padding: 8px 12px;
          border: 3px solid #001576;
          border-radius: 10px;
          font-size: 14px;
          color: #1e293b;
          background: rgba(255, 255, 255, 0.95);
          outline: none;
          box-shadow: 0 0 0 4px rgba(0, 21, 118, 0.1), 0 4px 16px rgba(0, 0, 0, 0.08);
        }

        .elegant-actions {
          width: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .elegant-action-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border: none;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .elegant-action-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .elegant-action-button:hover::before {
          opacity: 1;
        }

        .elegant-propose-button {
          background: linear-gradient(135deg, #001576 0%, #002bb8 100%);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 16px rgba(0, 21, 118, 0.3);
        }

        .elegant-propose-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 21, 118, 0.4);
        }

        .elegant-delete-button {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
        }

        .elegant-delete-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
        }

        .elegant-header-cell {
          flex: 1;
          padding: 0 12px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .elegant-header-cell.db-header {
          color: #64748b;
        }

        .elegant-header-cell.ai-header {
          color: #001576;
        }

        .elegant-actions-header {
          width: 140px;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .elegant-loading {
          padding: 60px;
          text-align: center;
          color: #64748b;
          font-size: 16px;
          background: linear-gradient(135deg, rgba(0, 21, 118, 0.05) 0%, rgba(0, 43, 184, 0.05) 100%);
        }

        .elegant-error {
          padding: 60px;
          text-align: center;
          color: #dc2626;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%);
          border-radius: 16px;
          margin: 20px;
          border: 2px solid rgba(239, 68, 68, 0.1);
        }

        .elegant-empty-state {
          padding: 80px 40px;
          text-align: center;
          color: #64748b;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .elegant-empty-icon {
          margin: 0 auto 24px;
          display: block;
          opacity: 0.6;
        }

        .elegant-empty-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #334155;
        }
          .elegant-empty-description {
          font-size: 14px;
          color: #64748b;
        }

        .elegant-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .elegant-modal {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 32px;
          max-width: 800px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 32px 64px rgba(0, 0, 0, 0.12), 0 16px 32px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: slideUp 0.3s ease;
        }

        .elegant-modal-header {
          margin-bottom: 24px;
        }

        .elegant-modal-title {
          margin: 0 0 8px 0;
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          letter-spacing: -0.025em;
        }

        .elegant-modal-description {
          margin: 0;
          font-size: 15px;
          color: #64748b;
          line-height: 1.5;
        }

        .elegant-form-group {
          margin-bottom: 20px;
        }

        .elegant-form-label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #334155;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .elegant-form-badge {
          font-size: 11px;
          font-weight: 500;
          padding: 3px 8px;
          border-radius: 8px;
        }

        .elegant-form-badge.db {
          color: #64748b;
          background: rgba(148, 163, 184, 0.15);
          border: 1px solid rgba(148, 163, 184, 0.3);
        }

        .elegant-form-badge.ai {
          color: #001576;
          background: rgba(0, 21, 118, 0.15);
          border: 1px solid rgba(0, 21, 118, 0.3);
        }

        .elegant-form-input {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid rgba(226, 232, 240, 0.8);
          border-radius: 12px;
          font-size: 14px;
          color: #1e293b;
          background: rgba(255, 255, 255, 0.9);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .elegant-form-input:focus {
          outline: none;
          border-color: #001576;
          box-shadow: 0 0 0 4px rgba(0, 21, 118, 0.1), 0 4px 16px rgba(0, 0, 0, 0.08);
        }

        .elegant-form-input.db-input {
          background: rgba(248, 250, 252, 0.9);
          border-color: rgba(148, 163, 184, 0.4);
        }

        .elegant-modal-actions {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
          margin-top: 32px;
        }

        .elegant-button {
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid transparent;
          position: relative;
          overflow: hidden;
        }

        .elegant-button-secondary {
          background: rgba(248, 250, 252, 0.9);
          color: #64748b;
          border-color: rgba(226, 232, 240, 0.8);
        }

        .elegant-button-secondary:hover {
          background: rgba(241, 245, 249, 0.95);
          border-color: #94a3b8;
          transform: translateY(-1px);
        }

        .elegant-button-primary {
          background: linear-gradient(135deg, #001576 0%, #002bb8 100%);
          color: white;
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 16px rgba(0, 21, 118, 0.3);
        }

        .elegant-button-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 21, 118, 0.4);
        }

        .elegant-button-danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
        }

        .elegant-button-danger:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
        }

        .elegant-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .elegant-field-selection {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          max-height: 400px;
          overflow-y: auto;
          padding: 16px;
          border: 2px solid rgba(226, 232, 240, 0.8);
          border-radius: 16px;
          background: rgba(248, 250, 252, 0.5);
        }

        .elegant-field-selection::-webkit-scrollbar {
          width: 8px;
        }

        .elegant-field-selection::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .elegant-field-selection::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #cbd5e1, #94a3b8);
          border-radius: 4px;
        }

        .elegant-field-option {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid rgba(226, 232, 240, 0.6);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          min-height: 80px;
        }

        .elegant-field-option:hover {
          background: rgba(255, 255, 255, 0.95);
          border-color: #94a3b8;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }

        .elegant-field-option.selected {
          background: linear-gradient(135deg, rgba(0, 21, 118, 0.1) 0%, rgba(0, 43, 184, 0.1) 100%);
          border-color: #001576;
          box-shadow: 0 4px 16px rgba(0, 21, 118, 0.15);
        }

        .elegant-field-option.custom-field {
          border: 2px dashed rgba(0, 21, 118, 0.3);
          background: linear-gradient(135deg, rgba(0, 21, 118, 0.02) 0%, rgba(0, 43, 184, 0.02) 100%);
        }

        .elegant-field-option.custom-field.selected {
          border: 2px dashed #001576;
          background: linear-gradient(135deg, rgba(0, 21, 118, 0.08) 0%, rgba(0, 43, 184, 0.08) 100%);
        }

        .elegant-field-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .elegant-checkbox {
          accent-color: #001576;
          transform: scale(1.2);
          cursor: pointer;
        }

        .elegant-field-info {
          flex: 1;
        }

        .elegant-field-name {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 2px;
          word-break: break-word;
        }

        .elegant-field-type {
          font-size: 11px;
          color: #64748b;
          font-style: italic;
        }

        .elegant-custom-input {
          width: 100%;
          padding: 6px 8px;
          border: 2px solid rgba(0, 21, 118, 0.2);
          border-radius: 8px;
          font-size: 12px;
          color: #1e293b;
          background: rgba(255, 255, 255, 0.9);
          transition: all 0.3s ease;
          margin-top: 4px;
        }

        .elegant-custom-input:focus {
          outline: none;
          border-color: #001576;
          box-shadow: 0 0 0 3px rgba(0, 21, 118, 0.1);
        }

        .elegant-custom-input::placeholder {
          color: #94a3b8;
          font-style: italic;
        }

        .elegant-selection-summary {
          margin-top: 16px;
          padding: 12px 16px;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(22, 163, 74, 0.08) 100%);
          border-radius: 12px;
          border: 2px solid rgba(34, 197, 94, 0.2);
        }

        .elegant-summary-title {
          font-size: 14px;
          font-weight: 600;
          color: #15803d;
          margin-bottom: 6px;
        }

        .elegant-summary-content {
          font-size: 13px;
          color: #166534;
          line-height: 1.4;
        }

        .elegant-check-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #001576 0%, #002bb8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 21, 118, 0.3);
        }

        .elegant-loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 40px;
          color: #64748b;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .elegant-delete-modal {
          max-width: 400px;
          text-align: center;
        }

        .elegant-delete-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          border: 2px solid rgba(239, 68, 68, 0.2);
        }
      `}</style>

      {/* Controls Section */}
      <div className="elegant-controls">
        <label className="elegant-label">Mapping Type:</label>
        <select value={selectedMapping} onChange={handleMappingChange} className="elegant-select">
          <option value="">Choose mapping...</option>
          {mappingOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results Section */}
      <div className="elegant-results">
        {/* Header */}
        <div className="elegant-header">
          <div className="elegant-title">
            {selectedOption?.label || 'No Mapping Selected'}
            <span className="elegant-count">
              {filteredData.length} {filteredData.length === 1 ? 'Result' : 'Results'} Found
            </span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="elegant-search-container">
          <div className="elegant-search-wrapper">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="elegant-search-icon">
              <path d="M17.5 17.5L12.5 12.5M14.1667 8.33333C14.1667 11.555 11.555 14.1667 8.33333 14.1667C5.11167 14.1667 2.5 11.555 2.5 8.33333C2.5 5.11167 5.11167 2.5 8.33333 2.5C11.555 2.5 14.1667 5.11167 14.1667 8.33333Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search across all fields..." 
              value={searchTerm}
              onChange={handleSearchChange}
              className="elegant-search-input"
            />
          </div>
          <button 
            className={`elegant-filter-button ${showFilters ? 'active' : ''}`}
            onClick={toggleFilters}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.33333 5H16.6667M5.83333 10H14.1667M8.33333 15H11.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Advanced Filters
            {getActiveFilterCount() > 0 && (
              <span className="elegant-filter-badge">{getActiveFilterCount()}</span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="elegant-filters-panel">
            <div className="elegant-filters-header">
              <h4 className="elegant-filters-title">Filter Options</h4>
              {getActiveFilterCount() > 0 && (
                <button onClick={clearAllFilters} className="elegant-clear-filters">
                  Clear All Filters
                </button>
              )}
            </div>
            
            <div className="elegant-filter-options">
              <div className={`elegant-filter-option ${activeFilters.hideEmptyValues ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={activeFilters.hideEmptyValues}
                  onChange={() => handleFilterChange('hideEmptyValues')}
                  className="elegant-filter-checkbox"
                />
                <div>
                  <div className="elegant-filter-label">Hide Empty Values</div>
                  <div className="elegant-filter-description">Show only rows with all fields filled</div>
                </div>
              </div>

              <div className={`elegant-filter-option ${activeFilters.showEmptyValues ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={activeFilters.showEmptyValues}
                  onChange={() => handleFilterChange('showEmptyValues')}
                  className="elegant-filter-checkbox"
                />
                <div>
                  <div className="elegant-filter-label">Show Only Empty Values</div>
                  <div className="elegant-filter-description">Show rows with missing data</div>
                </div>
              </div>

              {columns.some(col => col.isDbColumn) && columns.some(col => !col.isDbColumn) && (
                <>
                  <div className={`elegant-filter-option ${activeFilters.showDbOnly ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={activeFilters.showDbOnly}
                      onChange={() => handleFilterChange('showDbOnly')}
                      className="elegant-filter-checkbox"
                    />
                    <div>
                      <div className="elegant-filter-label">Focus on DB Fields</div>
                      <div className="elegant-filter-description">Highlight database columns</div>
                    </div>
                  </div>

                  <div className={`elegant-filter-option ${activeFilters.showAiOnly ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={activeFilters.showAiOnly}
                      onChange={() => handleFilterChange('showAiOnly')}
                      className="elegant-filter-checkbox"
                    />
                    <div>
                      <div className="elegant-filter-label">Focus on AI Fields</div>
                      <div className="elegant-filter-description">Highlight AI-editable columns</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="elegant-loading">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="spinner" style={{ marginBottom: '16px' }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Loading {selectedOption?.label || 'data'}...
          </div>
        )}

        {/* Error State */}
        {error && <div className="elegant-error">{error}</div>}

        {/* Table */}
        {!loading && !error && selectedMapping && (
          <div style={{ width: '100%' }}>
            {/* Show special message for hide_columns_output */}
            {selectedMapping === 'hide_columns_output' ? (
              <div className="elegant-empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="elegant-empty-icon">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M21 3L3 21" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <div className="elegant-empty-title">Hide Columns Output</div>
                <div className="elegant-empty-description">No columns are currently configured to be hidden from the output</div>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="elegant-table-header">
                  {columns.map((column) => (
                    <div key={column.key} className={`elegant-header-cell ${column.isDbColumn ? 'db-header' : 'ai-header'}`}>
                      {column.label}
                      {column.isDbColumn ? (
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" title="Read-only database column">
                          <path d="M4 4.5A2.5 2.5 0 016.5 2h7A2.5 2.5 0 0116 4.5v11a2.5 2.5 0 01-2.5 2.5h-7A2.5 2.5 0 014 15.5v-11z" fill="currentColor" opacity="0.2"/>
                          <path d="M6.5 2A2.5 2.5 0 004 4.5v11A2.5 2.5 0 006.5 18h7a2.5 2.5 0 002.5-2.5v-11A2.5 2.5 0 0013.5 2h-7zM5 4.5A1.5 1.5 0 016.5 3h7A1.5 1.5 0 0115 4.5v11a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 015 15.5v-11z" fill="currentColor"/>
                          <circle cx="10" cy="7" r="1" fill="currentColor"/>
                          <path d="M8 10h4M8 12h4" stroke="currentColor" strokeWidth="1"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" title="Editable AI column">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" fill="currentColor"/>
                        </svg>
                      )}
                    </div>
                  ))}
                  <div className="elegant-actions-header">Actions</div>
                </div>

                {/* Table Body */}
                <div className="elegant-table-body">
                  {filteredData.length === 0 ? (
                    <div className="elegant-loading">No matching records found</div>
                  ) : (
                    filteredData.map((row, index) => {
                      const relatedMappings = selectedMapping === 'field_mapping' ? getRelatedFieldMappings(row as FieldMappingRecord) : [];
                      
                      return (
                        <div key={row.id || index} className="elegant-table-row">
                          {columns.map((column) => {
                            const isEditing = editingCell?.rowIndex === index && editingCell?.columnKey === column.key;
                            const isEditable = !column.isDbColumn;
                            const currentValue = row[column.key as keyof MappingRecord]?.toString() || '';
                            
                            return (
                              <div 
                                key={column.key} 
                                className={`elegant-cell ${column.isDbColumn ? 'db-column' : 'ai-column'}`}
                                onClick={() => handleCellClick(index, column.key, currentValue, isEditable)}
                              >
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
                                    className="elegant-edit-input"
                                    autoFocus
                                    disabled={updating}
                                  />
                                ) : (
                                  <>
                                    {currentValue || '-'}
                                    <div className={`elegant-cell-badge ${column.isDbColumn ? 'db' : 'ai'}`}>
                                      {column.isDbColumn ? 'DB' : 'AI'}
                                    </div>
                                    {/* Show indicator if there are related mappings */}
                                    {column.key === 'ai_field' && relatedMappings.length > 0 && (
                                      <div className="elegant-related-indicator" title={`${relatedMappings.length} more mapping(s) for this DB field`}>
                                        +{relatedMappings.length}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                          <div className="elegant-actions">
                            <button 
                              onClick={() => handlePropose(row)}
                              className="elegant-action-button elegant-propose-button"
                              title={selectedMapping === 'field_mapping' ? 'Propose field selection' : 'Propose record creation'}
                              disabled={selectedMapping === 'hide_columns_output'}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            
                            <button 
                              onClick={() => handleDeleteClick(row)}
                              className="elegant-action-button elegant-delete-button"
                              title="Delete record"
                              disabled={deleting === row.id?.toString()}
                            >
                              {deleting === row.id?.toString() ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="spinner">
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                                  <path d="M8 12h8" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                              ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
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

      {/* Propose Modal for non-field_mapping types */}
      {showProposeModal && selectedMapping !== 'field_mapping' && (
        <div className="elegant-modal-overlay" onClick={() => setShowProposeModal(false)}>
          <div className="elegant-modal" onClick={(e) => e.stopPropagation()}>
            <div className="elegant-modal-header">
              <h3 className="elegant-modal-title">
                Propose New {selectedOption?.label}
              </h3>
              <p className="elegant-modal-description">
                Modify the pre-filled values below and create a new record for your mapping configuration.
              </p>
            </div>

            <div>
              {columns.map((column) => (
                <div key={column.key} className="elegant-form-group">
                  <label className="elegant-form-label">
                    {column.label}
                    <span className={`elegant-form-badge ${column.isDbColumn ? 'db' : 'ai'}`}>
                      {column.isDbColumn ? 'DATABASE' : 'AI FIELD'}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={proposeFormData[column.key] || ''}
                    onChange={(e) => setProposeFormData({ ...proposeFormData, [column.key]: e.target.value })}
                    className={`elegant-form-input ${column.isDbColumn ? 'db-input' : ''}`}
                    placeholder={`Enter ${column.label.toLowerCase()}...`}
                  />
                </div>
              ))}
            </div>

            <div className="elegant-modal-actions">
              <button
                onClick={() => setShowProposeModal(false)}
                className="elegant-button elegant-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={createRecord}
                disabled={creating}
                className="elegant-button elegant-button-primary"
              >
                {creating ? 'Creating...' : 'Create Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Field Selection Modal for field_mapping */}
      {showFieldSelectionModal && selectedMapping === 'field_mapping' && (
        <div className="elegant-modal-overlay" onClick={() => setShowFieldSelectionModal(false)}>
          <div className="elegant-modal" onClick={(e) => e.stopPropagation()}>
            <div className="elegant-modal-header">
              <h3 className="elegant-modal-title">
                Select Proposed AI Fields
              </h3>
              <p className="elegant-modal-description">
                {getModalDescription()}
              </p>
              {currentEditingRow && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px 16px', 
                  background: 'linear-gradient(135deg, rgba(0, 21, 118, 0.08) 0%, rgba(0, 43, 184, 0.08) 100%)', 
                  borderRadius: '12px',
                  border: '2px solid rgba(0, 21, 118, 0.2)',
                  fontSize: '14px',
                  color: '#475569'
                }}>
                  Current AI Field: <strong style={{ color: '#1e293b' }}>{(currentEditingRow as FieldMappingRecord).ai_field}</strong>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              {loadingFields ? (
                <div className="elegant-loading-spinner">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="spinner">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <div>Analyzing database structure and generating AI field proposals...</div>
                </div>
              ) : (
                <div className="elegant-field-selection">
                  {availableFields.length === 0 ? (
                    <div className="elegant-empty-state" style={{ padding: '40px 20px', gridColumn: '1 / -1' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="elegant-empty-icon">
                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <div className="elegant-empty-title">No Proposals Available</div>
                      <div className="elegant-empty-description">Our AI couldn't generate field proposals for this configuration</div>
                    </div>
                  ) : (
                    <>
                      {/* Custom Field Option */}
                      <div 
                        className={`elegant-field-option custom-field ${selectedFields.includes('custom') ? 'selected' : ''}`}
                        onClick={() => handleFieldToggle('custom')}
                      >
                        <div className="elegant-field-header">
                          <input
                            type="checkbox"
                            checked={selectedFields.includes('custom')}
                            onChange={() => handleFieldToggle('custom')}
                            className="elegant-checkbox"
                            onClick={(e) => e.stopPropagation()}
                          />
                          {selectedFields.includes('custom') && (
                            <div className="elegant-check-icon">
                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="elegant-field-info">
                          <div className="elegant-field-name">Custom AI Field</div>
                          <div className="elegant-field-type">Define your own field name</div>
                          <input
                            type="text"
                            value={customFieldName}
                            onChange={(e) => handleCustomFieldChange(e.target.value)}
                            placeholder="Enter custom field name..."
                            className="elegant-custom-input"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      {/* AI Proposed Fields */}
                      {availableFields.map((field) => (
                        <div 
                          key={field.id} 
                          className={`elegant-field-option ${selectedFields.includes(field.id) ? 'selected' : ''}`}
                          onClick={() => handleFieldToggle(field.id)}
                        >
                          <div className="elegant-field-header">
                            <input
                              type="checkbox"
                              checked={selectedFields.includes(field.id)}
                              onChange={() => handleFieldToggle(field.id)}
                              className="elegant-checkbox"
                              onClick={(e) => e.stopPropagation()}
                            />
                            {selectedFields.includes(field.id) && (
                              <div className="elegant-check-icon">
                                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor"/>
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="elegant-field-info">
                            <div className="elegant-field-name">{field.name}</div>
                            <div className="elegant-field-type">AI-proposed • Type: {field.type}</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
              
              {/* Enhanced Selection Summary */}
              {!loadingFields && (selectedFields.length > 0 || customFieldName.trim()) && (
                <div className="elegant-selection-summary">
                  <div className="elegant-summary-title">
                    {getSelectionSummary()}
                  </div>
                  <div className="elegant-summary-content">
                    {selectedFields.includes('custom') && customFieldName.trim() ? (
                      <>Custom: "{customFieldName}"{selectedFields.length > 1 ? ', ' : ''}</>
                    ) : null}
                    {selectedFields.filter(id => id !== 'custom').map(fieldId => {
                      const field = availableFields.find(f => f.id === fieldId);
                      return field ? field.name : fieldId;
                    }).join(', ')}
                    {selectedFields.length === 0 && customFieldName.trim() ? (
                      `Custom field: "${customFieldName}"`
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            <div className="elegant-modal-actions">
              <button
                onClick={() => {
                  setShowFieldSelectionModal(false);
                  setSelectedFields([]);
                  setCustomFieldName('');
                  setCurrentEditingRow(null);
                }}
                className="elegant-button elegant-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleFieldSelection}
                disabled={selectedFields.length === 0 && !customFieldName.trim() || updating}
                className="elegant-button elegant-button-primary"
              >
                {getApplyButtonText()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="elegant-modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="elegant-modal elegant-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="elegant-delete-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14Z" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <div className="elegant-modal-header">
              <h3 className="elegant-modal-title">Delete Record</h3>
              <p className="elegant-modal-description">
                Are you absolutely sure you want to delete this record? This action cannot be undone and will permanently remove the data from your mapping configuration.
              </p>
            </div>

            <div className="elegant-modal-actions">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="elegant-button elegant-button-secondary"
              >
                Keep Record
              </button>
              <button
                onClick={() => {
                  const row = filteredData.find(r => r.id?.toString() === showDeleteConfirm);
                  if (row) deleteRecord(row);
                }}
                disabled={deleting === showDeleteConfirm}
                className="elegant-button elegant-button-danger"
              >
                {deleting === showDeleteConfirm ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElegantAlignView;