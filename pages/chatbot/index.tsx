import React, { useState, useEffect, useRef } from 'react';
import { askDB } from '../../utils/api';
import InputBar from '../../components/Chatbot/InputBar';
import { ChatMessage } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import TabularAnswer from '../../components/Chatbot/TabularAnswer';
import MessageBubble from '../../components/Chatbot/MessageBubble';

const DEFAULT_USER_ID = '56376e63-0377-413d-8c9e-359028e2380d';

// Subnav items for chatbot
export const chatbotTabs = [
  { id: 'chat-folders', title: 'Folders' },
  { id: 'patients', title: 'Patients' },
  { id: 'doctors', title: 'Doctors' },
  { id: 'branch', title: 'Branch' },
  { id: 'financials', title: 'Financials' },
  { id: 'prediction', title: 'Prediction' },
];

// Welcome message component that shows when no messages exist
const WelcomeMessage = ({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="welcome-container"
    >
      <div className="welcome-header">
        <div className="welcome-avatar">
          <img src="/images/bot-avatar.png" alt="Bot" 
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="%232563eb"><circle cx="12" cy="12" r="10"/></svg>';
            }} 
          />
        </div>
        <h2 className="welcome-title">Hello, I'm your AI Assistant</h2>
      </div>
      <p className="welcome-description">
        I can help you analyze data, answer questions about your database, and provide insights.
        Ask me anything about your data!
      </p>
      <div className="suggestion-chips">
        <div className="suggestion-chip" onClick={() => onSuggestionClick("Show me patient demographics")}>
          Show me patient demographics
        </div>
        <div className="suggestion-chip" onClick={() => onSuggestionClick("Analyze revenue trends")}>
          Analyze revenue trends
        </div>
        <div className="suggestion-chip" onClick={() => onSuggestionClick("Compare doctor performance")}>
          Compare doctor performance
        </div>
        <div className="suggestion-chip" onClick={() => onSuggestionClick("Generate a monthly report")}>
          Generate a monthly report
        </div>
      </div>
    </motion.div>
  );
};

const Chatbot = () => {
  // Start with empty messages array to show welcome message
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (msg: string) => {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: msg,
      timestamp: new Date().toISOString(),
      replyTo: replyTo?.id,
    };
    
    setMessages(msgs => [...msgs, userMessage]);
    setReplyTo(null);
    setLoading(true);
    setError('');
    
    try {
      const res = await askDB({
        user_id: DEFAULT_USER_ID,
        question: msg,
        dashboard: '',
        tile: ''
      });
      
      // Detect tabular data (2D array or array of objects)
      let isTabular = false;
      if (
        Array.isArray(res.answer) &&
        res.answer.length > 1 &&
        Array.isArray(res.answer[0]) &&
        res.answer[0].every((h: any) => typeof h === 'string')
      ) {
        isTabular = true;
      } else if (Array.isArray(res.answer) && res.answer.length > 0 && typeof res.answer[0] === 'object') {
        isTabular = true;
      }
      if (isTabular) {
        setMessages(msgs => [
          ...msgs,
          {
            id: `msg-${Date.now() + 1}`,
            sender: 'bot',
            text: '',
            timestamp: new Date().toISOString(),
            type: 'tabular',
            rawAnswer: res.answer
          } as any
        ]);
      } else {
        setMessages(msgs => [
          ...msgs,
          {
            id: `msg-${Date.now() + 1}`,
            sender: 'bot',
            text: res.answer,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        text: 'Sorry, there was an error processing your request.',
        timestamp: new Date().toISOString()
      };
      setMessages(msgs => [...msgs, errorMessage]);
      setError(err.message || 'API error');
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleMessageAction = (id: string, action: 'copy' | 'edit') => {
    if (action === 'copy') {
      const message = messages.find(msg => msg.id === id);
      if (message) {
        navigator.clipboard.writeText(message.text);
      }
    } else if (action === 'edit') {
      // Implement edit functionality
      console.log('Edit message', id);
    }
  };

  // Function to handle clicking on suggestion chips
  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  return (
    <div className={`chatbot-container ${theme}`}>
      <div className="chatbot-header">
        <h2 className="chatbot-title">Chat with database</h2>
        <div className="header-actions">
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>

      {/* Reply context UI */}
      {replyTo && (
        <div className="reply-context-bar">
          <span>Replying to: {replyTo.text.slice(0, 50)}</span>
          <button onClick={() => setReplyTo(null)} className="cancel-reply">Cancel</button>
        </div>
      )}
      
      <div className="chatbot-messages">
        {/* Show welcome message if no messages exist */}
        {messages.length === 0 ? (
          <WelcomeMessage onSuggestionClick={handleSend} />
        ) : (
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`chatbot-message ${msg.sender === 'user' ? 'user' : ''}`}
              >
                <MessageBubble
                  message={msg}
                  messages={messages}
                  onReply={setReplyTo}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="chatbot-loading"
          >
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Update InputBar to pass the handleSuggestionClick function */}
      <InputBar onSend={handleSend} theme={theme} />

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="chatbot-error"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
};

export default Chatbot;