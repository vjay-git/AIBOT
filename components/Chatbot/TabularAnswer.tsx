import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { BarChart2, LineChart, PieChart, ScatterChart, Table2, Grid3X3 } from 'lucide-react';

const DynamicPlotlyChart = dynamic(() => import('../dashboard/PlotlyChart'), { ssr: false });

interface TabularAnswerProps {
  rawAnswer: any;
}

// Beautiful Table Component (inline since we need it here)
const BeautifulTable: React.FC<{ data: Record<string, any>[]; isDark: boolean }> = ({ data, isDark }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const columns = Object.keys(data[0] || {});
  
  // Format cell values
  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toLocaleString();
    }
    return String(value || '');
  };
  
  // Detect if column contains numeric data
  const isNumericColumn = (columnKey: string): boolean => {
    return data.some(row => typeof row[columnKey] === 'number');
  };
  
  // Sort data
  const sortedData = useMemo(() => {
    let sortableData = [...data];
    
    // Filter by search term
    if (searchTerm) {
      sortableData = sortableData.filter(row =>
        Object.values(row).some(val =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Sort
    if (sortConfig) {
      sortableData.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
        }
      });
    }
    
    return sortableData;
  }, [data, sortConfig, searchTerm]);
  
  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };
  
  return (
    <div>
      {/* Search Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
          position: 'relative',
          maxWidth: '400px',
        }}>
          <input
            type="text"
            placeholder="Search table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 40px',
              borderRadius: '12px',
              border: `1px solid ${isDark ? 'rgba(75,85,99,0.3)' : 'rgba(209,213,219,0.4)'}`,
              background: isDark ? 'rgba(17,24,39,0.8)' : 'rgba(255,255,255,0.9)',
              color: isDark ? '#F9FAFB' : '#1F2937',
              fontSize: '0.875rem',
              outline: 'none',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = isDark ? 'rgba(96,165,250,0.5)' : 'rgba(59,130,246,0.5)';
              e.target.style.boxShadow = isDark 
                ? '0 0 0 3px rgba(96,165,250,0.1)' 
                : '0 0 0 3px rgba(59,130,246,0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = isDark ? 'rgba(75,85,99,0.3)' : 'rgba(209,213,219,0.4)';
              e.target.style.boxShadow = 'none';
            }}
          />
          <svg
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: isDark ? '#9CA3AF' : '#6B7280',
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      {/* Table */}
      <div style={{
        borderRadius: '16px',
        overflow: 'hidden',
        border: `1px solid ${isDark ? 'rgba(75,85,99,0.2)' : 'rgba(209,213,219,0.3)'}`,
        background: isDark ? 'rgba(17,24,39,0.4)' : 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
          }}>
            <thead>
              <tr style={{
                background: isDark 
                  ? 'linear-gradient(135deg, rgba(30,41,59,0.8) 0%, rgba(51,65,85,0.8) 100%)'
                  : 'linear-gradient(135deg, rgba(248,250,252,0.9) 0%, rgba(241,245,249,0.9) 100%)',
                backdropFilter: 'blur(12px)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}>
                {columns.map((column, idx) => (
                  <th
                    key={column}
                    onClick={() => handleSort(column)}
                    style={{
                      padding: '16px 20px',
                      textAlign: isNumericColumn(column) ? 'right' : 'left',
                      fontWeight: 600,
                      color: isDark ? '#F1F5F9' : '#1E293B',
                      borderBottom: `2px solid ${isDark ? 'rgba(71,85,105,0.3)' : 'rgba(226,232,240,0.8)'}`,
                      borderRight: idx < columns.length - 1 ? `1px solid ${isDark ? 'rgba(71,85,105,0.2)' : 'rgba(226,232,240,0.6)'}` : 'none',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'all 0.2s ease',
                      background: sortConfig?.key === column 
                        ? isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)'
                        : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (sortConfig?.key !== column) {
                        e.currentTarget.style.background = isDark ? 'rgba(71,85,105,0.2)' : 'rgba(226,232,240,0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (sortConfig?.key !== column) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: isNumericColumn(column) ? 'flex-end' : 'flex-start' }}>
                      <span style={{ fontSize: '0.875rem', letterSpacing: '0.025em' }}>
                        {column.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', opacity: 0.6 }}>
                        <svg width="8" height="4" viewBox="0 0 8 4" style={{ 
                          fill: sortConfig?.key === column && sortConfig.direction === 'asc' ? (isDark ? '#60A5FA' : '#3B82F6') : 'currentColor',
                          opacity: sortConfig?.key === column && sortConfig.direction === 'asc' ? 1 : 0.4 
                        }}>
                          <path d="M0 4L4 0L8 4H0Z"/>
                        </svg>
                        <svg width="8" height="4" viewBox="0 0 8 4" style={{ 
                          fill: sortConfig?.key === column && sortConfig.direction === 'desc' ? (isDark ? '#60A5FA' : '#3B82F6') : 'currentColor',
                          opacity: sortConfig?.key === column && sortConfig.direction === 'desc' ? 1 : 0.4 
                        }}>
                          <path d="M0 0L4 4L8 0H0Z"/>
                        </svg>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, rowIdx) => (
                <tr 
                  key={rowIdx}
                  style={{
                    background: rowIdx % 2 === 0 
                      ? (isDark ? 'rgba(30,41,59,0.2)' : 'rgba(248,250,252,0.5)')
                      : (isDark ? 'rgba(15,23,42,0.2)' : 'rgba(255,255,255,0.3)'),
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark 
                      ? 'rgba(59,130,246,0.1)' 
                      : 'rgba(59,130,246,0.05)';
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = rowIdx % 2 === 0 
                      ? (isDark ? 'rgba(30,41,59,0.2)' : 'rgba(248,250,252,0.5)')
                      : (isDark ? 'rgba(15,23,42,0.2)' : 'rgba(255,255,255,0.3)');
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  {columns.map((column, colIdx) => (
                    <td
                      key={column}
                      style={{
                        padding: '12px 20px',
                        textAlign: isNumericColumn(column) ? 'right' : 'left',
                        color: isDark ? '#E2E8F0' : '#334155',
                        borderBottom: `1px solid ${isDark ? 'rgba(71,85,105,0.2)' : 'rgba(226,232,240,0.6)'}`,
                        borderRight: colIdx < columns.length - 1 ? `1px solid ${isDark ? 'rgba(71,85,105,0.1)' : 'rgba(226,232,240,0.4)'}` : 'none',
                        fontWeight: isNumericColumn(column) ? 600 : 400,
                        fontFamily: isNumericColumn(column) ? 'ui-monospace, SFMono-Regular, monospace' : 'inherit',
                      }}
                    >
                      <span style={{
                        display: 'inline-block',
                        padding: isNumericColumn(column) ? '2px 8px' : '0',
                        borderRadius: isNumericColumn(column) ? '6px' : '0',
                        background: isNumericColumn(column) 
                          ? (isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)')
                          : 'transparent',
                        border: isNumericColumn(column) 
                          ? `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)'}`
                          : 'none',
                      }}>
                        {formatValue(row[column])}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Table Footer */}
      <div style={{
        marginTop: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.875rem',
        color: isDark ? '#9CA3AF' : '#6B7280',
      }}>
        <span>
          Showing {sortedData.length} of {data.length} rows
        </span>
        {searchTerm && (
          <span>
            Filtered by: "{searchTerm}"
          </span>
        )}
      </div>
    </div>
  );
};

const PlotlyChart = dynamic(() => import('../dashboard/PlotlyChart'), { ssr: false });

interface TabularAnswerProps {
  rawAnswer: any;
}

// Simple dark/light detector (match your chart component)
function useThemeMode(): 'light' | 'dark' {
  if (typeof window !== 'undefined') {
    return document.body.classList.contains('dark') ? 'dark' : 'light';
  }
  return 'light';
}

function toObjectArrayFrom2D(data: any): any[] | null {
  if (
    Array.isArray(data) &&
    data.length > 1 &&
    Array.isArray(data[0]) &&
    data[0].every((h: any) => typeof h === 'string')
  ) {
    const headers = data[0];
    return data.slice(1).map((row: any[]) => {
      const obj: any = {};
      headers.forEach((h, i) => {
        obj[h] = row[i];
      });
      return obj;
    });
  }
  return null;
}

const chartTypes = [
  { label: 'Bar', value: 'bar', icon: <BarChart2 size={18} /> },
  { label: 'Line', value: 'line', icon: <LineChart size={18} /> },
  { label: 'Pie', value: 'pie', icon: <PieChart size={18} /> },
  { label: 'Scatter', value: 'scatter', icon: <ScatterChart size={18} /> },
];

const TabularAnswer: React.FC<TabularAnswerProps> = ({ rawAnswer }) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'scatter'>('bar');
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const isDark = useThemeMode() === 'dark';

  const { tabularObjArr, is2DArray } = useMemo(() => {
    let tabularObjArr: any[] = [];
    let is2DArray = false;

    if (
      Array.isArray(rawAnswer) &&
      rawAnswer.length > 1 &&
      Array.isArray(rawAnswer[0]) &&
      rawAnswer[0].every((h: any) => typeof h === 'string')
    ) {
      is2DArray = true;
      const headers = rawAnswer[0];
      tabularObjArr = rawAnswer.slice(1).map((row: any[]) => {
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h] = row[i];
        });
        return obj;
      });
    } else if (Array.isArray(rawAnswer) && rawAnswer.length > 0 && typeof rawAnswer[0] === 'object') {
      tabularObjArr = rawAnswer;
    }

    return { tabularObjArr, is2DArray };
  }, [rawAnswer]);

  // Format cell values
  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toLocaleString();
    }
    return String(value || '');
  };

  // Detect if column contains numeric data
  const isNumericColumn = (columnKey: string): boolean => {
    return tabularObjArr.some(row => typeof row[columnKey] === 'number');
  };

  // Button base styles
  const getButtonStyle = (isActive: boolean, isIcon: boolean = false) => ({
    background: isActive 
      ? (isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)')
      : (isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.8)'),
    color: isActive 
      ? (isDark ? '#60A5FA' : '#2563EB')
      : (isDark ? '#E2E8F0' : '#374151'),
    border: `1px solid ${isActive 
      ? (isDark ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.3)')
      : (isDark ? 'rgba(71,85,105,0.3)' : 'rgba(209,213,219,0.4)')}`,
    borderRadius: isIcon ? '8px' : '12px',
    padding: isIcon ? '8px' : '8px 16px',
    fontWeight: 500,
    fontSize: '0.875rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(8px)',
    boxShadow: isActive 
      ? (isDark ? '0 4px 12px rgba(59,130,246,0.2)' : '0 4px 12px rgba(59,130,246,0.15)')
      : (isDark ? '0 2px 4px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.05)'),
  });

  const containerStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: '24px',
    background: isDark ? 'rgba(24,28,42,0.6)' : 'rgba(255,255,255,0.8)',
    backdropFilter: 'blur(16px)',
    padding: '2rem',
    boxShadow: isDark
      ? '0 12px 32px rgba(0,0,0,0.4)'
      : '0 12px 32px rgba(0,0,0,0.08)',
    border: `1px solid ${isDark ? 'rgba(71,85,105,0.2)' : 'rgba(209,213,219,0.3)'}`,
  };

  if (tabularObjArr && Array.isArray(tabularObjArr) && tabularObjArr.length > 0 && typeof tabularObjArr[0] === 'object' && Object.keys(tabularObjArr[0]).length > 1) {
    return (
      <div style={containerStyle}>
        {/* Control Panel */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px', 
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}>
          {/* View Toggle */}
          <div style={{
            display: 'flex',
            gap: '8px',
            background: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(248,250,252,0.8)',
            padding: '6px',
            borderRadius: '16px',
            border: `1px solid ${isDark ? 'rgba(71,85,105,0.2)' : 'rgba(209,213,219,0.3)'}`,
            backdropFilter: 'blur(8px)',
          }}>
            <button
              onClick={() => setView('chart')}
              style={getButtonStyle(view === 'chart')}
              onMouseEnter={(e) => {
                if (view !== 'chart') {
                  e.currentTarget.style.background = isDark ? 'rgba(71,85,105,0.3)' : 'rgba(243,244,246,0.9)';
                }
              }}
              onMouseLeave={(e) => {
                if (view !== 'chart') {
                  e.currentTarget.style.background = isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.8)';
                }
              }}
              aria-label="Show Chart"
            >
              <BarChart2 size={16} />
              Chart
            </button>
            <button
              onClick={() => setView('table')}
              style={getButtonStyle(view === 'table')}
              onMouseEnter={(e) => {
                if (view !== 'table') {
                  e.currentTarget.style.background = isDark ? 'rgba(71,85,105,0.3)' : 'rgba(243,244,246,0.9)';
                }
              }}
              onMouseLeave={(e) => {
                if (view !== 'table') {
                  e.currentTarget.style.background = isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.8)';
                }
              }}
              aria-label="Show Table"
            >
              <Table2 size={16} />
              Table
            </button>
          </div>

          {/* Chart Type Selector */}
          {view === 'chart' && (
            <>
              <div style={{
                width: '1px',
                height: '32px',
                background: isDark ? 'rgba(71,85,105,0.3)' : 'rgba(209,213,219,0.4)',
              }} />
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                background: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(248,250,252,0.8)',
                padding: '6px',
                borderRadius: '12px',
                border: `1px solid ${isDark ? 'rgba(71,85,105,0.2)' : 'rgba(209,213,219,0.3)'}`,
                backdropFilter: 'blur(8px)',
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: isDark ? '#94A3B8' : '#64748B',
                  paddingLeft: '8px',
                  paddingRight: '4px',
                }}>
                  Type:
                </span>
                {chartTypes.map((ct) => (
                  <button
                    key={ct.value}
                    onClick={() => setChartType(ct.value as any)}
                    style={getButtonStyle(chartType === ct.value, true)}
                    onMouseEnter={(e) => {
                      if (chartType !== ct.value) {
                        e.currentTarget.style.background = isDark ? 'rgba(71,85,105,0.3)' : 'rgba(243,244,246,0.9)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (chartType !== ct.value) {
                        e.currentTarget.style.background = isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.8)';
                      }
                    }}
                    aria-label={ct.label + ' Chart'}
                    title={ct.label + ' Chart'}
                  >
                    {ct.icon}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content */}
        {view === 'chart' ? (
          <DynamicPlotlyChart data={tabularObjArr} chartType={chartType} />
        ) : (
          <BeautifulTable data={tabularObjArr} isDark={isDark} />
        )}
      </div>
    );
  }

  // Fallback for 2D array data
  if (is2DArray && (!tabularObjArr || tabularObjArr.length === 0 || typeof tabularObjArr[0] !== 'object')) {
    return (
      <div style={containerStyle}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '24px',
          color: isDark ? '#94A3B8' : '#64748B',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}>
          <Grid3X3 size={16} />
          Data Table
        </div>
        
        <div style={{
          borderRadius: '16px',
          overflow: 'hidden',
          border: `1px solid ${isDark ? 'rgba(71,85,105,0.2)' : 'rgba(209,213,219,0.3)'}`,
          background: isDark ? 'rgba(15,23,42,0.4)' : 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem',
            }}>
              <thead>
                <tr style={{
                  background: isDark 
                    ? 'linear-gradient(135deg, rgba(30,41,59,0.8) 0%, rgba(51,65,85,0.8) 100%)'
                    : 'linear-gradient(135deg, rgba(248,250,252,0.9) 0%, rgba(241,245,249,0.9) 100%)',
                  backdropFilter: 'blur(12px)',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                }}>
                  {rawAnswer[0].map((col: string, i: number) => (
                    <th
                      key={i}
                      style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: isDark ? '#F1F5F9' : '#1E293B',
                        borderBottom: `2px solid ${isDark ? 'rgba(71,85,105,0.3)' : 'rgba(226,232,240,0.8)'}`,
                        borderRight: i < rawAnswer[0].length - 1 ? `1px solid ${isDark ? 'rgba(71,85,105,0.2)' : 'rgba(226,232,240,0.6)'}` : 'none',
                        fontSize: '0.875rem',
                        letterSpacing: '0.025em',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rawAnswer.slice(1).map((row: any[], idx: number) => (
                  <tr 
                    key={idx}
                    style={{
                      background: idx % 2 === 0 
                        ? (isDark ? 'rgba(30,41,59,0.2)' : 'rgba(248,250,252,0.5)')
                        : (isDark ? 'rgba(15,23,42,0.2)' : 'rgba(255,255,255,0.3)'),
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isDark 
                        ? 'rgba(59,130,246,0.1)' 
                        : 'rgba(59,130,246,0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = idx % 2 === 0 
                        ? (isDark ? 'rgba(30,41,59,0.2)' : 'rgba(248,250,252,0.5)')
                        : (isDark ? 'rgba(15,23,42,0.2)' : 'rgba(255,255,255,0.3)');
                    }}
                  >
                    {row.map((cell, i) => (
                      <td
                        key={i}
                        style={{
                          padding: '12px 20px',
                          color: isDark ? '#E2E8F0' : '#334155',
                          borderBottom: `1px solid ${isDark ? 'rgba(71,85,105,0.2)' : 'rgba(226,232,240,0.6)'}`,
                          borderRight: i < row.length - 1 ? `1px solid ${isDark ? 'rgba(71,85,105,0.1)' : 'rgba(226,232,240,0.4)'}` : 'none',
                        }}
                      >
                        {formatValue(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TabularAnswer;