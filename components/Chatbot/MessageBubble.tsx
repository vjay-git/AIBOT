import React, { useState, useCallback, useMemo } from 'react';
import { ChatMessage } from '../../types';
import TabularAnswer from './TabularAnswer';
import { FiCornerUpLeft } from 'react-icons/fi';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { bookmarkMessageAPI, bookmarkMessageAPIUpdate } from '../../utils/api';

interface MessageBubbleProps {
  message: ChatMessage;
  messages: ChatMessage[];
  onReply: (msg: ChatMessage) => void;
  isBookmarked?: boolean; // Optional prop to indicate if the message is bookmarked
  bookmarks?: any[]; // Optional prop for bookmarks, if needed
  refreshBookmarks?: () => void; // Optional callback to refresh bookmarks after bookmarking
  onMessageUpdate?: (messageId: string, updates: Partial<ChatMessage>) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  messages, 
  onReply, 
  isBookmarked, 
  bookmarks = [],
  refreshBookmarks,
  onMessageUpdate 
}) => {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [showThanks, setShowThanks] = useState(false);
  const [showBookmarkPrompt, setShowBookmarkPrompt] = useState(false);
  const [bookmarkName, setBookmarkName] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  // Find the message being replied to, if any
  const repliedToMsg = message.replyTo
    ? messages.find((m) => m.id === message.replyTo)
    : undefined;

  // Get bookmark name for this message's queryId with proper handling
const bookmarkInfo = useMemo(() => {
  if (!message.queryId || !bookmarks.length) return null;
  
  for (const bookmark of bookmarks) {
    if (!bookmark.queries) continue;
    
    const matchingQuery = bookmark.queries.find((q: any) => {
      // Handle both string and array formats for query_id
      if (typeof q.query_id === 'string') {
        return q.query_id === message.queryId;
      } else if (Array.isArray(q.query_id)) {
        return q.query_id.includes(message.queryId);
      }
      return false;
    });
    
    if (matchingQuery) {
      return {
        name: bookmark.name || bookmark.bookmark_name || 'Unnamed Bookmark',
        id: bookmark.id || bookmark.bookmark_id
      };
    }
  }
  return null;
}, [message.queryId, bookmarks]);

// Simplified bookmark status checking
const isMessageBookmarked = useMemo(() => {
  // Check if THIS specific message was explicitly bookmarked
  if (message.bookmarked === true) return true;
  
  // Check if this message's queryId appears in bookmarks
  if (message.queryId && bookmarkInfo) return true;
  
  // Fallback to prop (for backward compatibility)
  return false;
}, [message.bookmarked, message.queryId, bookmarkInfo]);

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
      'ok', 'okay', 'got it', 'thanks', 'thank you', 'cool', 'great', 'nice', 
      'sure', 'alright', 'fine', 'good', 'noted', 'understood', 'roger', 
      'yep', 'yes', 'no', 'hmm', 'huh', 'hmmm', 'hmm.', 'huh.', 'hmmm.'
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

  // Bookmark handler
  const handleBookmarkClick = async () => {
    if (isMessageBookmarked) {
      // If already bookmarked, show bookmark info or do nothing
      return;
    }
    setShowBookmarkPrompt(true);
  };

 const handleBookmarkSubmit = async () => {
  if (!bookmarkName.trim() || !message.queryId) return;
  
  try {
    const existingBookmark = bookmarks.find(
      (b: any) => (b.name === bookmarkName.trim()) 
    );
    
    if (existingBookmark?.id) {
      // Update existing bookmark
      await bookmarkMessageAPIUpdate(message.queryId, existingBookmark.id);
    } else {
      // Create new bookmark
      await bookmarkMessageAPI([message.queryId], bookmarkName.trim());
    }
    
    setShowBookmarkPrompt(false);
    setBookmarkName('');
    
    // Update ONLY this specific message state
    if (onMessageUpdate) {
      onMessageUpdate(message.id, { bookmarked: true });
    }
    
    if (refreshBookmarks) {
      refreshBookmarks();
    }
  } catch (error) {
    console.error('Error bookmarking message:', error);
  }
};

  const handleBookmarkMouseEnter = useCallback(() => {
    if (isMessageBookmarked && bookmarkInfo) {
      setShowTooltip(true);
    }
  }, [isMessageBookmarked, bookmarkInfo]);

  const handleBookmarkMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

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
                {repliedToMsg.text ? getDisplayText(repliedToMsg.text).slice(0, 80) : '[Tabular/Non-text answer]'}
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

        {/* Bookmark icon for user messages */}
        {message.sender === 'user' && (
          <div className="feedback-row">
            <div 
              className="bookmark-container"
              style={{ position: 'relative', display: 'inline-block' }}
            >
              <button
                className="feedback-btn"
                aria-label="Bookmark"
                title={isMessageBookmarked ? `Bookmarked: ${bookmarkInfo?.name || 'Unknown'}` : "Bookmark this message"}
                style={{
                  color: isMessageBookmarked ? '#2563eb' : '#fff',
                  background: 'none',
                  border: 'none',
                  cursor: isMessageBookmarked ? 'default' : 'pointer',
                }}
                onClick={handleBookmarkClick}
                onMouseEnter={handleBookmarkMouseEnter}
                onMouseLeave={handleBookmarkMouseLeave}
              >
                <svg width="20" height="20" fill={isMessageBookmarked ? '#2563eb' : '#fff'} viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 0 0-2 2v12a1 1 0 0 0 1.447.894L10 16.118l5.553 1.776A1 1 0 0 0 17 17V5a2 2 0 0 0-2-2H5zm0 2h10v11.382l-4.553-1.455a1 1 0 0 0-.894 0L5 16.382V5z"/>
                </svg>
              </button>
              
              {/* Tooltip for bookmarked messages */}
              {showTooltip && isMessageBookmarked && bookmarkInfo && (
                <div className="bookmark-tooltip" style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#333',
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  zIndex: 1000,
                  marginBottom: '5px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  pointerEvents: 'none'
                }}>
                  <div style={{ fontWeight: 'bold' }}>Bookmark:</div>
                  <div>{bookmarkInfo.name}</div>
                  {/* Tooltip arrow */}
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '5px solid #333',
                  }} />
                </div>
              )}
            </div>
            
            {/* Bookmark name popup */}
            {showBookmarkPrompt && (
              <div className="bookmark-popup" style={{
                position: 'absolute',
                background: '#fff',
                border: '1px solid #ccc',
                borderRadius: 6,
                padding: 12,
                zIndex: 10,
                top: 30,
                left: 0,
                minWidth: 220,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                <div style={{ marginBottom: 8, fontWeight: 'bold' }}>Enter bookmark name:</div>
                <input
                  type="text"
                  value={bookmarkName}
                  onChange={e => setBookmarkName(e.target.value)}
                  style={{ 
                    width: '100%', 
                    marginBottom: 8, 
                    padding: '6px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  placeholder="Enter bookmark name..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleBookmarkSubmit();
                    } else if (e.key === 'Escape') {
                      setShowBookmarkPrompt(false);
                      setBookmarkName('');
                    }
                  }}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowBookmarkPrompt(false);
                      setBookmarkName('');
                    }}
                    style={{
                      background: '#f5f5f5',
                      color: '#666',
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBookmarkSubmit}
                    disabled={!bookmarkName.trim()}
                    style={{
                      background: bookmarkName.trim() ? '#2563eb' : '#ccc',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      padding: '6px 12px',
                      cursor: bookmarkName.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '14px'
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;