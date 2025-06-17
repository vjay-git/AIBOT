import React, { useState, useEffect } from 'react';
import { Plus, Database, Brain, Trash2, Eye, Target, Calendar, ChevronDown } from 'lucide-react';
import ModelDetailsModal from '../schema/ModelDetailsModal'; // Import the modal component

interface SchemaTabsProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

// API Configuration
const API_BASE = 'http://20.204.162.66:5001';
const COMPANY_ID = '4fa74802-6abb-4b65-880e-ac36a9dd1f6a';
const USER_ID = '56376e63-0377-413d-8c9e-359028e2380d';

const SchemaTabs: React.FC<SchemaTabsProps> = ({ selectedId, onSelect }) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [aiTables, setAiTables] = useState([]);
  const [trainedModels, setTrainedModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  
  // Modal state
  const [selectedModel, setSelectedModel] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch available AI tables
  useEffect(() => {
    const fetchAiTables = async () => {
      setIsLoadingTables(true);
      try {
        console.log('🔄 Fetching AI tables for schema tabs...');
        const response = await fetch(`${API_BASE}/users/?user_id=${USER_ID}`);
        const data = await response.json();
        
        if (data.data && data.data.ai_tables) {
          setAiTables(data.data.ai_tables);
          console.log('✅ AI tables loaded:', data.data.ai_tables);
          
          // Set default table if none selected
          if (!selectedTable && data.data.ai_tables.length > 0) {
            const defaultTable = data.data.ai_tables[0];
            setSelectedTable(defaultTable);
            console.log('🎯 Set default table in tabs:', defaultTable);
          }
        }
      } catch (err) {
        console.error('❌ Error fetching AI tables:', err);
        setAiTables([]);
      } finally {
        setIsLoadingTables(false);
      }
    };

    fetchAiTables();
  }, []);

  // Listen for table changes from the main schema page (for sync)
  useEffect(() => {
    const handleTableChange = (event) => {
      console.log('📨 Received table change event in tabs:', event.detail);
      if (event.detail && event.detail.selectedTable) {
        console.log('🔄 Syncing table selection from main page:', event.detail.selectedTable);
        setSelectedTable(event.detail.selectedTable);
      }
    };

    // Check global window object for initial sync
    const checkGlobalTable = () => {
      if (typeof window !== 'undefined' && (window as any).selectedSchemaTable) {
        console.log('🌐 Syncing from global scope:', (window as any).selectedSchemaTable);
        setSelectedTable((window as any).selectedSchemaTable);
      }
    };

    console.log('👂 Schema tabs setting up table sync');
    
    // Set up event listener for sync
    window.addEventListener('schemaTableChanged', handleTableChange);
    
    // Check immediately for sync
    checkGlobalTable();
    
    return () => {
      console.log('🔇 Schema tabs cleanup');
      window.removeEventListener('schemaTableChanged', handleTableChange);
    };
  }, []);

  // Handle table selection from the tabs component
  const handleTableSelect = (tableName: string) => {
    console.log('🎯 Table selected in schema tabs:', tableName);
    setSelectedTable(tableName);
    
    // Update global state and notify other components
    if (typeof window !== 'undefined') {
      (window as any).selectedSchemaTable = tableName;
      
      // Notify the main schema page
      const event = new CustomEvent('schemaTableChanged', {
        detail: { selectedTable: tableName }
      });
      window.dispatchEvent(event);
      
      // Backup notification
      setTimeout(() => {
        const backupEvent = new CustomEvent('tableUpdated', {
          detail: { table: tableName }
        });
        window.dispatchEvent(backupEvent);
      }, 100);
    }
  };

  // Fetch trained models with better error handling and CORS support
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoading(true);
      try {
        console.log('🔄 Fetching models from:', `${API_BASE}/prediction/list_models?company_id=${COMPANY_ID}`);
        
        const response = await fetch(`${API_BASE}/prediction/list_models?company_id=${COMPANY_ID}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          mode: 'cors'
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const rawText = await response.text();
        console.log('📄 Raw response text:', rawText);
        
        let data;
        try {
          data = JSON.parse(rawText);
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          throw new Error('Invalid JSON response');
        }
        
        console.log('📊 Parsed JSON data:', data);
        
        // Handle different response formats
        let modelsArray = [];
        if (Array.isArray(data)) {
          modelsArray = data;
          console.log('✅ Data is array, using directly');
        } else if (data && Array.isArray(data.models)) {
          modelsArray = data.models;
          console.log('✅ Using data.models array');
        } else if (data && Array.isArray(data.data)) {
          modelsArray = data.data;
          console.log('✅ Using data.data array');
        } else if (data && data.message === 'success' && data.data) {
          // Handle API response format like { message: 'success', data: [...] }
          modelsArray = Array.isArray(data.data) ? data.data : [];
          console.log('✅ Using success response data');
        } else if (data && typeof data === 'object') {
          // If it's an object with model data, try to extract it
          const values = Object.values(data);
          modelsArray = values.filter(item => 
            item && typeof item === 'object' && (item.table_name || item.algorithm)
          );
          console.log('✅ Extracted from object values');
        }
        
        console.log('✅ Final processed models array:', modelsArray);
        console.log('📊 Models count:', modelsArray.length);
        
        setTrainedModels(modelsArray);
        
      } catch (err) {
        console.error('❌ Error fetching models:', err);
        console.error('❌ Error details:', {
          message: err.message,
          stack: err.stack
        });
        setTrainedModels([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
    
    // Also listen for model updates from the main page
    const handleModelUpdate = () => {
      console.log('🔄 Refreshing models due to update event');
      fetchModels();
    };
    
    window.addEventListener('modelsUpdated', handleModelUpdate);
    return () => window.removeEventListener('modelsUpdated', handleModelUpdate);
  }, []);

  const handleDeleteModel = async (model) => {
    if (!confirm(`Delete model "${model.target_col}" prediction?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/prediction/delete_model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_name: model.table_name,
          target_col: model.target_col,
          algorithm: model.algorithm,
          ...(model.date_col && { date_col: model.date_col })
        })
      });

      if (response.ok) {
        setTrainedModels(prev => prev.filter(m => 
          !(m.table_name === model.table_name && 
            m.target_col === model.target_col && 
            m.algorithm === model.algorithm)
        ));
      }
    } catch (err) {
      console.error('Error deleting model:', err);
    }
  };

  // Handle viewing model details
  const handleViewModel = (model) => {
    console.log('📊 Opening model details for:', model);
    setSelectedModel(model);
    setIsModalOpen(true);
  };

  // Handle closing modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedModel(null);
  };

  const formatAlgorithmName = (algorithm) => {
    const names = {
      'linear_regression': 'Linear Regression',
      'random_forest': 'Random Forest',
      'arima': 'ARIMA',
      'prophet': 'Prophet',
      'xgboost': 'XGBoost'
    };
    return names[algorithm] || algorithm;
  };

  const getAlgorithmColor = (algorithm) => {
    const colors = {
      'linear_regression': '#10b981',
      'random_forest': '#8b5cf6', 
      'arima': '#f59e0b',
      'prophet': '#ef4444',
      'xgboost': '#06b6d4'
    };
    return colors[algorithm] || '#6b7280';
  };

  // Filter models for the selected table with detailed logging
  const tableModels = trainedModels.filter(model => {
    const matches = model.table_name === selectedTable;
    if (selectedTable) {
      console.log(`🔍 Model "${model.target_col || 'unknown'}" (table: "${model.table_name}") matches "${selectedTable}": ${matches}`);
    }
    return matches;
  });

  console.log('🎯 Current state:', {
    selectedTable,
    totalModels: trainedModels.length,
    tableModels: tableModels.length,
    allModelTables: trainedModels.map(m => m.table_name).filter(Boolean)
  });

  return (
    <>
      <div className="clean-schema-tabs">
        {/* Table Selector */}
        <div className="schema-table-selector-section">
          <div className="schema-table-selector-wrapper">
            <div className="schema-table-selector">
              <Database className="schema-selector-icon" />
              {isLoadingTables ? (
                <span className="schema-table-loading">Loading tables...</span>
              ) : (
                <select 
                  className="schema-table-select"
                  value={selectedTable}
                  onChange={(e) => handleTableSelect(e.target.value)}
                >
                  <option value="">Select a table...</option>
                  {aiTables.map(table => (
                    <option key={table} value={table}>{table}</option>
                  ))}
                </select>
              )}
              <ChevronDown className="schema-chevron-icon" />
            </div>
          </div>
        </div>

        {/* Table header removed - using dropdown selector instead */}

        {/* Trained Models for Selected Table */}
        <div className="models-section">
          <div className="section-header">
            <span className="models-title">Trained Models</span>
            <span className="models-count">{tableModels.length}</span>
          </div>

          <div className="models-list">
            {isLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <span>Loading models...</span>
              </div>
            ) : tableModels.length === 0 ? (
              <div className="empty-models">
                <Brain className="empty-icon" />
                <p>No models trained yet</p>
                <span>
                  {selectedTable 
                    ? `Train your first model for "${selectedTable}" using the main schema page`
                    : 'Select a table to see trained models'
                  }
                </span>
              </div>
            ) : (
              tableModels.map((model, index) => (
                <div
                  key={`${model.target_col}-${model.algorithm}-${index}`}
                  className={`model-card ${selectedId === `model-${index}` ? 'active' : ''}`}
                  onClick={() => handleViewModel(model)}
                >
                  <div className="model-header">
                    <div className="model-main">
                      <div 
                        className="algorithm-badge"
                        style={{ backgroundColor: `${getAlgorithmColor(model.algorithm)}15`, color: getAlgorithmColor(model.algorithm) }}
                      >
                        {formatAlgorithmName(model.algorithm)}
                      </div>
                      <h4 className="model-title">{model.target_col}</h4>
                    </div>
                    
                    <div className="model-actions">
                      <button 
                        className="action-btn view"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewModel(model);
                        }}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteModel(model);
                        }}
                        title="Delete Model"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="model-details">
                    <div className="detail-item">
                      <Target size={12} />
                      <span>Target: {model.target_col}</span>
                    </div>
                    {model.date_col && (
                      <div className="detail-item">
                        <Calendar size={12} />
                        <span>Date: {model.date_col}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <Database size={12} />
                      <span>Table: {model.table_name}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Model Details Modal */}
      <ModelDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        model={selectedModel}
      />
    </>
  );
};

export default SchemaTabs;