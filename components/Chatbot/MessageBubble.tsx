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
                {repliedToMsg.text ? repliedToMsg.text.slice(0, 80) : '[Tabular/Non-text answer]'}
              </div>
            </div>
          )}

          {/* Main message content */}
          {message.type === 'tabular' && message.rawAnswer ? (
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
          ) : (
            <div className="message-text">{message.text}</div>
          )}
        </div>
        <div className="message-timestamp">{formatTime(message.timestamp)}</div>
        {/* Reply button */}
        <div className="message-actions">
          <button
            className="action-button"
            title="Reply to this message"
            onClick={() => onReply(message)}
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