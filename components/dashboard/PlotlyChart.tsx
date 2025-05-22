import React from 'react';
import Plot from 'react-plotly.js';

interface PlotlyChartProps {
  data: any;
  chartType?: 'bar' | 'line' | 'pie' | 'scatter';
}

const PlotlyChart: React.FC<PlotlyChartProps> = ({ data, chartType = 'bar' }) => {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  // Try to infer chart type and columns
  const columns = Object.keys(data[0] || {});
  if (columns.length < 2) return null;

  // Default: first column is x, second is y
  const x = data.map((row: any) => row[columns[0]]);
  const y = data.map((row: any) => row[columns[1]]);

  let plotData: any = {};
  if (chartType === 'pie') {
    plotData = {
      labels: x,
      values: y,
      type: 'pie',
      textinfo: 'label+percent',
      insidetextorientation: 'radial',
    };
  } else {
    plotData = {
      x,
      y,
      type: chartType,
      mode: chartType === 'scatter' ? 'markers+lines' : undefined,
      marker: { color: 'rgba(55,128,191,0.7)' },
    };
  }

  return (
    <Plot
      data={[plotData]}
      layout={{
        title: { text: 'AskDB Tabular Output' },
        xaxis: { title: { text: columns[0] } },
        yaxis: { title: { text: columns[1] } },
        autosize: true,
      }}
      style={{ width: '100%', height: '400px' }}
      config={{ responsive: true }}
    />
  );
};

export default PlotlyChart;
