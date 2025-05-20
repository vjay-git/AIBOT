import React, { useState, useEffect } from 'react';
import { fetchSchemaData } from '../../utils/apiMocks';
import { SchemaType } from '../../types';

// Subnav items for schema
export const schemaTabs = [
  { id: 'operation-table', title: 'Operation_table' },
  { id: 'trained-models', title: 'Trained Models' },
  { id: 'patient-age-metrics', title: 'Patient age metrics' },
  { id: 'demographics', title: 'Demographics' },
  { id: 'department-doctor', title: 'Department & Doctor' },
  { id: 'age-pattern', title: 'Age Pattern' },
  { id: 'age-complaints', title: 'Age and complains' },
];

const Schema = () => {
  const [loading, setLoading] = useState(true);
  const [schemaData, setSchemaData] = useState<SchemaType | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchSchemaData();
        setSchemaData(data);
        const count = data.fields.filter(field => field.selected).length;
        setSelectedCount(count);
      } catch (error) {
        console.error('Error loading schema data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const toggleFieldSelection = (index: number) => {
    if (!schemaData) return;
    
    const updatedFields = [...schemaData.fields];
    updatedFields[index].selected = !updatedFields[index].selected;
    
    setSchemaData({ ...schemaData, fields: updatedFields });
    setSelectedCount(updatedFields.filter(field => field.selected).length);
  };

  if (loading) {
    return <div className="loading">Loading schema data...</div>;
  }

  return (
    <div className="schema-page">
      <div className="header">
        <h1 className="header-title">Select Table</h1>
        <div className="table-selector">
          <div className="select-container">
            <select className="select-input">
              <option value="inspire_labs">inspire_labs</option>
            </select>
          </div>
        </div>
      </div>

      <div className="schema-config">
        <div className="config-row">
          <div className="config-group">
            <label>Algorithm</label>
            <div className="select-container">
              <select className="select-input">
                <option value="linear_regression">Linear_regression</option>
              </select>
            </div>
          </div>
          <div className="config-group">
            <label>Target Features</label>
            <div className="select-container">
              <select className="select-input">
                <option value="operation_id">Operation_ID</option>
              </select>
            </div>
          </div>
          <div className="config-group">
            <label>Date</label>
            <div className="select-container">
              <select className="select-input">
                <option value="operation_date">Operation_date</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="select-all-container">
        <label className="checkbox-label">
          <input type="checkbox" className="checkbox-input" />
          <span className="checkbox-text">Select all</span>
        </label>
      </div>

      <div className="fields-grid">
        {schemaData?.fields.map((field, index) => (
          <div className="field-item" key={field.id}>
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                className="checkbox-input" 
                checked={field.selected}
                onChange={() => toggleFieldSelection(index)}
              />
              <span className="checkbox-text">{field.name}</span>
            </label>
          </div>
        ))}
      </div>

      <div className="schema-footer">
        <div className="selected-count">
          <span className="count-number">{selectedCount}</span>
          <span className="count-text">Features have been selected</span>
        </div>
        <div className="training-info">
          <span className="training-time">ESTD Training Time 32 min</span>
        </div>
        <button className="train-button">Train Model</button>
      </div>
    </div>
  );
};

export default Schema;