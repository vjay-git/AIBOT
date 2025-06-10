import React, { FC, useMemo, useEffect, useState } from 'react';
import Plot from 'react-plotly.js';

interface PlotlyChartProps {
  data: Record<string, any>[];
  chartType?: 'bar' | 'line' | 'pie' | 'scatter';
  title?: string;
  colorPalette?: ColorPalette;
}

// Color palettes for charts
const COLOR_PALETTES = {
  classic: [
    '#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', 
    '#70AD47', '#264478', '#9E480E', '#636363', '#997300'
  ],
  vibrant: [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ],
  pastel: [
    '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
    '#E6E6FA', '#FFE4E1', '#F0E68C', '#E0FFFF', '#FAFAD2'
  ],
  ocean: [
    '#006994', '#13A5B7', '#2BC4C1', '#7DE2D1', '#B8F2E6',
    '#004E7C', '#0F7B8A', '#1E6091', '#2D4059', '#1A2332'
  ],
  sunset: [
    '#FF6B35', '#F7931E', '#FFD23F', '#06FFA5', '#118AB2',
    '#E63946', '#F77F00', '#FCBF49', '#06D6A0', '#073B4C'
  ],
  forest: [
    '#2D5016', '#3E6B1F', '#4F8428', '#609C31', '#70B53A',
    '#1B3409', '#2A4D12', '#39661B', '#487F24', '#57982D'
  ],
  monochrome: [
    '#000000', '#2C2C2C', '#585858', '#848484', '#B0B0B0',
    '#1A1A1A', '#404040', '#666666', '#8C8C8C', '#B8B8B8'
  ]
};

type ColorPalette = keyof typeof COLOR_PALETTES;

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
  title = 'Chart',
  colorPalette = 'classic',
}) => {
  if (!data?.length) return null;
  
  const { xCandidates, yCandidates, needsXSelection } = useMemo(() => detectAxes(data), [data]);
  const [xCol, setXCol] = useState<string>(xCandidates[0] || '');
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette>(colorPalette);

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
  const currentColors = COLOR_PALETTES[selectedPalette];
  const shades = useMemo(() => generateShades(currentColors[0], x.length), [currentColors, x.length]);

  // Build traces for multi-Y
  const traces = useMemo(() => {
    if (chartType === 'pie') {
      return [{
        type: 'pie',
        labels: x,
        values: y,
        textinfo: 'value+percent',
        textposition: 'outside',
        insidetextorientation: 'radial',
        marker: {
          colors: currentColors.slice(0, x.length),
          line: { color: '#fff', width: 1 },
        },
        sort: false,
        domain: { x: [0, 1], y: [0, 1] },
        showlegend: false,
      }];
    }
    // For bar/line/scatter, support multiple Y columns
    if (yCandidates.length > 1) {
      return yCandidates.map((col, idx) => {
        const base: any = {
          type: chartType === 'line' ? 'scatter' : chartType,
          x,
          y: data.map((r) => r[col]),
          name: '',
          marker: { color: currentColors[idx % currentColors.length] },
          showlegend: false,
          text: data.map((r) => {
            const value = r[col];
            if (typeof value === 'number') {
              return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` :
                     value >= 1000 ? `${(value / 1000).toFixed(1)}K` :
                     value.toLocaleString();
            }
            return value;
          }),
          textposition: chartType === 'bar' ? 'outside' : 'top center',
          textfont: { size: 11, color: isDark ? '#E5E7EB' : '#374151' },
        };
        if (chartType === 'line') {
          base.mode = 'lines+markers+text';
          base.line = { color: currentColors[idx % currentColors.length], width: 2 };
        } else if (chartType === 'scatter') {
          base.mode = 'markers+lines+text';
          base.line = { color: currentColors[idx % currentColors.length], width: 2 };
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
      hovertemplate: `<b>%{x}</b><br>%{y}<extra></extra>`,
      name: '',
      showlegend: false,
      text: y?.map((value) => {
        if (typeof value === 'number') {
          return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` :
                 value >= 1000 ? `${(value / 1000).toFixed(1)}K` :
                 value.toLocaleString();
        }
        return value;
      }),
      textposition: chartType === 'bar' ? 'outside' : 'top center',
      textfont: { size: 11, color: isDark ? '#E5E7EB' : '#374151' },
    };
    if (chartType === 'line') {
      base.mode = 'lines+markers+text';
      base.line = { color: shades[shades.length - 1], width: 2 };
    } else if (chartType === 'scatter') {
      base.mode = 'markers+lines+text';
      base.line = { color: shades[shades.length - 1], width: 2 };
    }
    return [base];
  }, [chartType, x, y, yCandidates, data, shades, currentColors, isDark]);

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
      showlegend: false, // Hide all legends
    };
    if (chartType === 'pie') {
      common.width = 360;
      common.height = 360;
    } else {
      common.xaxis = { title: '' }; // Remove x-axis title
      common.yaxis = { title: '' }; // Remove y-axis title
      common.width = 480;
      common.height = 360;
    }
    return common;
  }, [chartType, isDark]);

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
      {/* Control panel for X-axis and color palette selection */}
      {(needsXSelection && chartType !== 'pie') || true ? (
        <div style={{
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          {/* X-axis selector */}
          {needsXSelection && chartType !== 'pie' && (
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
          )}

          {/* Color palette selector - minimal version */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: isDark ? 'rgba(35,39,50,0.8)' : 'rgba(247,249,251,0.9)',
            padding: '6px 12px',
            borderRadius: 8,
            border: `1px solid ${isDark ? 'rgba(75,85,99,0.3)' : 'rgba(209,213,219,0.4)'}`,
            backdropFilter: 'blur(8px)',
          }}>
            <select
              value={selectedPalette}
              onChange={e => setSelectedPalette(e.target.value as ColorPalette)}
              style={{
                fontSize: '0.8rem',
                fontWeight: 500,
                padding: '4px 20px 4px 6px',
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                color: isDark ? '#F9FAFB' : '#1F2937',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='${isDark ? '%23A0AEC0' : '%234472C4'}' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 4px center',
                minWidth: 80,
              }}
            >
              {Object.keys(COLOR_PALETTES).map(palette => (
                <option key={palette} value={palette} style={{
                  background: isDark ? '#1F2937' : '#FFFFFF',
                  color: isDark ? '#F9FAFB' : '#1F2937',
                }}>
                  {palette.charAt(0).toUpperCase() + palette.slice(1)}
                </option>
              ))}
            </select>
            
            {/* Minimal color preview */}
            <div style={{
              display: 'flex',
              gap: 1,
            }}>
              {currentColors.slice(0, 3).map((color, idx) => (
                <div
                  key={idx}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: '1px solid rgba(255,255,255,0.4)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
      
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