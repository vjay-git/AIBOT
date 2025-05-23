import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { BarChart2, LineChart, PieChart, ScatterChart } from 'lucide-react';

const PlotlyChart = dynamic(() => import('../dashboard/PlotlyChart'), { ssr: false });

interface TabularAnswerProps {
  rawAnswer: any;
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

  if (tabularObjArr && Array.isArray(tabularObjArr) && tabularObjArr.length > 0 && typeof tabularObjArr[0] === 'object' && Object.keys(tabularObjArr[0]).length > 1) {
    return (
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button
            onClick={() => setView('chart')}
            style={{
              background: view === 'chart' ? '#e6f0ff' : '#fff',
              color: view === 'chart' ? '#2563eb' : '#333',
              border: view === 'chart' ? '2px solid #2563eb' : '1px solid #ccc',
              borderRadius: 6,
              padding: '4px 12px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            aria-label="Show Chart"
          >
            <BarChart2 size={16} style={{ marginRight: 4 }} /> Chart
          </button>
          <button
            onClick={() => setView('table')}
            style={{
              background: view === 'table' ? '#e6f0ff' : '#fff',
              color: view === 'table' ? '#2563eb' : '#333',
              border: view === 'table' ? '2px solid #2563eb' : '1px solid #ccc',
              borderRadius: 6,
              padding: '4px 12px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            aria-label="Show Table"
          >
            <table style={{ display: 'inline', width: 16, height: 16, marginRight: 4 }}><tbody><tr><td style={{ background: '#2563eb', width: 6, height: 6 }}></td><td style={{ background: '#2563eb', width: 6, height: 6 }}></td></tr><tr><td style={{ background: '#2563eb', width: 6, height: 6 }}></td><td style={{ background: '#2563eb', width: 6, height: 6 }}></td></tr></tbody></table> Table
          </button>
          {view === 'chart' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 16 }}>
              {chartTypes.map((ct) => (
                <button
                  key={ct.value}
                  onClick={() => setChartType(ct.value as any)}
                  style={{
                    background: chartType === ct.value ? '#e6f0ff' : '#fff',
                    color: chartType === ct.value ? '#2563eb' : '#333',
                    border: chartType === ct.value ? '2px solid #2563eb' : '1px solid #ccc',
                    borderRadius: 6,
                    padding: 4,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label={ct.label + ' Chart'}
                >
                  {ct.icon}
                </button>
              ))}
            </div>
          )}
        </div>
        {view === 'chart' ? (
          <PlotlyChart data={tabularObjArr} chartType={chartType} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="askdb-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  {Object.keys(tabularObjArr[0]).map((col) => (
                    <th key={col} style={{ border: '1px solid #ccc', padding: '8px', background: '#f5f5f5' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tabularObjArr.map((row: any, idx: number) => (
                  <tr key={idx}>
                    {Object.keys(tabularObjArr[0]).map((col) => (
                      <td key={col} style={{ border: '1px solid #ccc', padding: '8px' }}>{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
  if (is2DArray && (!tabularObjArr || tabularObjArr.length === 0 || typeof tabularObjArr[0] !== 'object')) {
    return (
      <div style={{ marginTop: 24, overflowX: 'auto' }}>
        <table className="askdb-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              {rawAnswer[0].map((col: string, i: number) => (
                <th key={i} style={{ border: '1px solid #ccc', padding: '8px', background: '#f5f5f5' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rawAnswer.slice(1).map((row: any[], idx: number) => (
              <tr key={idx}>
                {row.map((cell, i) => (
                  <td key={i} style={{ border: '1px solid #ccc', padding: '8px' }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return null;
};

export default TabularAnswer;
