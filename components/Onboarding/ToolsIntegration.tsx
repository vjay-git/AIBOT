import React, { useState } from 'react';

// Tool interface for type checking
interface Tool {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const ToolsIntegration = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sample tools data
  const tools: Tool[] = [
    {
      id: 'power-bi',
      name: 'Power BI',
      icon: '📊', // Replace with actual icon
      description: 'Create detailed, interactive data visualizations and reports.'
    },
    {
      id: 'tableau',
      name: 'Tableau',
      icon: '📈', // Replace with actual icon
      description: 'Design real-time, interactive dashboards to monitor business data.'
    },
    {
      id: 'google-analytics',
      name: 'Google Analytics',
      icon: '📊', // Replace with actual icon
      description: 'Leverage real-time data for performance analysis and make data-driven decisions'
    },
    {
      id: 'bigquery',
      name: 'BigQuery (Google Cloud)',
      icon: '📊', // Replace with actual icon
      description: 'Create detailed, interactive data visualizations and reports.'
    },
    {
      id: 'amazon-redshift',
      name: 'Amazon Redshift',
      icon: '📊', // Replace with actual icon
      description: 'Cloud-based data warehouse for fast data processing and analytics.'
    }
  ];

  const filteredTools = tools.filter(tool => 
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tool.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTool = (toolId: string) => {
    console.log(`Adding tool: ${toolId}`);
    // API call would go here
  };

  return (
    <div className="tools-integration-container">
      <h1 className="page-title">Tools Integration</h1>
      <p className="page-description">Configure and manage the external tools integrated into your workflow.</p>
      
      <div className="search-container">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search by Name, Id.no" 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="tools-grid">
        {filteredTools.map(tool => (
          <div key={tool.id} className="tool-card">
            <div className="tool-icon">{tool.icon}</div>
            <h3 className="tool-name">{tool.name}</h3>
            <p className="tool-description">{tool.description}</p>
            <button 
              className="add-tool-button"
              onClick={() => handleAddTool(tool.id)}
            >
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToolsIntegration; 