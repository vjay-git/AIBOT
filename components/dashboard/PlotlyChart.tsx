import React from 'react';
import Plot from 'react-plotly.js';

interface PlotlyChartProps {
  data: any[];
  chartType?: 'bar' | 'line' | 'pie' | 'scatter';
  title?: string;
}

// Function to generate elegant shades of a single base color
const generateShades = (baseColor: string, count: number) => {
  const shades = [];
  for (let i = 0; i < count; i++) {
    const opacity = 0.5 + (0.5 * i) / (count - 1);
    shades.push(`${baseColor.replace('1)', `${opacity})`)}`);
  }
  return shades;
};

// Elegant multi-color palette for pie chart
const pieColors = [
  '#5B8FF9', '#61DDAA', '#65789B', '#F6BD16', '#7262fd',
  '#78D3F8', '#9661BC', '#F6903D', '#008685', '#F08BB4'
];

function getThemeMode() {
  if (typeof window !== 'undefined') {
    if (document.body.classList.contains('dark') || document.documentElement.classList.contains('dark')) {
      return 'dark';
    }
    // Check for .chatbot-container.dark
    const chatbot = document.querySelector('.chatbot-container');
    if (chatbot && chatbot.classList.contains('dark')) return 'dark';
  }
  return 'light';
}

const PlotlyChart: React.FC<PlotlyChartProps> = ({
  data,
  chartType = 'bar',
  title = 'AskDB Chart',
}) => {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const columns = Object.keys(data[0] || {});
  if (columns.length < 2) return null;

  const x = data.map((row) => row[columns[0]]);
  const y = data.map((row) => row[columns[1]]);

  const baseColor = 'rgba(54, 94, 215, 1)'; // Deep blue
  const shades = generateShades(baseColor, x.length);

  let plotData: any = {};

  // Handle chart types
  if (chartType === 'pie') {
    plotData = {
      labels: x,
      values: y,
      type: 'pie',
      textinfo: 'label+percent',
      insidetextorientation: 'radial',
      marker: { colors: pieColors.slice(0, x.length) },
    };
  } else if (chartType === 'bar') {
    plotData = {
      x,
      y,
      type: 'bar',
      marker: {
        color: shades,
        line: { color: 'rgba(0,0,0,0.06)', width: 1 },
      },
      hovertemplate: `<b>%{x}</b><br>${columns[1]}: %{y}<extra></extra>`,
    };
  } else {
    plotData = {
      x,
      y,
      type: chartType,
      mode: chartType === 'scatter' ? 'markers+lines' : undefined,
      marker: {
        color: baseColor,
        line: { width: 2, color: '#2F54EB' },
      },
    };
  }

  // Theme-aware colors
  const mode = getThemeMode();
  const isDark = mode === 'dark';
  const bgColor = isDark ? '#181C2A' : 'rgba(255, 255, 255, 0.75)';
  const fontColor = isDark ? '#F3F4F6' : '#1F2937';
  const axisColor = isDark ? '#A0AEC0' : '#374151';
  const gridColor = isDark ? '#23263A' : '#E5E7EB';

  return (
    <div
      style={{
        borderRadius: '20px',
        backdropFilter: 'blur(12px)',
        background: bgColor,
        padding: '24px',
        boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.35)' : '0 8px 24px rgba(0,0,0,0.1)',
        margin: '2rem 0',
      }}
    >
      <h3
        style={{
          textAlign: 'center',
          fontSize: '1.5rem',
          fontWeight: 600,
          marginBottom: '1rem',
          color: fontColor,
        }}
      >
        {title}
      </h3>
      <Plot
        data={[plotData]}
        layout={{
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          title: { text: '' },
          xaxis: {
            title: { text: columns[0], font: { size: 14, color: axisColor } },
            tickfont: { color: axisColor },
            gridcolor: gridColor,
            zerolinecolor: gridColor,
          },
          yaxis: {
            title: { text: columns[1], font: { size: 14, color: axisColor } },
            tickfont: { color: axisColor },
            gridcolor: gridColor,
            zerolinecolor: gridColor,
          },
          margin: { l: 50, r: 30, b: 50, t: 20 },
          font: { family: 'Inter, sans-serif', color: fontColor },
          legend: { font: { color: fontColor } },
        }}
        config={{
          responsive: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['sendDataToCloud'],
        }}
        style={{ width: '100%', height: '400px' }}
      />
    </div>
  );
};

export default PlotlyChart;
