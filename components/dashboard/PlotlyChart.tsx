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

const PlotlyChart: FC<PlotlyChartProps> = ({
  data,
  chartType = 'bar',
  title = 'AskDB Chart',
}) => {
  if (!data?.length) return null;
  const allCols = Object.keys(data[0]);
  const [xCol, setXCol] = useState<string>(allCols[0]);

  // When columns change, reset xCol to first
  useEffect(() => {
    setXCol(allCols[0]);
  }, [JSON.stringify(allCols)]);

  // y columns are all except xCol
  const yCols = allCols.filter((c) => c !== xCol);
  const x = data.map((r) => r[xCol]);
  const y = yCols.length === 1 ? data.map((r) => r[yCols[0]]) : undefined;

  // debug to verify we have data
  useEffect(() => {
    console.log(`Plotting ${chartType}`, { x, y, xCol, yCols });
  }, [chartType, x, y, xCol, yCols]);

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
    if (yCols.length > 1) {
      return yCols.map((col, idx) => {
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
      hovertemplate: `<b>%{x}</b><br>${yCols[0]}: %{y}<extra></extra>`,
      name: yCols[0],
    };
    if (chartType === 'line') {
      base.mode = 'lines';
      base.line = { color: shades[shades.length - 1], width: 2 };
    } else if (chartType === 'scatter') {
      base.mode = 'markers+lines';
      base.line = { color: shades[shades.length - 1], width: 2 };
    }
    return [base];
  }, [chartType, x, y, yCols, data, shades]);

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
      showlegend: chartType === 'pie' || yCols.length > 1,
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
      common.yaxis = { title: yCols.length > 1 ? '' : yCols[0] };
      common.width = 480;
      common.height = 360;
    }
    return common;
  }, [chartType, xCol, yCols, isDark]);

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
    maxWidth: 640, // Prevents chart from being too wide
    width: '100%',
    overflow: 'auto', // Ensures scrollbars if content overflows
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
      <div style={{
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        <label
          style={{
            fontWeight: 600,
            fontSize: 15,
            color: isDark ? '#B0B8D1' : '#2C3A4B',
            letterSpacing: 0.2,
            marginRight: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{marginRight: 2, verticalAlign: 'middle'}} xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="9" width="14" height="2" rx="1" fill="#4472C4"/>
            <rect x="9" y="3" width="2" height="14" rx="1" fill="#4472C4"/>
          </svg>
          X Axis:
        </label>
        <select
          value={xCol}
          onChange={e => setXCol(e.target.value)}
          style={{
            fontSize: 15,
            padding: '6px 18px 6px 10px',
            borderRadius: 6,
            border: isDark ? '1px solid #334155' : '1px solid #B0B8D1',
            background: isDark ? '#23273A' : '#F7F9FB',
            color: isDark ? '#FFF' : '#222',
            boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.12)' : '0 1px 4px rgba(68,114,196,0.06)',
            outline: 'none',
            minWidth: 120,
            cursor: 'pointer',
            transition: 'border 0.2s, box-shadow 0.2s',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'16\' height=\'16\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M4 6l4 4 4-4\' stroke=\'%234472C4\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
          }}
        >
          {allCols.map(col => (
            <option key={col} value={col}>{col}</option>
          ))}
        </select>
      </div>
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
