import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { askDB } from '../../utils/api';
import InputBar from '../../components/Chatbot/InputBar';
import { ChatMessage } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from '../../components/Chatbot/MessageBubble';
import { useRouter } from 'next/router';
import { navItems, useNavigation } from '@/components/Layout/Layout';
import { renderAdditionalControls, renderFilters, renderSearchBox } from '@/components/common/common';
import SubcontentBar from '@/components/SubcontentBar/SubcontentBar';

// Subnav items for chatbot
export const chatbotTabs = [
  { id: 'chat-folders', title: 'Folders' },
  { id: 'patients', title: 'Patients' },
  { id: 'doctors', title: 'Doctors' },
  { id: 'branch', title: 'Branch' },
  { id: 'financials', title: 'Financials' },
  { id: 'prediction', title: 'Prediction' },
];

const DEFAULT_USER_ID = '56376e63-0377-413d-8c9e-359028e2380d';

// Welcome message component
const WelcomeMessage = React.memo(({ onSuggestionClick, suggestions }: { onSuggestionClick: (text: string) => void, suggestions: string[] }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="welcome-container"
  >
    <div className="welcome-header">
      <div className="welcome-avatar">
        <img
          src="/images/bot-avatar.png"
          alt="Bot"
          onError={e => {
            e.currentTarget.src =
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="%232563eb"><circle cx="12" cy="12" r="10"/></svg>';
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
      {suggestions.length === 0 ? (
        <>
          <div className="suggestion-chip" onClick={() => onSuggestionClick("Show me patient demographics")}>Show me patient demographics</div>
          <div className="suggestion-chip" onClick={() => onSuggestionClick("Analyze revenue trends")}>Analyze revenue trends</div>
          <div className="suggestion-chip" onClick={() => onSuggestionClick("Compare doctor performance")}>Compare doctor performance</div>
          <div className="suggestion-chip" onClick={() => onSuggestionClick("Generate a monthly report")}>Generate a monthly report</div>
        </>
      ) : (
        suggestions.map((s, i) => (
          <div className="suggestion-chip" key={i} onClick={() => onSuggestionClick(s)}>{s}</div>
        ))
      )
      }
    </div>
  </motion.div>
));

// Helpers
const greetings = [
  'ok', 'okay', 'got it', 'thanks', 'thank you', 'cool', 'great', 'nice', 'sure', 'alright', 'fine', 'good', 'noted', 'understood', 'roger', 'yep', 'yes', 'no', 'hmm', 'huh', 'hmmm', 'hmm.', 'huh.', 'hmmm.'
];
const isGreeting = (text: string) => greetings.includes(text.trim().toLowerCase());

const getTrueOriginalQuestion = (msg: ChatMessage, messages: ChatMessage[]): string => {
  let current = msg;
  let original = typeof current.text === 'string' ? current.text : '';
  while (current.replyTo) {
    const parent = messages.find(m => m.id === current.replyTo);
    if (!parent) break;
    if (typeof parent.text === 'string' && !isGreeting(parent.text)) {
      original = parent.text;
    }
    current = parent;
  }
  if (isGreeting(original)) {
    current = msg;
    let lastNonGreeting = original;
    while (current.replyTo) {
      const parent = messages.find(m => m.id === current.replyTo);
      if (!parent) break;
      if (typeof parent.text === 'string' && !isGreeting(parent.text)) {
        lastNonGreeting = parent.text;
      }
      current = parent;
    }
    return lastNonGreeting;
  }
  return original;
};

const getDisplayText = (text: string | any) => {
  if (typeof text === 'string') {
    const match = text.match(/New Question: (.*)$/i);
    if (match) return match[1].trim();
    const pipeMatch = text.match(/\| New Question: (.*)$/i);
    if (pipeMatch) return pipeMatch[1].trim();
    return text;
  }
  return typeof text === 'string' ? text : JSON.stringify(text);
};

const Chatbot = ({ shouldShowSubcontentBar }: any) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputBarRef = useRef<{ focusInput: () => void }>(null);
  const chatbotContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { activeNav, activeSubNav, handleNavSelect, handleSubNavSelect } = useNavigation(router);

  // Memoize subNavItems and subContentBarProps
  const subNavItems = useMemo(() => {
    try {
      switch (activeNav) {
        case 'dashboard':
          return require('../../pages/dashboard/index').dashboardTabs;
        case 'chatbot':
          return require('../../pages/chatbot/index').chatbotTabs;
        case 'database':
          return require('../../pages/database/index').databaseTabs;
        case 'schema':
          return require('../../pages/schema/index').schemaTabs;
        case 'llm':
          return require('../../pages/llm/index').llmTabs;
        case 'settings':
          return require('../../pages/user-settings/index').userSettingsTabs;
        case 'onboarding':
          return require('../../pages/customer-onboarding/index').onboardingTabs;
        case 'reports':
          return require('../../pages/reports/index').reportsTabs;
        default:
          return [];
      }
    } catch {
      return [];
    }
  }, [activeNav]);

  const subContentBarProps = useMemo(() => ({
    items: subNavItems || [],
    selectedId: activeSubNav,
    onSelect: handleSubNavSelect,
    title: navItems.find(item => item.id === activeNav)?.title || '',
    searchBox: renderSearchBox(activeNav, searchTerm, setSearchTerm),
    filters: renderFilters(activeNav),
    additionalControls: renderAdditionalControls(activeNav),
    sectionType: activeNav
  }), [subNavItems, activeSubNav, handleSubNavSelect, activeNav, searchTerm, setSearchTerm]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (replyTo && inputBarRef.current && typeof inputBarRef.current.focusInput === 'function') {
      inputBarRef.current.focusInput();
    }
  }, [replyTo]);

  // Fullscreen handlers
  const handleFullscreen = useCallback(() => {
    const el = chatbotContainerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleSend = useCallback(
    async (msg: string | Blob, isAudio = false) => {
      let userMessage: ChatMessage;
      let concatenatedQuestion = msg as string;
      if (replyTo && typeof msg === 'string') {
        const original = getTrueOriginalQuestion(replyTo, messages);
        concatenatedQuestion = `Original Questions: ${original} | New Question: ${msg}`;
      }
      if (isAudio && msg instanceof Blob) {
        userMessage = {
          id: `msg-${Date.now()}`,
          sender: 'user',
          text: '[Voice message]',
          timestamp: new Date().toISOString(),
          replyTo: replyTo?.id,
          type: 'audio',
          rawAnswer: msg
        };
      } else {
        userMessage = {
          id: `msg-${Date.now()}`,
          sender: 'user',
          text: concatenatedQuestion,
          timestamp: new Date().toISOString(),
          replyTo: replyTo?.id,
        };
      }
      setMessages(msgs => [...msgs, userMessage]);
      setReplyTo(null);
      setLoading(true);
      setError('');
      try {
        let res, response, contentType;
        if (isAudio && msg instanceof Blob) {
          const formData = new FormData();
          formData.append('audio', msg, 'audio.webm');
          response = await fetch('/ask_db', { method: 'POST', body: formData });
          contentType = response.headers.get('Content-Type');
        } else {
          res = await askDB({
            user_id: DEFAULT_USER_ID,
            question: concatenatedQuestion,
            dashboard: '',
            tile: ''
          });
          contentType = res?.contentType || 'application/json';
        }
        // Handle file responses
        if (
          contentType === 'application/pdf' ||
          contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
          let fileType: ChatMessage['type'] = 'file';
          if (contentType === 'application/pdf') fileType = 'pdf';
          if (contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') fileType = 'xlsx';
          if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') fileType = 'docx';
          let fileBlob;
          if (response) {
            fileBlob = await response.blob();
          } else if (res && res.file) {
            fileBlob = res.file;
          }
          const fileUrl = URL.createObjectURL(fileBlob);
          setMessages(msgs => [
            ...msgs,
            {
              id: `msg-${Date.now() + 1}`,
              sender: 'bot',
              text: '',
              timestamp: new Date().toISOString(),
              type: fileType,
              rawAnswer: fileUrl
            } as ChatMessage
          ]);
        } else if (contentType && contentType.startsWith('audio/')) {
          let audioUrl: string | undefined;
          if (response) {
            const audioBlob = await response.blob();
            audioUrl = URL.createObjectURL(audioBlob);
          } else if (res && res.audio) {
            audioUrl = res.audio;
          }
          setMessages(msgs => [
            ...msgs,
            {
              id: `msg-${Date.now() + 1}`,
              sender: 'bot',
              text: '',
              timestamp: new Date().toISOString(),
              type: 'audio',
              rawAnswer: audioUrl
            }
          ]);
        } else {
          let answer = res?.answer;
          let isTabular = false;
          if (
            Array.isArray(answer) &&
            answer.length > 1 &&
            Array.isArray(answer[0]) &&
            answer[0].every((h: any) => typeof h === 'string')
          ) {
            isTabular = true;
          } else if (Array.isArray(answer) && answer.length > 0 && typeof answer[0] === 'object') {
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
                rawAnswer: answer
              } as any
            ]);
          } else {
            setMessages(msgs => [
              ...msgs,
              {
                id: `msg-${Date.now() + 1}`,
                sender: 'bot',
                text: answer,
                timestamp: new Date().toISOString()
              }
            ]);
          }
        }
      } catch (err: any) {
        setMessages(msgs => [
          ...msgs,
          {
            id: `msg-${Date.now() + 1}`,
            sender: 'bot',
            text: 'Sorry, there was an error processing your request.',
            timestamp: new Date().toISOString()
          }
        ]);
        setError(err.message || 'API error');
      } finally {
        setLoading(false);
      }
    },
    [replyTo, messages]
  );

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const handleMessageAction = useCallback((id: string, action: 'copy' | 'edit') => {
    const message = messages.find(msg => msg.id === id);
    if (action === 'copy' && message) {
      navigator.clipboard.writeText(message.text);
    } else if (action === 'edit') {
      // Implement edit functionality
      console.log('Edit message', id);
    }
  }, [messages]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    handleSend(suggestion);
  }, [handleSend]);

  // Compute last 4 user prompts (most recent first)
  const last4Prompts = useMemo(() => {
    const userPrompts = messages.filter(m => m.sender === 'user' && m.text).map(m => getDisplayText(m.text));
    return userPrompts.slice(-4).reverse();
  }, [messages]);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {shouldShowSubcontentBar && (
        <div style={{ minWidth: 300, maxWidth: 320, flexShrink: 0, marginRight: '2.7rem' }}>
          <SubcontentBar {...subContentBarProps} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div ref={chatbotContainerRef} className={`chatbot-container ${theme}`}>
          <div className="chatbot-header">
            <h2 className="chatbot-title">Chat with database</h2>
            <div className="header-actions">
              <button
                className="fullscreen-toggle"
                onClick={handleFullscreen}
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? (
                  // Exit fullscreen icon
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 13L3 17M3 17H7M3 17V13" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13 13L17 17M17 17H13M17 17V13" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 7L3 3M3 3H7M3 3V7" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13 7L17 3M17 3H13M17 3V7" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  // Fullscreen icon
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 8V3H8" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 8V3H12" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 12V17H8" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 12V17H12" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
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
            {messages.length === 0 ? (
              <WelcomeMessage onSuggestionClick={handleSend} suggestions={last4Prompts} />
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

          {replyTo && (
            <div className="reply-context-bar">
              <span>Replying to: {replyTo.text.slice(0, 50)}</span>
              <button onClick={() => setReplyTo(null)} className="cancel-reply">Cancel</button>
            </div>
          )}

          <InputBar ref={inputBarRef} onSend={handleSend} theme={theme} suggestions={last4Prompts} />

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="chatbot-error"
            >
              <span className="error-message">{error}</span>
              <button className="error-close-btn" onClick={() => setError('')} aria-label="Close error">×</button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
