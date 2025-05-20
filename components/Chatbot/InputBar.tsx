import React, { useState, useRef, useEffect } from 'react';
import { askDB } from '../../utils/api';

type InputBarProps = {
  onSend: (msg: string) => void;
};

const InputBar: React.FC<InputBarProps> = ({ onSend }) => {
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'db' | 'web'>('db');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [apiError, setApiError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions (mock)
  const fetchSuggestions = async (query: string) => {
    return [
      'What is the total sales for Q1?',
      'Show me revenue trends for last quarter',
      'How many customers signed up last month?'
    ].filter(s => s.toLowerCase().includes(query.toLowerCase()));
  };

  useEffect(() => {
    if (message.trim().length > 2) {
      fetchSuggestions(message).then(newSuggestions => {
        setSuggestions(newSuggestions);
        setShowSuggestions(newSuggestions.length > 0);
        setActiveSuggestion(-1);
      });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [message]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!message.trim()) return;
    onSend(message); // <-- Fix: send user message to parent
    setMessage('');
    setShowSuggestions(false);
  };

  const handleModeChange = (newMode: 'db' | 'web') => {
    setMode(newMode);
    setMessage('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="chatbot-form" role="search">
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        <button
          type="button"
          className={`chatbot-mode-btn${mode === 'db' ? ' active' : ''}`}
          aria-label="Ask your database"
          onClick={() => handleModeChange('db')}
        >Ask DB</button>
        <button
          type="button"
          className={`chatbot-mode-btn${mode === 'web' ? ' active' : ''}`}
          aria-label="Search the web"
          onClick={() => handleModeChange('web')}
        >Web Search</button>
        <input
          ref={inputRef}
          value={message}
          onChange={handleInputChange}
          placeholder={mode === 'db' ? 'Ask your database…' : 'Search the web…'}
          className="chatbot-input"
          aria-label={mode === 'db' ? 'Ask your database' : 'Search the web'}
          autoComplete="off"
          style={{ flex: 1, marginLeft: 8 }}
        />
        <button
          type="button"
          className="chatbot-mic-btn"
          aria-label="Voice input (mic)"
          tabIndex={0}
          style={{ marginLeft: 4, marginRight: 4, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
          onClick={() => alert('Voice input not implemented yet')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3s-3 1.34-3 3v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.07 2.13 5.64 5 6.32V21h2v-2.68c2.87-.68 5-3.25 5-6.32h-2z" fill="#888"/>
          </svg>
        </button>
        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions-dropdown" ref={suggestionsRef} role="listbox">
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className={`suggestion-item${idx === activeSuggestion ? ' active' : ''}`}
                role="option"
                aria-selected={idx === activeSuggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setActiveSuggestion(idx)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
      {apiError && (
        <div className="chatbot-error chatbot-error-beautiful" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{verticalAlign: 'middle', marginRight: 6}} xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#ff3b30" fillOpacity="0.12"/>
            <path d="M12 7v5m0 4h.01" stroke="#ff3b30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{verticalAlign: 'middle'}}>{apiError}</span>
        </div>
      )}
      <button type="submit" className="chatbot-send" disabled={!message.trim()} aria-label="Send">
        Send
      </button>
    </form>
  );
};

export default InputBar;