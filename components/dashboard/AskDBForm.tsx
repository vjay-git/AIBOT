import React, { useState } from 'react';
import { askDB } from '../../utils/api';
import PlotlyChart from './PlotlyChart';

const DEFAULT_USER_ID = '56376e63-0377-413d-8c9e-359028e2380d';

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

function isTabularData(answer: any) {
  // Heuristic: check if answer is a JSON array of objects with at least 2 keys
  if (typeof answer === 'string') {
    try {
      const parsed = JSON.parse(answer);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
        return parsed;
      }
      // Try 2D array
      const objArr = toObjectArrayFrom2D(parsed);
      if (objArr) return objArr;
    } catch {
      return null;
    }
  }
  if (Array.isArray(answer) && answer.length > 0 && typeof answer[0] === 'object') {
    return answer;
  }
  // Try 2D array
  const objArr = toObjectArrayFrom2D(answer);
  if (objArr) return objArr;
  return null;
}

const AskDBForm = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [rawAnswer, setRawAnswer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAnswer('');
    setRawAnswer(null);
    try {
      const res = await askDB({
        user_id: DEFAULT_USER_ID,
        question,
        dashboard: '',
        tile: ''
      });
      // Debug log always
      console.log('DEBUG: askDB response', res);
      if (res && res.answer) {
        // If answer is a nested object with a 2D array at answer.data?.data, extract it
        let extracted = res.answer;
        console.log('DEBUG: res.answer', res.answer);
        if (
          extracted &&
          typeof extracted === 'object' &&
          extracted.data &&
          Array.isArray(extracted.data)
        ) {
          extracted = extracted.data;
        } else if (
          extracted &&
          typeof extracted === 'object' &&
          extracted.data &&
          extracted.data.data &&
          Array.isArray(extracted.data.data)
        ) {
          extracted = extracted.data.data;
        }
        console.log('DEBUG: extracted for tabular', extracted);
        setAnswer(res.answer);
        setRawAnswer(extracted);
      } else {
        setAnswer('No answer received.');
      }
    } catch (err: any) {
      setError(err.message || 'Error contacting API');
    } finally {
      setLoading(false);
    }
  };

  // Always convert 2D array (first row headers, rest rows) to array of objects for tabularObjArr
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

  return (
    <div className="askdb-form-container">
      <form onSubmit={handleSubmit}>
        <label htmlFor="question">Ask a database question:</label>
        <input
          id="question"
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="e.g. What is the total sales for Q1?"
          required
        />
        <button type="submit" disabled={loading || !question.trim()}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
      {/* Render table only if tabularObjArr is a valid array of objects */}
      {tabularObjArr && Array.isArray(tabularObjArr) && tabularObjArr.length > 0 && typeof tabularObjArr[0] === 'object' && Object.keys(tabularObjArr[0]).length > 1 && (
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
      )}
      {/* Fallback: Render 2D array as plain HTML table if conversion to array of objects failed */}
      {is2DArray && (!tabularObjArr || tabularObjArr.length === 0 || typeof tabularObjArr[0] !== 'object') && (
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
      )}
      {/* Fallback for any other case */}
      {!is2DArray && (!tabularObjArr || tabularObjArr.length === 0) && answer && (
        <div className="askdb-answer">
          <strong>Answer:</strong>
          <div>{typeof answer === 'string' ? answer : JSON.stringify(answer)}</div>
        </div>
      )}
      {error && <div className="askdb-error">{error}</div>}
    </div>
  );
};

export default AskDBForm;
