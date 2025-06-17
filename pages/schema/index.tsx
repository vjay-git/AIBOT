import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Database, Clock, Target, Calendar, ChevronDown, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

// API Configuration
const API_BASE = 'http://20.204.162.66:5001';
const USER_ID = '56376e63-0377-413d-8c9e-359028e2380d';
const COMPANY_ID = '4fa74802-6abb-4b65-880e-ac36a9dd1f6a';

const SchemaPage = () => {
  // State management
  const [userData, setUserData] = useState(null);
  const [aiTables, setAiTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableFields, setTableFields] = useState([]);
  const [algorithms, setAlgorithms] = useState([]);
  const [trainedModels, setTrainedModels] = useState([]);
  
  // Form state
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('');
  const [targetFeature, setTargetFeature] = useState('');
  const [dateColumn, setDateColumn] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [selectedCount, setSelectedCount] = useState(0);
  
  // Retrain state
  const [selectedModel, setSelectedModel] = useState(null);
  const [isRetrainMode, setIsRetrainMode] = useState(false);

  // Fetch user data and AI tables
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/users/?user_id=${USER_ID}`);
        const data = await response.json();
        
        if (data.data) {
          setUserData(data.data);
          setAiTables(data.data.ai_tables || []);
          
          if (data.data.ai_tables && data.data.ai_tables.length > 0) {
            setSelectedTable(data.data.ai_tables[0]);
          }
        }
      } catch (err) {
        setError('Failed to load user data');
        console.error('Error fetching user data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Fetch algorithms
  useEffect(() => {
    const fetchAlgorithms = async () => {
      try {
        const response = await fetch(`${API_BASE}/prediction/list_algorithms`);
        const data = await response.json();
        setAlgorithms(data || []);
        
        if (data && data.length > 0) {
          setSelectedAlgorithm(data[0]);
        }
      } catch (err) {
        console.error('Error fetching algorithms:', err);
      }
    };

    fetchAlgorithms();
  }, []);

  // Function to fetch table fields (extracted for reusability)
  const fetchTableFields = async (tableName) => {
    if (!tableName || !userData?.company_id) return;
    
    setIsLoading(true);
    try {
      const schema = '95LH3K1M31';
      
      const response = await fetch(
        `${API_BASE}/data_normalization/aitable_fields?schema=${schema}&ai_table=${tableName}`
      );
      const data = await response.json();
      
      if (data.fields) {
        const fieldsWithSelection = data.fields.map(field => ({
          ...field,
          selected: false
        }));
        setTableFields(fieldsWithSelection);
        
        // Reset form state when table changes
        setTargetFeature('');
        setDateColumn('');
        setSelectAll(false);
        
        if (fieldsWithSelection.length > 0) {
          setTargetFeature(fieldsWithSelection[0].ai_field);
        }
        
        const dateField = fieldsWithSelection.find(f => 
          f.ai_field.toLowerCase().includes('year') || 
          f.ai_field.toLowerCase().includes('date') ||
          f.ai_field.toLowerCase().includes('time')
        );
        if (dateField) {
          setDateColumn(dateField.ai_field);
        }
        
        console.log('✅ Fields fetched for table:', tableName, fieldsWithSelection.length);
      }
    } catch (err) {
      setError('Failed to load table fields');
      console.error('Error fetching table fields:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch table fields when table is selected
  useEffect(() => {
    fetchTableFields(selectedTable);
  }, [selectedTable, userData]);

  // Listen for table changes from SchemaTabs
  useEffect(() => {
    const handleTableChangeFromTabs = (event) => {
      console.log('📨 Schema page received table change from tabs:', event.detail);
      if (event.detail && event.detail.selectedTable) {
        const newTable = event.detail.selectedTable;
        console.log('🔄 Updating schema page table from tabs:', newTable);
        
        // Only update if it's actually different
        if (newTable !== selectedTable) {
          setSelectedTable(newTable);
          console.log('✅ Table updated in schema page:', newTable);
        }
      }
    };

    // Also listen for the backup event
    const handleTableUpdated = (event) => {
      console.log('📨 Schema page received table update event:', event.detail);
      if (event.detail && event.detail.table) {
        const newTable = event.detail.table;
        console.log('🔄 Updating schema page table from backup event:', newTable);
        
        if (newTable !== selectedTable) {
          setSelectedTable(newTable);
          console.log('✅ Table updated in schema page via backup:', newTable);
        }
      }
    };

    console.log('👂 Schema page setting up table change listeners');
    
    // Set up event listeners
    window.addEventListener('schemaTableChanged', handleTableChangeFromTabs);
    window.addEventListener('tableUpdated', handleTableUpdated);
    
    return () => {
      console.log('🔇 Schema page cleanup listeners');
      window.removeEventListener('schemaTableChanged', handleTableChangeFromTabs);
      window.removeEventListener('tableUpdated', handleTableUpdated);
    };
  }, [selectedTable]); // Include selectedTable in dependency to compare

  // Handle table selection from the main page dropdown
  const handleTableSelectFromPage = (tableName) => {
    console.log('🎯 Table selected in main page:', tableName);
    setSelectedTable(tableName);
    
    // Notify other components
    if (typeof window !== 'undefined') {
      (window as any).selectedSchemaTable = tableName;
      
      const event = new CustomEvent('schemaTableChanged', {
        detail: { selectedTable: tableName }
      });
      window.dispatchEvent(event);
      
      setTimeout(() => {
        const backupEvent = new CustomEvent('tableUpdated', {
          detail: { table: tableName }
        });
        window.dispatchEvent(backupEvent);
      }, 100);
    }
  };

  // Notify schema tabs when table changes (keep existing functionality)
  useEffect(() => {
    if (selectedTable && typeof window !== 'undefined') {
      console.log('🔄 Notifying schema tabs of table change:', selectedTable);
      
      const event = new CustomEvent('schemaTableChanged', {
        detail: { selectedTable }
      });
      window.dispatchEvent(event);
      
      (window as any).selectedSchemaTable = selectedTable;
      
      setTimeout(() => {
        const backupEvent = new CustomEvent('tableUpdated', {
          detail: { table: selectedTable }
        });
        window.dispatchEvent(backupEvent);
      }, 100);
    }
  }, [selectedTable]);

  // Also set initial table when aiTables load
  useEffect(() => {
    if (aiTables.length > 0 && !selectedTable) {
      console.log('🎯 Setting initial table:', aiTables[0]);
      setSelectedTable(aiTables[0]);
    }
  }, [aiTables, selectedTable]);

  // Update selected count when fields change
  useEffect(() => {
    const count = tableFields.filter(field => field.selected).length;
    setSelectedCount(count);
    setSelectAll(count === tableFields.length && tableFields.length > 0);
  }, [tableFields]);

  // Auto-clear messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Handlers
  const toggleFieldSelection = (index) => {
    const updatedFields = [...tableFields];
    updatedFields[index].selected = !updatedFields[index].selected;
    setTableFields(updatedFields);
  };

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    const updatedFields = tableFields.map(field => ({
      ...field,
      selected: newSelectAll
    }));
    setTableFields(updatedFields);
    setSelectAll(newSelectAll);
  };

  const handleTrainModel = async () => {
    const selectedFeatures = tableFields
      .filter(field => field.selected)
      .map(field => field.ai_field);

    if (selectedFeatures.length === 0) {
      setError('Please select at least one feature');
      return;
    }

    if (!targetFeature) {
      setError('Please select a target feature');
      return;
    }

    if (!selectedAlgorithm) {
      setError('Please select an algorithm');
      return;
    }

    setIsTraining(true);
    setError(null);

    try {
      const payload = {
        schema: '95LH3K1M31',
        table_name: selectedTable,
        feature_cols: selectedFeatures,
        target_col: targetFeature,
        algorithm: selectedAlgorithm,
        ...(needsDateColumn() && dateColumn && { date_col: dateColumn })
      };

      const response = await fetch(`${API_BASE}/prediction/train?company_id=${COMPANY_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (response.ok) {
        const event = new CustomEvent('modelsUpdated');
        window.dispatchEvent(event);
        
        setSuccess('Model training started successfully!');
        
        // Reset selections
        setTableFields(prev => prev.map(field => ({ ...field, selected: false })));
        setSelectAll(false);
      } else {
        setError(result.message || 'Training failed');
      }
    } catch (err) {
      setError('Failed to start training');
      console.error('Training error:', err);
    } finally {
      setIsTraining(false);
    }
  };

  const needsDateColumn = () => {
    return ['arima', 'prophet'].includes(selectedAlgorithm);
  };

  const getEstimatedTrainingTime = () => {
    const baseTime = 15;
    const featureMultiplier = selectedCount * 2;
    const algorithmMultiplier = {
      'linear_regression': 1,
      'random_forest': 2,
      'arima': 1.5,
      'prophet': 1.5
    }[selectedAlgorithm] || 1;
    
    return Math.round(baseTime + featureMultiplier * algorithmMultiplier);
  };

  const filteredFields = tableFields.filter(field =>
    field.ai_field.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.ai_field_format?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading && tableFields.length === 0) {
    return (
      <div className="schema-page-wrapper">
        <div className="schema-loading-container">
          <Loader2 className="schema-loading-spinner" size={32} />
          <p className="schema-loading-text">Loading schema data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schema-page-wrapper">
      {/* Header Section */}
      <div className="schema-page-header">
        <div className="schema-header-content">
          <div className="schema-header-top">
            <div className="schema-header-info">
              <h1 className="schema-page-title">ML Model Training</h1>
              <p className="schema-page-subtitle">Configure and train machine learning models</p>
            </div>
            
            {/* Table Selector */}
            <div className="schema-table-selector-wrapper">
              <div className="schema-table-selector">
                <Database className="schema-selector-icon" />
                <select 
                  className="schema-table-select"
                  value={selectedTable}
                  onChange={(e) => {
                    console.log('🎯 Table selected in main page:', e.target.value);
                    handleTableSelectFromPage(e.target.value);
                  }}
                >
                  {aiTables.map(table => (
                    <option key={table} value={table}>{table}</option>
                  ))}
                </select>
                <ChevronDown className="schema-chevron-icon" />
              </div>
            </div>
          </div>

          {/* Configuration Row */}
          <div className="schema-config-grid">
            <div className="schema-config-item">
              <label className="schema-config-label">
                <Target className="schema-label-icon schema-blue" />
                Algorithm
              </label>
              <div className="schema-select-wrapper">
                <select 
                  className="schema-config-select"
                  value={selectedAlgorithm}
                  onChange={(e) => setSelectedAlgorithm(e.target.value)}
                >
                  {algorithms.map(algo => (
                    <option key={algo} value={algo}>
                      {algo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
                <ChevronDown className="schema-select-chevron" />
              </div>
            </div>

            <div className="schema-config-item">
              <label className="schema-config-label">
                <Target className="schema-label-icon schema-green" />
                Target Feature
              </label>
              <div className="schema-select-wrapper">
                <select 
                  className="schema-config-select"
                  value={targetFeature}
                  onChange={(e) => setTargetFeature(e.target.value)}
                >
                  <option value="">Select target...</option>
                  {tableFields.map(field => (
                    <option key={field.ai_field} value={field.ai_field}>
                      {field.ai_field}
                    </option>
                  ))}
                </select>
                <ChevronDown className="schema-select-chevron" />
              </div>
            </div>

            {needsDateColumn() && (
              <div className="schema-config-item">
                <label className="schema-config-label">
                  <Calendar className="schema-label-icon schema-purple" />
                  Date Column
                </label>
                <div className="schema-select-wrapper">
                  <select 
                    className="schema-config-select"
                    value={dateColumn}
                    onChange={(e) => setDateColumn(e.target.value)}
                  >
                    <option value="">Select date column...</option>
                    {tableFields.map(field => (
                      <option key={field.ai_field} value={field.ai_field}>
                        {field.ai_field}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="schema-select-chevron" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Retrain Mode Banner */}
      {isRetrainMode && selectedModel && (
        <div className="schema-retrain-banner">
          <div className="schema-retrain-content">
            <div className="schema-retrain-info">
              <span className="schema-retrain-label">Retrain Mode</span>
              <span className="schema-retrain-model">
                {selectedModel.target_col} ({selectedModel.algorithm.replace('_', ' ')})
              </span>
            </div>
            <button 
              className="schema-clear-retrain"
              onClick={() => {
                setSelectedModel(null);
                setIsRetrainMode(false);
                setSuccess('');
                // Reset form
                setTableFields(prev => prev.map(field => ({ ...field, selected: false })));
                setSelectAll(false);
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Notifications */}
      {error && (
        <div className="schema-notification schema-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="schema-notification schema-success">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {/* Main Content */}
      <div className="schema-main-content">
        {/* Search Controls */}
        <div className="schema-controls-section">
          <div className="schema-search-wrapper">
            <Search className="schema-search-icon" />
            <input
              type="text"
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="schema-search-input"
            />
          </div>
        </div>

        {/* Select All */}
        <div className="schema-select-all-section">
          <label className="schema-select-all-label">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={toggleSelectAll}
              className="schema-select-all-checkbox"
            />
            <span className="schema-select-all-text">Select all features</span>
          </label>
          
          <div className="schema-selection-count">
            {selectedCount} of {filteredFields.length} features selected
          </div>
        </div>

        {/* Features Grid */}
        <div className="schema-features-grid">
          {filteredFields.map((field, index) => {
            const originalIndex = tableFields.findIndex(f => f.ai_field === field.ai_field);
            return (
              <div
                key={field.ai_field}
                className={`schema-feature-card ${field.selected ? 'schema-feature-selected' : ''}`}
                onClick={() => toggleFieldSelection(originalIndex)}
              >
                <label className="schema-feature-label">
                  <input
                    type="checkbox"
                    checked={field.selected}
                    onChange={() => {}}
                    className="schema-feature-checkbox"
                  />
                  <div className="schema-feature-info">
                    <span className="schema-feature-name">{field.ai_field}</span>
                    {field.ai_field_format && (
                      <span className="schema-feature-description">{field.ai_field_format}</span>
                    )}
                  </div>
                </label>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="schema-footer-section">
          <div className="schema-footer-content">
            <div className="schema-footer-stats">
              <div className="schema-stat-item">
                <div className="schema-stat-number">{selectedCount}</div>
                <div className="schema-stat-label">Features</div>
              </div>
              
              <div className="schema-stat-divider"></div>
              
              <div className="schema-training-time">
                <Clock className="schema-time-icon" />
                <span className="schema-time-label">Est. Training</span>
                <span className="schema-time-value">{getEstimatedTrainingTime()} min</span>
              </div>
            </div>

            <button 
              className="schema-train-button"
              onClick={handleTrainModel}
              disabled={isTraining || selectedCount === 0 || !targetFeature}
            >
              {isTraining ? (
                <>
                  <Loader2 className="schema-button-spinner" size={16} />
                  {isRetrainMode ? 'Retraining...' : 'Training...'}
                </>
              ) : (
                isRetrainMode ? 'Retrain Model' : 'Train Model'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchemaPage;