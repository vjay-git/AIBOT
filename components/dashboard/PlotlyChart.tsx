import React, { FC, useMemo, useEffect, useState } from 'react';
import Plot from 'react-plotly.js';

interface PlotlyChartProps {
  data: Record<string, any>[];
  chartType?: 'bar' | 'line' | 'pie' | 'scatter';
  title?: string;
}

// A vibrant, highly‐distinct palette for pie slices
const PIE_COLORS = [
  '#4472C4', // Blue
  '#ED7D31', // Orange
  '#A5A5A5', // Gray
  '#FFC000', // Gold
  '#5B9BD5', // Light Blue
  '#70AD47', // Green
  '#264478', // Dark Blue
  '#9E480E', // Brown
  '#636363', // Dark Gray
  '#997300', // Olive
];

// Softly mix a base color toward white to get lighter shades
function generateShades(base: string, count: number): string[] {
  const hex = base.replace('#', '');
  const r0 = parseInt(hex.slice(0, 2), 16);
  const g0 = parseInt(hex.slice(2, 4), 16);
  const b0 = parseInt(hex.slice(4, 6), 16);

  return Array.from({ length: count }, (_, i) => {
    // i = 0 → darkest (~base), i = count-1 → lightest (toward white)
    const t = i / Math.max(1, count - 1);
    const factor = 0.5 + 0.5 * t; // range [0.5, 1.0]
    const r = Math.round(r0 + (255 - r0) * (1 - factor));
    const g = Math.round(g0 + (255 - g0) * (1 - factor));
    const b = Math.round(b0 + (255 - b0) * (1 - factor));
    return `rgb(${r},${g},${b})`;
  });
}

// Simple dark/light detector (swap for your own theme hook)
function useThemeMode(): 'light' | 'dark' {
  if (typeof window !== 'undefined') {
    return document.body.classList.contains('dark') ? 'dark' : 'light';
  }
  return 'light';
}

// Smart axis detection function
function detectAxes(data: Record<string, any>[]) {
  if (!data?.length) return { xCandidates: [], yCandidates: [], needsXSelection: false };
  
  const allCols = Object.keys(data[0]);
  const xCandidates: string[] = [];
  const yCandidates: string[] = [];
  
  // Analyze each column
  allCols.forEach(col => {
    const values = data.map(row => row[col]);
    const hasNumbers = values.some(val => typeof val === 'number' && !isNaN(val));
    const hasStrings = values.some(val => typeof val === 'string');
    const uniqueValues = new Set(values).size;
    const totalValues = values.length;
    
    // Heuristics for X-axis candidates (categorical data, dates, or low-cardinality)
    if (
      hasStrings || 
      uniqueValues <= Math.min(20, totalValues * 0.5) || // Low cardinality
      col.toLowerCase().includes('date') ||
      col.toLowerCase().includes('time') ||
      col.toLowerCase().includes('month') ||
      col.toLowerCase().includes('year') ||
      col.toLowerCase().includes('category') ||
      col.toLowerCase().includes('type') ||
      col.toLowerCase().includes('name') ||
      col.toLowerCase().includes('group')
    ) {
      xCandidates.push(col);
    }
    
    // Y-axis candidates (numeric data)
    if (hasNumbers) {
      yCandidates.push(col);
    }
  });
  
  // If no clear X candidates, use first column
  if (xCandidates.length === 0 && allCols.length > 0) {
    xCandidates.push(allCols[0]);
  }
  
  // Remove X candidates from Y candidates to avoid overlap
  const filteredYCandidates = yCandidates.filter(col => !xCandidates.includes(col));
  
  // Determine if X-axis selection is needed
  const needsXSelection = xCandidates.length > 1 && filteredYCandidates.length > 1;
  
  return { 
    xCandidates, 
    yCandidates: filteredYCandidates, 
    needsXSelection 
  };
}

