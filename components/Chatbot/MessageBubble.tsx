import React, { useState } from 'react';
import { ChatMessage } from '../../types';
import TabularAnswer from './TabularAnswer';
import { FiCornerUpLeft } from 'react-icons/fi';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  messages: ChatMessage[];
  onReply: (msg: ChatMessage) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, messages, onReply }) => {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [showThanks, setShowThanks] = useState(false);

  // Find the message being replied to, if any
  const repliedToMsg = message.replyTo
    ? messages.find((m) => m.id === message.replyTo)
    : undefined;

  // Format timestamp (simple, can be improved)
  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle feedback click
  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    setShowThanks(true);
    // Optionally: send feedback to analytics endpoint here
    // e.g. sendFeedback({ messageId: message.id, type, timestamp: Date.now() })
    setTimeout(() => setShowThanks(false), 1500);
  };

  // Helper to get the true original question for reply chains (ignoring greetings)
  const isGreeting = (text: string) => {
    const greetings = [
      'ok', 'okay', 'got it', 'thanks', 'thank you', 'cool', 'great', 'nice', 'sure', 'alright', 'fine', 'good', 'noted', 'understood', 'roger', 'yep', 'yes', 'no', 'hmm', 'huh', 'hmmm', 'hmm.', 'huh.', 'hmmm.'
    ];
    return greetings.includes(text.trim().toLowerCase());
  };

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
    return original;
  };

  // Helper to display only the latest user question for concatenated payloads
  const getDisplayText = (text: string | any) => {
    if (typeof text === 'string') {
      // If text matches the concatenated format, extract only the New Question part
      const match = text.match(/New Question: (.*)$/i);
      if (match) return match[1].trim();
      // If text matches 'Original Questions: ... | New Question: ...', extract after last '| New Question:'
      const pipeMatch = text.match(/\| New Question: (.*)$/i);
      if (pipeMatch) return pipeMatch[1].trim();
      return text;
    }
    return typeof text === 'string' ? text : JSON.stringify(text);
  };

  return (
    <div
      className={`message-container ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
      tabIndex={0}
    >
      <div className="message-bubble">
        <div className="message-content">
          {/* Quoted/referenced message preview */}
          {repliedToMsg && (
            <div className="referenced-message">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ color: '#2563eb', marginRight: 6, fontSize: 16 }}>
                  <FiCornerUpLeft />
                </span>
                <span className="reply-sender">{repliedToMsg.sender === 'user' ? 'You' : 'Bot'}</span>
              </div>
              <div className="reply-text" style={{ color: '#444', fontStyle: 'italic', fontSize: 13 }}>
                {repliedToMsg.text ? getDisplayText(repliedToMsg.text).slice(0, 80) : '[Tabular/Non-text answer]'} {message.type} {message.rawAnswer}
              </div>
            </div>
          )}

          {/* Main message content */}
          {(message.type === 'tabular' || message.type === 'table') && message.rawAnswer ? (
            <TabularAnswer rawAnswer={message.rawAnswer} />
          ) : message.type === 'audio' && message.rawAnswer ? (
            <audio controls src={message.rawAnswer} style={{ width: '100%', margin: '8px 0' }} />
          ) : (['pdf', 'xlsx', 'docx'].includes(message.type || '') && message.rawAnswer) ? (
            <a
              href={message.rawAnswer}
              download={`response.${message.type}`}
              target="_blank"
              rel="noopener noreferrer"
              className="download-link"
              style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 500 }}
            >
              Download {message.type?.toUpperCase()} file
            </a>
          ) : Array.isArray(message.text) ? (
            <div className="message-text">
              {message.text.map((item, idx) => (
                <div key={idx}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</div>
              ))}
            </div>
          ) : typeof message.text === 'object' && message.text !== null ? (
            <div className="message-text">{JSON.stringify(message.text)}</div>
          ) : (
            <div className="message-text">{getDisplayText(message.text)}</div>
          )}
        </div>
        <div className="message-timestamp">{formatTime(message.timestamp)}</div>
        {/* Reply button */}
        <div className="message-actions">
          <button
            className="action-button"
            title="Reply to this message"
            onClick={() => {
              // When replying, pass a synthetic message with only the true original question as text
              const original = getTrueOriginalQuestion(message, messages);
              onReply({ ...message, text: original });
            }}
            aria-label="Reply"
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <FiCornerUpLeft style={{ fontSize: 16, marginRight: 2 }} />
          </button>
        </div>
        {/* Feedback icons for bot messages only */}
        {message.sender === 'bot' && (
          <div className="feedback-row">
            {showThanks ? (
              <span className="feedback-thanks">Thanks for your feedback!</span>
            ) : (
              <>
                <button
                  className={`feedback-btn${feedback === 'up' ? ' selected' : ''}`}
                  aria-label="Thumbs up"
                  onClick={() => handleFeedback('up')}
                  disabled={!!feedback}
                >
                  <ThumbsUp size={20} />
                </button>
                <button
                  className={`feedback-btn${feedback === 'down' ? ' selected' : ''}`}
                  aria-label="Thumbs down"
                  onClick={() => handleFeedback('down')}
                  disabled={!!feedback}
                >
                  <ThumbsDown size={20} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;