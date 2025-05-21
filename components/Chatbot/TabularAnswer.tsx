import React from 'react';
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

const TabularAnswer: React.FC<TabularAnswerProps> = ({ rawAnswer }) => {
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
      <>
        <div style={{ marginTop: 24 }}>
          <PlotlyChart data={tabularObjArr} />
        </div>
        <div style={{ marginTop: 24, overflowX: 'auto' }}>
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
      </>
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
