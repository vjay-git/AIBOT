import React, { useState } from 'react';
import { askDB } from '../../utils/api';
import InputBar from '../../components/Chatbot/InputBar';

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
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! Ask me anything about your data.' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (msg: string) => {
    setMessages(msgs => [...msgs, { sender: 'user', text: msg }]);
    setLoading(true);
    setError('');
    try {
      const res = await askDB({
        user_id: DEFAULT_USER_ID,
        question: msg,
        dashboard: '',
        tile: ''
      });
      setMessages(msgs => [...msgs, { sender: 'bot', text: res.answer }]);
    } catch (err: any) {
      setMessages(msgs => [...msgs, { sender: 'bot', text: 'Sorry, there was an error.' }]);
      setError(err.message || 'API error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <h2 className="chatbot-title">ECHO</h2>
      <div className="chatbot-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chatbot-message${msg.sender === 'user' ? ' user' : ''}`}>
            <span className="chatbot-bubble">
              {msg.text}
            </span>
          </div>
        ))}
        {loading && <div className="chatbot-loading">Bot is typing...</div>}
      </div>

  <InputBar onSend={handleSend} />

      {error && <div className="chatbot-error">{error}</div>}
    </div>
  );
};

export default Chatbot;