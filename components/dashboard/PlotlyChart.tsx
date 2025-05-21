import React from 'react';
import Plot from 'react-plotly.js';

interface PlotlyChartProps {
  data: any;
}

const PlotlyChart: React.FC<PlotlyChartProps> = ({ data }) => {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  // Try to infer chart type and columns
  const columns = Object.keys(data[0] || {});
  if (columns.length < 2) return null;

  // Default: first column is x, second is y
  const x = data.map((row: any) => row[columns[0]]);
  const y = data.map((row: any) => row[columns[1]]);

  return (
    <Plot
      data={[{
        x,
        y,
        type: 'bar',
        marker: { color: 'rgba(55,128,191,0.7)' },
      }]}
      layout={{
        title: 'AskDB Tabular Output',
        xaxis: { title: columns[0] },
        yaxis: { title: columns[1] },
        autosize: true,
      }}
      style={{ width: '100%', height: '400px' }}
      config={{ responsive: true }}
    />
  );
};

export default PlotlyChart;
