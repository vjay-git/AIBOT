import React, { useState } from 'react';
import dynamic from 'next/dynamic';

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
  { label: 'Bar', value: 'bar' },
  { label: 'Line', value: 'line' },
  { label: 'Pie', value: 'pie' },
  { label: 'Scatter', value: 'scatter' },
];

const TabularAnswer: React.FC<TabularAnswerProps> = ({ rawAnswer }) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'scatter'>('bar');
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
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 350px', minWidth: 320, maxWidth: 600 }}>
          <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>Chart Type:</span>
            {chartTypes.map((ct) => (
              <button
                key={ct.value}
                onClick={() => setChartType(ct.value as any)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: chartType === ct.value ? '2px solid #2563eb' : '1px solid #ccc',
                  background: chartType === ct.value ? '#e6f0ff' : '#fff',
                  color: chartType === ct.value ? '#2563eb' : '#333',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: 14,
                  marginRight: 4,
                }}
              >
                {ct.label}
              </button>
            ))}
          </div>
          <PlotlyChart data={tabularObjArr} chartType={chartType} />
        </div>
        <div style={{ flex: '1 1 350px', minWidth: 320, maxWidth: 600, overflowX: 'auto' }}>
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