const PlotlyChart: FC<PlotlyChartProps> = ({
  data,
  chartType = 'bar',
  title = 'AskDB Chart',
}) => {
  if (!data?.length) return null;
  
  const { xCandidates, yCandidates, needsXSelection } = useMemo(() => detectAxes(data), [data]);
  const [xCol, setXCol] = useState<string>(xCandidates[0] || '');

  // When data changes, reset xCol to the best candidate
  useEffect(() => {
    if (xCandidates.length > 0) {
      setXCol(xCandidates[0]);
    }
  }, [xCandidates]);

  // y columns are all except xCol
  const x = data.map((r) => r[xCol]);
  const y = yCandidates.length === 1 ? data.map((r) => r[yCandidates[0]]) : undefined;

  // debug to verify we have data
  useEffect(() => {
    console.log(`Plotting ${chartType}`, { x, y, xCol, yCandidates, needsXSelection });
  }, [chartType, x, y, xCol, yCandidates, needsXSelection]);

  const mode = useThemeMode();
  const isDark = mode === 'dark';
  const shades = useMemo(() => generateShades('#4472C4', x.length), [x.length]);

  // Build traces for multi-Y
  const traces = useMemo(() => {
    if (chartType === 'pie') {
      return [{
        type: 'pie',
        labels: x,
        values: y,
        textinfo: 'label+percent',
        insidetextorientation: 'radial',
        marker: {
          colors: PIE_COLORS.slice(0, x.length),
          line: { color: '#fff', width: 1 },
        },
        sort: false,
        domain: { x: [0, 1], y: [0, 1] },
      }];
    }
    // For bar/line/scatter, support multiple Y columns
    if (yCandidates.length > 1) {
      return yCandidates.map((col, idx) => {
        const base: any = {
          type: chartType === 'line' ? 'scatter' : chartType,
          x,
          y: data.map((r) => r[col]),
          name: col,
          marker: { color: PIE_COLORS[idx % PIE_COLORS.length] },
        };
        if (chartType === 'line') {
          base.mode = 'lines';
          base.line = { color: PIE_COLORS[idx % PIE_COLORS.length], width: 2 };
        } else if (chartType === 'scatter') {
          base.mode = 'markers+lines';
          base.line = { color: PIE_COLORS[idx % PIE_COLORS.length], width: 2 };
        }
        return base;
      });
    }
    // Single Y
    const base: any = {
      type: chartType === 'line' ? 'scatter' : chartType,
      x,
      y,
      marker: { color: shades },
      hovertemplate: `<b>%{x}</b><br>${yCandidates[0]}: %{y}<extra></extra>`,
      name: yCandidates[0],
    };
    if (chartType === 'line') {
      base.mode = 'lines';
      base.line = { color: shades[shades.length - 1], width: 2 };
    } else if (chartType === 'scatter') {
      base.mode = 'markers+lines';
      base.line = { color: shades[shades.length - 1], width: 2 };
    }
    return [base];
  }, [chartType, x, y, yCandidates, data, shades]);

  // Layout
  const layout = useMemo(() => {
    const common: any = {
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { family: 'Inter, sans-serif', color: isDark ? '#EEE' : '#111' },
      margin:
        chartType === 'pie'
          ? { t: 20, b: 20, l: 20, r: 20 }
          : { t: 30, b: 50, l: 50, r: 30 },
      showlegend: chartType === 'pie' || yCandidates.length > 1,
      legend:
        chartType === 'pie'
          ? { orientation: 'h', y: -0.2, x: 0.5, xanchor: 'center' }
          : { font: { size: 11 } },
    };
    if (chartType === 'pie') {
      common.width = 360;
      common.height = 360;
    } else {
      common.xaxis = { title: xCol };
      common.yaxis = { title: yCandidates.length > 1 ? '' : yCandidates[0] };
      common.width = 480;
      common.height = 360;
    }
    return common;
  }, [chartType, xCol, yCandidates, isDark]);

  const config = {
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['sendDataToCloud' as any],
  };

  // Container styling
  const containerStyle: React.CSSProperties = {
    borderRadius: 24,
    backdropFilter: 'blur(16px)',
    background: isDark ? 'rgba(24,28,42,0.6)' : 'rgba(255,255,255,0.8)',
    padding: '2rem',
    boxShadow: isDark
      ? '0 12px 32px rgba(0,0,0,0.4)'
      : '0 12px 32px rgba(0,0,0,0.08)',
    margin: '2rem 0',
    maxWidth: 640,
    width: '100%',
    overflow: 'auto',
  };

  return (
    <div style={{ ...containerStyle, minWidth: 320 }}>
      <h3
        style={{
          textAlign: 'center',
          fontSize: '1.75rem',
          fontWeight: 600,
          marginBottom: '1rem',
          color: isDark ? '#FFF' : '#111',
          position: 'relative',
          paddingBottom: '0.5rem',
          wordBreak: 'break-word',
        }}
      >
        {title}
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 40,
            height: 3,
            background: '#4472C4',
            borderRadius: 2,
          }}
        />
      </h3>
      
      {/* Only show X-axis selector when needed */}
      {needsXSelection && chartType !== 'pie' && (
        <div style={{
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: isDark ? 'rgba(35,39,50,0.8)' : 'rgba(247,249,251,0.9)',
            padding: '8px 16px',
            borderRadius: 12,
            border: `1px solid ${isDark ? 'rgba(75,85,99,0.3)' : 'rgba(209,213,219,0.4)'}`,
            backdropFilter: 'blur(8px)',
            boxShadow: isDark 
              ? '0 4px 6px rgba(0,0,0,0.1)' 
              : '0 2px 4px rgba(68,114,196,0.08)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: isDark ? '#9CA3AF' : '#6B7280',
              fontSize: '0.875rem',
              fontWeight: 500,
              letterSpacing: '0.025em',
            }}>
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 20 20" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ marginRight: 2 }}
              >
                <rect x="3" y="9" width="14" height="2" rx="1" fill="#4472C4"/>
                <rect x="9" y="3" width="2" height="14" rx="1" fill="#4472C4"/>
              </svg>
              X-Axis:
            </div>
            <select
              value={xCol}
              onChange={e => setXCol(e.target.value)}
              style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                padding: '6px 28px 6px 10px',
                borderRadius: 8,
                border: 'none',
                background: isDark ? 'rgba(17,24,39,0.9)' : 'rgba(255,255,255,0.95)',
                color: isDark ? '#F9FAFB' : '#1F2937',
                boxShadow: isDark 
                  ? 'inset 0 1px 2px rgba(0,0,0,0.2)' 
                  : 'inset 0 1px 2px rgba(0,0,0,0.05)',
                outline: 'none',
                minWidth: 120,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='7' viewBox='0 0 12 7' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='${isDark ? '%23A0AEC0' : '%234472C4'}' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = isDark 
                  ? 'inset 0 1px 2px rgba(0,0,0,0.2), 0 0 0 3px rgba(68,114,196,0.2)' 
                  : 'inset 0 1px 2px rgba(0,0,0,0.05), 0 0 0 3px rgba(68,114,196,0.1)';
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = isDark 
                  ? 'inset 0 1px 2px rgba(0,0,0,0.2)' 
                  : 'inset 0 1px 2px rgba(0,0,0,0.05)';
              }}
            >
              {xCandidates.map(col => (
                <option key={col} value={col} style={{
                  background: isDark ? '#1F2937' : '#FFFFFF',
                  color: isDark ? '#F9FAFB' : '#1F2937',
                }}>
                  {col}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      
      <div style={{ width: '100%', minHeight: layout.height, overflow: 'auto' }}>
        <Plot
          data={traces}
          layout={layout}
          config={config}
          useResizeHandler
          style={{ width: '100%', minWidth: 320, height: layout.height, maxWidth: '100%' }}
        />
      </div>
    </div>
  );
};

export default PlotlyChart;