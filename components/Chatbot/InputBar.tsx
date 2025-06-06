import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Database, Globe } from 'lucide-react';

type QueryType = 'CHAT' | 'DB_QUERY' | 'SCRAP';

type InputBarProps = {
  onSend: (msg: string, queryType: QueryType) => void;
  theme: 'light' | 'dark';
  suggestions?: string[];
};

const InputBar = forwardRef(function InputBar(
  { onSend, theme, suggestions: propSuggestions = [] }: InputBarProps,
  ref
) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(propSuggestions);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  
  // Updated mode state - initially null (no selection)
  const [mode, setMode] = useState<'db' | 'web' | null>(null);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setSuggestions(propSuggestions);
  }, [propSuggestions]);

  useEffect(() => {
    if (message.trim().length > 2) {
      // Filter suggestions by input
      const filtered = propSuggestions.filter(s => s.toLowerCase().includes(message.toLowerCase()));
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setActiveSuggestion(-1);
    } else {
      setSuggestions(propSuggestions);
      setShowSuggestions(false);
    }
  }, [message, propSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  };

  // Function to determine query type based on mode selection
  const getQueryType = (): QueryType => {
    if (mode === 'db') return 'DB_QUERY';
    if (mode === 'web') return 'SCRAP'; // Changed from 'SEARCH' to 'SCRAP'
    return 'CHAT'; // Default for no selection or initial state
  };

  // Function to get placeholder text based on mode
  const getPlaceholderText = (): string => {
    if (mode === 'db') return 'Search for Analysis, Summary, etc...';
    if (mode === 'web') return 'Search the web...';
    return 'Type your message...'; // Default placeholder when no mode is selected
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Debug: Log mode and queryType
    const queryType = getQueryType();
    console.log('[InputBar] handleSubmit:', { mode, queryType, message });
    // If no message and no mode selected, send initial "Hi" message
    if (!message.trim() && mode === null) {
      onSend('Hi', 'CHAT');
      return;
    }
    if (!message.trim()) return;
    onSend(message, queryType);
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

  const handleVoiceSend = (audioBlob: Blob) => {
    if (onSend) {
      // For voice messages, determine query type and pass audio blob
      const queryType = getQueryType();
      console.log('[InputBar] handleVoiceSend:', { mode, queryType });
      (onSend as any)(audioBlob, queryType, true); // Add isAudio flag
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    } else {
      setIsRecording(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new window.MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (event: BlobEvent) => {
          audioChunksRef.current.push(event.data);
        };
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          handleVoiceSend(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorder.start();
      } catch (err) {
        setIsRecording(false);
        alert('Could not access microphone.');
      }
    }
  };

  const handleModeChange = (newMode: 'db' | 'web') => {
    // Toggle mode - if same mode is clicked, deselect it
    if (mode === newMode) {
      setMode(null);
    } else {
      setMode(newMode);
    }
    inputRef.current?.focus();
  };

  const handleGenerateReport = () => {
    // Implement report generation
    console.log('Generating report...');
  };

  // Speech-to-text logic
  const handleSpeechToText = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    let SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(prev => prev ? prev + ' ' + transcript : transcript);
        setIsRecognizing(false);
      };
      recognitionRef.current.onerror = () => {
        setIsRecognizing(false);
      };
      recognitionRef.current.onend = () => {
        setIsRecognizing(false);
      };
    }
    if (!isRecognizing) {
      setIsRecognizing(true);
      recognitionRef.current.start();
    } else {
      setIsRecognizing(false);
      recognitionRef.current.stop();
    }
  };

  // Expose focusInput method to parent
  useImperativeHandle(ref, () => ({
    focusInput: () => {
      inputRef.current?.focus();
    }
  }));

  return (
    <motion.div 
      className={`chatbot-form ${theme}`}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSubmit}>
        <div className="input-container">
          {/* Mode icons inside input bar, left-aligned */}
          <div className="input-modes">
            <button
              type="button"
              className={`mode-btn-icon${mode === 'db' ? ' active' : ''}`}
              onClick={() => handleModeChange('db')}
              aria-label="Ask DB"
              title="Ask Database"
            >
              <Database size={20} />
            </button>
            <button
              type="button"
              className={`mode-btn-icon${mode === 'web' ? ' active' : ''}`}
              onClick={() => handleModeChange('web')}
              aria-label="Web Search"
              title="Web Search"
            >
              <Globe size={20} />
            </button>
          </div>
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholderText()}
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
            </motion.button>
            <motion.button
              type="button"
              className={`voice-button ${isRecording ? 'recording' : ''}`}
              onClick={toggleRecording}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Waveform icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="9" width="2" height="6" fill="currentColor" />
                <rect x="6" y="7" width="2" height="10" fill="currentColor" />
                <rect x="10" y="5" width="2" height="14" fill="currentColor" />
                <rect x="14" y="7" width="2" height="10" fill="currentColor" />
                <rect x="18" y="9" width="2" height="6" fill="currentColor" />
              </svg>
            </motion.button>
            {/* Speech-to-text button */}
            <motion.button
              type="button"
              className={`speech-to-text-btn${isRecognizing ? ' recognizing' : ''}`}
              onClick={handleSpeechToText}
              title={isRecognizing ? 'Stop speech recognition' : 'Speak to type'}
              style={{ margin: '0 4px' }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Microphone icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3s-3 1.34-3 3v6c0 1.66 1.34 3 3 3z" fill="currentColor"/>
                <path d="M17 12c0 2.76-2.24 5-5 5s-5-2.24-5-5m5 5v3m-3 0h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {isRecognizing && <span style={{ marginLeft: 6, fontSize: 12 }}>Listening...</span>}
            </motion.button>
            <motion.button
              type="submit"
              className={`send-button ${!message.trim() && mode !== null ? 'disabled' : ''}`}
              disabled={!message.trim() && mode !== null}
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
});

export default InputBar;