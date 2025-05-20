import React, { useState } from 'react';
import { askDB } from '../../utils/api';

const DEFAULT_USER_ID = '56376e63-0377-413d-8c9e-359028e2380d';

const AskDBForm = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAnswer('');
    try {
      const res = await askDB({
        user_id: DEFAULT_USER_ID,
        question,
        dashboard: '',
        tile: ''
      });
      if (res && res.answer) {
        setAnswer(res.answer);
      } else {
        setAnswer('No answer received.');
      }
    } catch (err: any) {
      setError(err.message || 'Error contacting API');
    } finally {
      setLoading(false);
    }
  };

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
      {answer && (
        <div className="askdb-answer">
          <strong>Answer:</strong>
          <div>{answer}</div>
        </div>
      )}
      {error && <div className="askdb-error">{error}</div>}
    </div>
  );
};

export default AskDBForm;
