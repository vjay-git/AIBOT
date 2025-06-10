import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Database, Clock, Target, Calendar, ChevronDown } from 'lucide-react';

// Mock schema data
const mockSchemaData = {
  fields: [
    { id: 'operation_id', name: 'Operation_ID', selected: true },
    { id: 'patient_id', name: 'Patient_ID', selected: true },
    { id: 'case_id', name: 'Case_ID', selected: false },
    { id: 'operation_data', name: 'Operation_data', selected: false },
    { id: 'gender_of_patient', name: 'Gender_of_patient', selected: false },
    { id: 'weight_of_patient', name: 'Weight_of_patient', selected: false },
    { id: 'patient_race', name: 'Patient_race', selected: true },
    { id: 'asa_classification_score', name: 'Asa_classification_score', selected: false },
    { id: 'department', name: 'Department', selected: false },
    { id: 'anaesthesia_type', name: 'Anaesthesia_type', selected: false },
    { id: 'operating_room_entry_time', name: 'Operating_room_entry_time', selected: false },
    { id: 'operating_room_exit_time', name: 'Operating_room_exit_time', selected: true },
    { id: 'operation_end_time', name: 'Operation_end_time', selected: false },
    { id: 'admission_time', name: 'Admission_time', selected: false },
    { id: 'anaesthesia_start_time', name: 'Anaesthesia_start_time', selected: false },
    { id: 'anaesthesia_end_time', name: 'Anaesthesia_end_time', selected: false },
    { id: 'cardiopulmonary_bypass_off_time', name: 'Cardiopulmonary_bypass_off-time', selected: true },
    { id: 'icu_admission_time', name: 'Icu_admission_time', selected: false },
    { id: 'in_hospital_death_time', name: 'In_hospital_death_time', selected: false },
    { id: 'hospital_admission_id', name: 'Hospital_admission_ID', selected: false },
    { id: 'age', name: 'Age', selected: false },
    { id: 'height_of_patient', name: 'Height_of_patient', selected: true },
    { id: 'emergency_operation_flag', name: 'Emergency_operation_flag', selected: false },
    { id: 'icd_operations_diagnosis_code', name: 'Icd_operations_diagnosis_code', selected: false },
    { id: 'operation_start_time', name: 'Operation_start_time', selected: false },
    { id: 'discharge_time', name: 'Discharge_time', selected: true },
    { id: 'cardiopulmonary_bypass_on_time', name: 'Cardiopulmonary_bypass_on-time', selected: false },
    { id: 'icu_discharge_time', name: 'Icu_discharge_time', selected: false }
  ]
};

const SchemaPage = () => {
  const [schemaData, setSchemaData] = useState(mockSchemaData);
  const [selectedCount, setSelectedCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const count = schemaData.fields.filter(field => field.selected).length;
    setSelectedCount(count);
    setSelectAll(count === schemaData.fields.length);
  }, [schemaData]);

  const toggleFieldSelection = (index) => {
    const updatedFields = [...schemaData.fields];
    updatedFields[index].selected = !updatedFields[index].selected;
    setSchemaData({ ...schemaData, fields: updatedFields });
  };

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    const updatedFields = schemaData.fields.map(field => ({
      ...field,
      selected: newSelectAll
    }));
    setSchemaData({ ...schemaData, fields: updatedFields });
    setSelectAll(newSelectAll);
  };

  const filteredFields = schemaData.fields.filter(field =>
    field.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="schema-page-container">
      {/* Header Section */}
      <div className="schema-header">
        <div className="header-content">
          <div className="header-top">
            <div className="header-info">
              <h1 className="page-title">Select Table</h1>
              <p className="page-subtitle">Configure your machine learning model parameters</p>
            </div>
            
            {/* Table Selector */}
            <div className="table-selector-container">
              <div className="table-selector">
                <Database className="selector-icon" />
                <select className="table-select">
                  <option value="inspire_labs">inspire_labs</option>
                </select>
                <ChevronDown className="chevron-icon" />
              </div>
            </div>
          </div>

          {/* Configuration Row */}
          <div className="config-grid">
            <div className="config-item">
              <label className="config-label">
                <Target className="label-icon blue" />
                Algorithm
              </label>
              <div className="select-wrapper">
                <select className="config-select">
                  <option value="linear_regression">Linear Regression</option>
                </select>
                <ChevronDown className="select-chevron" />
              </div>
            </div>

            <div className="config-item">
              <label className="config-label">
                <Target className="label-icon green" />
                Target Features
              </label>
              <div className="select-wrapper">
                <select className="config-select">
                  <option value="operation_id">Operation_ID</option>
                </select>
                <ChevronDown className="select-chevron" />
              </div>
            </div>

            <div className="config-item">
              <label className="config-label">
                <Calendar className="label-icon purple" />
                Date
              </label>
              <div className="select-wrapper">
                <select className="config-select">
                  <option value="operation_date">Operation_date</option>
                </select>
                <ChevronDown className="select-chevron" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="schema-main">
        {/* Search and Filter Controls */}
        <div className="controls-row">
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="filter-button"
          >
            <Filter className="filter-icon" />
            Filters
          </button>
        </div>

        {/* Select All */}
        <div className="select-all-container">
          <label className="select-all-label">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={toggleSelectAll}
              className="select-all-checkbox"
            />
            <span className="select-all-text">Select all features</span>
          </label>
          
          <div className="selection-count">
            {selectedCount} of {filteredFields.length} features selected
          </div>
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          {filteredFields.map((field, index) => (
            <div
              key={field.id}
              className={`feature-item ${field.selected ? 'selected' : ''}`}
              onClick={() => toggleFieldSelection(schemaData.fields.findIndex(f => f.id === field.id))}
            >
              <label className="feature-label">
                <input
                  type="checkbox"
                  checked={field.selected}
                  onChange={() => {}}
                  className="feature-checkbox"
                />
                <span className="feature-name">
                  {field.name}
                </span>
              </label>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="schema-footer">
          <div className="footer-content">
            <div className="footer-stats">
              <div className="stat-item">
                <div className="stat-number">{selectedCount}</div>
                <div className="stat-label">Features selected</div>
              </div>
              
              <div className="stat-divider"></div>
              
              <div className="training-time">
                <Clock className="time-icon" />
                <span className="time-label">ESTD Training Time</span>
                <span className="time-value">32 min</span>
              </div>
            </div>

            <button className="train-button">
              Train Model
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchemaPage;