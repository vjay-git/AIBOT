import React, { useState, useEffect, useRef } from 'react';
import { askDB } from '../../utils/api';
import InputBar from '../../components/Chatbot/InputBar';
import { ChatMessage } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

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

const Chatbot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: 'welcome',
      sender: 'bot', 
      text: 'Your data assistant is thinking...',
      timestamp: new Date().toISOString()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
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
      timestamp: new Date().toISOString()
    };
    
    setMessages(msgs => [...msgs, userMessage]);
    setLoading(true);
    setError('');
    
    try {
      const res = await askDB({
        user_id: DEFAULT_USER_ID,
        question: msg,
        dashboard: '',
        tile: ''
      });
      
      const botMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        text: res.answer,
        timestamp: new Date().toISOString()
      };
      
      setMessages(msgs => [...msgs, botMessage]);
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
      
      <div className="chatbot-messages">
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
              {msg.sender === 'bot' && (
                <div className="chatbot-avatar">
                  <img src="/images/bot-avatar.png" alt="Bot" 
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="%232563eb"><circle cx="12" cy="12" r="10"/></svg>';
                    }} 
                  />
                </div>
              )}
              <div className="chatbot-bubble">
                {msg.text}
              </div>
              {msg.sender === 'user' && (
                <div className="message-actions">
                  <button onClick={() => handleMessageAction(msg.id, 'copy')} className="action-icon">
                    <span>📋</span>
                  </button>
                  <button onClick={() => handleMessageAction(msg.id, 'edit')} className="action-icon">
                    <span>✏️</span>
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
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