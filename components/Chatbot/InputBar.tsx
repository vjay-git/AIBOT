import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

type InputBarProps = {
  onSend: (msg: string) => void;
  theme: 'light' | 'dark';
};

const InputBar: React.FC<InputBarProps> = ({ onSend, theme }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [mode, setMode] = useState<'db' | 'web'>('db');
  const inputRef = useRef<HTMLTextAreaElement>(null);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSend(message);
    setMessage('');
    setShowSuggestions(false);
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      setActiveSuggestion(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault();
      setActiveSuggestion(prev => prev > 0 ? prev - 1 : prev);
    } else if (e.key === 'Tab' && showSuggestions && activeSuggestion >= 0) {
      e.preventDefault();
      setMessage(suggestions[activeSuggestion]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording functionality
  };

  const handleModeChange = (newMode: 'db' | 'web') => {
    setMode(newMode);
    inputRef.current?.focus();
  };

  const handleGenerateReport = () => {
    // Implement report generation
    console.log('Generating report...');
  };

  return (
    <motion.div 
      className={`chatbot-form ${theme}`}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mode-selector">
        <button
          type="button"
          className={`mode-btn ${mode === 'db' ? 'active' : ''}`}
          onClick={() => handleModeChange('db')}
        >
          Ask DB
        </button>
        <button
          type="button"
          className={`mode-btn ${mode === 'web' ? 'active' : ''}`}
          onClick={() => handleModeChange('web')}
        >
          Web Search
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="input-container">
          <button type="button" className="attachment-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'db' ? "Search for Analysis, Summary, etc..." : "Search the web..."}
            className={`chatbot-input ${theme}`}
            rows={1}
            style={{ resize: 'none' }}
          />
          
          <div className="input-actions">
            <motion.button
              type="button"
              className="action-btn generate-btn"
              onClick={handleGenerateReport}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 3v4a1 1 0 001 1h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9 9h1M9 13h6M9 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Generate Report
            </motion.button>
            
            <motion.button
              type="button"
              className={`voice-button ${isRecording ? 'recording' : ''}`}
              onClick={toggleRecording}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3s-3 1.34-3 3v6c0 1.66 1.34 3 3 3z" fill="currentColor"/>
                <path d="M17 12c0 2.76-2.24 5-5 5s-5-2.24-5-5m5 5v3m-3 0h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.button>
            
            <motion.button
              type="submit"
              className={`send-button ${!message.trim() ? 'disabled' : ''}`}
              disabled={!message.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
              </svg>
            </motion.button>
          </div>
        </div>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <motion.div 
          className={`suggestions-dropdown ${theme}`}
          ref={suggestionsRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {suggestions.map((suggestion, idx) => (
            <motion.div
              key={idx}
              className={`suggestion-item ${idx === activeSuggestion ? 'active' : ''}`}
              onClick={() => handleSuggestionClick(suggestion)}
              whileHover={{ backgroundColor: theme === 'light' ? '#f0f0f0' : '#2a2a2a' }}
            >
              {suggestion}
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default InputBar;