import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { askDB, fetchThreadById, getQueryById } from '../../utils/api';
import InputBar from '../../components/Chatbot/InputBar';
import { ChatMessage } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from '../../components/Chatbot/MessageBubble';
import { set } from 'date-fns';

const DEFAULT_USER_ID = '56376e63-0377-413d-8c9e-359028e2380d';

// --- ChatbotProps and state ---
interface ChatbotProps {
  selectedChatId: string;
  selectedNewChatId: string;
  chatData?: any[];
  setNewChatStarted: (started: boolean) => void;
  isBookmarked: boolean;
  bookmarks: any[];
  refreshBookmarks: () => void;
  isFromBookmarks?: boolean;
}

const WelcomeMessage = React.memo(({ onSuggestionClick, suggestions }: {
  onSuggestionClick: (text: string) => void;
  suggestions: string[];
}) => {
  const defaultSuggestions = [
    "Show me patient demographics",
    "Analyze revenue trends",
    "Compare doctor performance",
    "Generate a monthly report"
  ];

  const displaySuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

  return (
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
        {displaySuggestions.map((suggestion, i) => (
          <div
            className="suggestion-chip"
            key={i}
            onClick={() => onSuggestionClick(suggestion)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSuggestionClick(suggestion);
              }
            }}
          >
            {suggestion}
          </div>
        ))}
      </div>
    </motion.div>
  );
});

const Chatbot: React.FC<ChatbotProps> = ({
  selectedChatId,
  selectedNewChatId,
  chatData,
  setNewChatStarted,
  isBookmarked,
  bookmarks,
  refreshBookmarks,
  isFromBookmarks = false
}) => {

  // Enhanced state management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [queryIds, setQueryIds] = useState<string[]>([]);
  const [isNewChatContext, setIsNewChatContext] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputBarRef = useRef<{ focusInput: () => void }>(null);
  const chatbotContainerRef = useRef<HTMLDivElement>(null);

  // Enhanced scroll to bottom function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Helper function to check if a query ID exists in bookmarks
  const isQueryIdBookmarked = useCallback((queryId: string): boolean => {
    return bookmarks.some(bookmark => 
      bookmark.queries?.some((q: any) => q.query_id === queryId)
    );
  }, [bookmarks]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Enhanced new chat handling
  useEffect(() => {
    if (selectedNewChatId) {
      console.log('Starting new chat:', selectedNewChatId);
      setMessages([]);
      setReplyTo(null);
      setThreadId(null);
      setQueryIds([]);
      setIsNewChatContext(true);
      setError('');

      // Clear localStorage for new chat
      localStorage.removeItem('chatbot_threadId');
      localStorage.setItem('chatbot_queryIds', JSON.stringify([]));
    }
  }, [selectedNewChatId]);

  // FIXED: Enhanced existing chat loading with better state management
  useEffect(() => {
    console.log('Chatbot useEffect triggered:', {
      selectedChatId,
      selectedNewChatId,
      isFromBookmarks,
      bookmarksCount: bookmarks.length
    });
    
    const loadExistingChat = async () => {
      if (!selectedChatId) return;

      if (isFromBookmarks) {
        console.log('Loading bookmark with ID:', selectedChatId);
        const allBookmarkMessages: ChatMessage[] = [];
        let selectedBookmark = bookmarks.find(b => b.id === selectedChatId || b.bookmark_id === selectedChatId);

        // Check if bookmark was found
        if (!selectedBookmark) {
          console.error('Bookmark not found with ID:', selectedChatId);
          setError('Bookmark not found');
          setLoading(false);
          return;
        }

        // Check if bookmark has queries
        if (selectedBookmark.queries && Array.isArray(selectedBookmark.queries)) {
          for (const q of selectedBookmark.queries) {
            let id = q.query_id;
            if (q.query_id == null) continue; // Skip if no query_id
            if(Array.isArray(q.query_id) && q.query_id.length === 0) id = q.query_id[0]; 
            
            try {
              const queryObj = await getQueryById(q.query_id);
              if (!queryObj) {
                console.warn('Query not found:', q.query_id);
                continue; // Skip if not found
              }

              const msgs = convertQueryResponseToChatMessages(queryObj, selectedBookmark.id || selectedBookmark.bookmark_id);
              allBookmarkMessages.push(...msgs);
            } catch (error) {
              console.error('Error fetching query:', q.query_id, error);
              continue; // Skip this query and continue with others
            }
          }
          setMessages(allBookmarkMessages);
        } else {
          console.warn('Bookmark has no queries or queries is not an array:', selectedBookmark);
          setMessages([]);
        }
        return;
      }
      
      console.log('Loading regular chat with ID:', selectedChatId);
      setMessages([]);
      setReplyTo(null);
      setIsNewChatContext(false);
      setError('');
      setLoading(true);

      try {
        const data = await fetchThreadById(selectedChatId);
        const chatMessages = await convertApiMessagesToChatMessages(data);

        setMessages(chatMessages);
        setThreadId(selectedChatId);

        console.log('Loaded chat messages:', chatMessages.length);
      } catch (err) {
        console.error('Failed to fetch thread:', err);
        setError('Failed to load chat history');
      } finally {
        setLoading(false);
      }
    };

    if (selectedChatId && selectedChatId !== selectedNewChatId) {
      loadExistingChat();
    }
  }, [selectedChatId, selectedNewChatId, isFromBookmarks, bookmarks]);

  // Focus input when replying
  useEffect(() => {
    if (replyTo && inputBarRef.current?.focusInput) {
      inputBarRef.current.focusInput();
    }
  }, [replyTo]);

// Fixed convertQueryResponseToChatMessages function to handle query_id arrays

const convertQueryResponseToChatMessages = (response: any, bookmarkId?: string): ChatMessage[] => {
  const messages: ChatMessage[] = [];
  const messageGroups = Array.isArray(response.message) && Array.isArray(response.message[0])
    ? response.message[0]
    : response.message;

  for (let idx = 0; idx < messageGroups?.length; idx++) {
    const msg = messageGroups[idx];
    let sender: "user" | "bot" = msg.role === "user" ? "user" : "bot";
    let text = "";
    let type: ChatMessage["type"] = "text";
    let rawAnswer: any = undefined;

    // Skip system/SQL messages
    if (typeof msg.content === "string" && msg.content.startsWith("SQL Generated by LLM:")) continue;
    if (msg.table_used) continue;

    if (typeof msg.content === "string") {
      text = msg.content;
    } else if (typeof msg.results === "string") {
      text = msg.results;
    } else if (typeof msg.results === "object" && msg.results?.data) {
      rawAnswer = msg.results.type == 'table' ? msg.results.data.data : msg.results.data;
      text = msg.results.data || msg.results.data.data;
      type = msg.results.type as ChatMessage["type"] || "text";
    } else {
      text = "";
    }

    if (text === null || text === undefined || (typeof text === "string" && text.trim() === "")) continue;

    messages.push({
      id: `${response.query_id}-${idx}`,
      sender,
      text,
      timestamp: new Date().toISOString(),
      type,
      rawAnswer,
      queryId: response.query_id,
      bookmarkId,
      bookmarked: true
    });
  }
  return messages;
}

  // Welcome message component that shows when no messages exist
  WelcomeMessage.displayName = 'WelcomeMessage';

  // Helper to check greetings/non-question phrases
  const isGreeting = (text: string): boolean => {
    const greetings = [
      'ok', 'okay', 'got it', 'thanks', 'thank you', 'cool', 'great', 'nice',
      'sure', 'alright', 'fine', 'good', 'noted', 'understood', 'roger',
      'yep', 'yes', 'no', 'hmm', 'huh', 'hmmm', 'hmm.', 'huh.', 'hmmm.'
    ];
    return greetings.includes(text.trim().toLowerCase());
  };

  // Helper to get the true original question for reply chains (ignoring greetings)
  const getTrueOriginalQuestion = (msg: ChatMessage, messages: ChatMessage[]): string => {
    let current = msg;
    let original = typeof current.text === 'string' ? current.text : '';

    // Traverse to the root of the reply chain
    while (current.replyTo) {
      const parent = messages.find(m => m.id === current.replyTo);
      if (!parent) break;

      if (typeof parent.text === 'string' && !isGreeting(parent.text)) {
        original = parent.text;
      }
      current = parent;
    }

    // After traversing, check if the root is a greeting, if so, skip it
    if (isGreeting(original)) {
      // Try to find the first non-greeting up the chain
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

  // Helper to display only the latest user question for concatenated payloads
  const getDisplayText = (text: string | any): string => {
    if (typeof text === 'string') {
      // If text matches the concatenated format, extract only the New Question part
      const match = text.match(/New Question: (.*)$/i);
      if (match) return match[1].trim();

      // If text matches 'Original Questions: ... | New Question: ...', extract after last '| New Question:'
      const pipeMatch = text.match(/\| New Question: (.*)$/i);
      if (pipeMatch) return pipeMatch[1].trim();

      return text;
    }
    return typeof text === 'object' && text !== null ? JSON.stringify(text) : String(text || '');
  };

  // Enhanced function to convert API response to ChatMessage[]
  const convertApiMessagesToChatMessages = async (apiData: any): Promise<ChatMessage[]> => {
    try {
      // Remove threads with no queries
      if (!apiData?.Thread?.queries || !Array.isArray(apiData.Thread.queries) || apiData.Thread.queries.length === 0) {
        return [];
      }

      let fileType: ChatMessage['type'] = 'file';
      const allMessages: ChatMessage[] = [];

      for (const query of apiData.Thread.queries) {
        // Check if this query is bookmarked
        const isThisQueryBookmarked = isQueryIdBookmarked(query.query_id);

        // Flatten messages if it's an array of arrays, else use as is
        let flatMessages: any[] = [];
        if (Array.isArray(query.messages) && Array.isArray(query.messages[0])) {
          flatMessages = query.messages.flat();
        } else if (Array.isArray(query.messages)) {
          flatMessages = query.messages;
        }

        for (let idx = 0; idx < flatMessages.length; idx++) {
          const msg = flatMessages[idx];
          let sender: "user" | "bot" = msg.role === "user" ? "user" : "bot";
          let text = "";
          let type: ChatMessage["type"] = "text";
          let rawAnswer: any = undefined;

          // Skip messages where content starts with "SQL Generated by LLM:" or has table_used
          if ((typeof msg.content === "string" && msg.content.startsWith("SQL Generated by LLM:")) || msg.table_used) {
            continue;
          }

          if (typeof msg.content === "string") {
            text = msg.content;
          } else if (typeof msg.results === "string") {
            // Special handling for "file downloaded"
            if (msg.results === "file downloaded" && idx > 0) {
              const prevMsg = flatMessages[idx - 1];
              if (prevMsg && typeof prevMsg.content === "string" && prevMsg.content.startsWith("SQL Generated by LLM:")) {
                try {
                  let res: any = await askDB({
                    user_id: DEFAULT_USER_ID,
                    question: prevMsg.content,
                    dashboard: '',
                    tile: '',
                    thread_id: apiData.Thread.thread_id
                  });

                  const contentType = res?.contentType || 'application/json';
                  if (['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(contentType)) {
                    if (contentType === 'application/pdf') fileType = 'pdf';
                    if (contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') fileType = 'xlsx';
                    if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') fileType = 'docx';

                    let fileBlob;
                    if (res && !res.file) {
                      fileBlob = await res.blob();
                    } else if (res && res.file) {
                      fileBlob = res.file;
                    }

                    if (fileBlob) {
                      const fileUrl = URL.createObjectURL(fileBlob);
                      allMessages.push({
                        id: `${query.query_id}-${idx}`,
                        sender,
                        text: "Download file",
                        timestamp: new Date().toISOString(),
                        type: fileType,
                        rawAnswer: fileUrl,
                        queryId: query.query_id,
                        bookmarked: isThisQueryBookmarked
                      });
                    }
                  }
                } catch (error) {
                  console.error('Error processing file download:', error);
                }
              }
              continue; // Skip normal push for this message
            }
            text = msg.results;
          } else if (typeof msg.results === "object" && msg.results?.data) {
            rawAnswer = msg.results.data.data;
            text = msg.results.data || msg.results.data.data;
            type = msg.results.type as ChatMessage["type"] || "text";
          } else {
            text = "";
          }

          // Remove messages where text is null, undefined, or empty string
          if (text === null || text === undefined || (typeof text === "string" && text.trim() === "")) {
            continue;
          }

          allMessages.push({
            id: `${query.query_id}-${idx}`,
            sender,
            text,
            timestamp: new Date().toISOString(),
            type,
            rawAnswer,
            queryId: query.query_id,
            bookmarked: isThisQueryBookmarked
          });
        }
      }

      return allMessages;
    } catch (error) {
      console.error('Error converting API messages to ChatMessages:', error);
      return [];
    }
  };

  // Enhanced fullscreen handlers
  const handleFullscreen = useCallback(() => {
    const el = chatbotContainerRef.current;
    if (!el) return;

    try {
      if (!document.fullscreenElement) {
        el.requestFullscreen?.();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  // Listen for fullscreen change
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Persist thread data
  useEffect(() => {
    if (threadId) {
      localStorage.setItem('chatbot_threadId', threadId);
    }
    localStorage.setItem('chatbot_queryIds', JSON.stringify(queryIds));
  }, [threadId, queryIds]);

  // Helper function to handle API request and response formatting
  async function askDbAndFormatResponse({
    msg,
    isAudio,
    replyTo,
    messages,
    threadId,
    isNewChatContext,
    setNewChatStarted,
  }: {
    msg: string | Blob;
    isAudio: boolean;
    replyTo: ChatMessage | null;
    messages: ChatMessage[];
    threadId: string | null;
    isNewChatContext: boolean;
    setNewChatStarted: (started: boolean) => void;
  }) {
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
        rawAnswer: msg,
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

    let res: any, response, contentType;
    let botMessages: ChatMessage[] = [];
    let newThreadId: string | null = threadId;

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
        tile: '',
        thread_id: threadId || '',
      });
      contentType = res?.contentType || 'application/json';
    }

    if (!threadId && res?.thread_id) {
      newThreadId = res.thread_id;
      if (isNewChatContext) setNewChatStarted(true);
    }

    // Handle different response types
    if (
      [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ].includes(contentType)
    ) {
      let fileType: ChatMessage['type'] = 'file';
      if (contentType === 'application/pdf') fileType = 'pdf';
      if (contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') fileType = 'xlsx';
      if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') fileType = 'docx';

      let fileBlob;
      if (response) {
        fileBlob = await response.blob();
      } else if (res?.file) {
        fileBlob = res.file;
      }

      if (fileBlob) {
        const fileUrl = URL.createObjectURL(fileBlob);
        botMessages.push({
          id: `msg-${Date.now() + 1}`,
          sender: 'bot',
          text: '',
          timestamp: new Date().toISOString(),
          type: fileType,
          rawAnswer: fileUrl,
          queryId: res?.query_id || '',
        });
      }
    } else if (contentType?.startsWith('audio/')) {
      let audioUrl: string | undefined;
      if (response) {
        const audioBlob = await response.blob();
        audioUrl = URL.createObjectURL(audioBlob);
      } else if (res?.audio) {
        audioUrl = res.audio;
      }

      if (audioUrl) {
        botMessages.push({
          id: `msg-${Date.now() + 1}`,
          sender: 'bot',
          text: '',
          timestamp: new Date().toISOString(),
          type: 'audio',
          rawAnswer: audioUrl,
          queryId: res?.query_id || '',
        });
      }
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

      botMessages.push({
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        text: isTabular ? '' : answer || 'No response received',
        timestamp: new Date().toISOString(),
        type: isTabular ? 'tabular' : 'text',
        rawAnswer: isTabular ? answer : undefined,
        queryId: res?.query_id || '',
      });
    }

    return {
      userMessage,
      botMessages,
      res,
      newThreadId,
    };
  }

// Fixed handleSend function with proper message sequencing
const handleSend = useCallback(
  async (msg: string | Blob, isAudio = false) => {
    setReplyTo(null);
    setLoading(true);
    setError('');

    try {
      const {
        userMessage,
        botMessages,
        res,
        newThreadId,
      } = await askDbAndFormatResponse({
        msg,
        isAudio,
        replyTo,
        messages,
        threadId,
        isNewChatContext,
        setNewChatStarted,
      });

      // Step 1: Add user message immediately
      setMessages(msgs => [...msgs, userMessage]);

      // Step 2: Handle new thread creation
      if (!threadId && newThreadId) {
        setThreadId(newThreadId);
        setIsNewChatContext(false);
      }

      // Step 3: Update query IDs and assign query_id to user message with bookmark check
      if (res?.query_id) {
        // Check if the returned query_id exists in bookmarks
        const isQueryBookmarked = isQueryIdBookmarked(res.query_id);
        
        setQueryIds(prev => prev.includes(res.query_id) ? prev : [...prev, res.query_id]);
        
        // Update user message with queryId and bookmark status
        setMessages(msgs => {
          const updated = [...msgs];
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].sender === 'user' && !updated[i].queryId) {
              updated[i] = { 
                ...updated[i], 
                queryId: res.query_id,
                bookmarked: isQueryBookmarked
              };
              break;
            }
          }
          return updated;
        });
      }

      // Step 4: Add bot messages after a small delay for proper sequencing
      setTimeout(() => {
        setMessages(msgs => [...msgs, ...botMessages]);
        setLoading(false);
      }, 300); // 300ms delay to ensure user message renders first

    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        text: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(msgs => [...msgs, errorMessage]);
      setError(err.message || 'Failed to send message');
      setLoading(false);
    }
  },
  [replyTo, messages, threadId, isNewChatContext, setNewChatStarted, isQueryIdBookmarked]
);

  // Enhanced theme toggle
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Handle message actions
  const handleMessageAction = useCallback((id: string, action: 'copy' | 'edit') => {
    if (action === 'copy') {
      const message = messages.find(msg => msg.id === id);
      if (message && typeof message.text === 'string') {
        navigator.clipboard.writeText(message.text).catch(err => {
          console.error('Failed to copy message:', err);
        });
      }
    } else if (action === 'edit') {
      console.log('Edit message functionality not yet implemented:', id);
    }
  }, [messages]);

  // Compute user prompts for suggestions
  const userPrompts = useMemo(() => {
    const prompts = messages
      .filter(m => m.sender === 'user' && m.text && typeof m.text === 'string')
      .map(m => getDisplayText(m.text));
    return prompts.slice(-4).reverse();
  }, [messages]);

  // Handle message update callback
  const handleMessageUpdate = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    ));
  }, []);

  return (
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
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 13L3 17M3 17H7M3 17V13" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13 13L17 17M17 17H13M17 17V13" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 7L3 3M3 3H7M3 3V7" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13 7L17 3M17 3H13M17 3V7" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 8V3H8" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 8V3H12" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 12V17H8" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 12V17H12" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="chatbot-messages">
        {messages.length === 0 ? (
          <WelcomeMessage onSuggestionClick={handleSend} suggestions={userPrompts} />
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
                  isBookmarked={isBookmarked && !isNewChatContext}
                  bookmarks={bookmarks}
                  refreshBookmarks={refreshBookmarks}
                  onMessageUpdate={handleMessageUpdate}
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
          <span>Replying to: {String(replyTo.text).slice(0, 50)}...</span>
          <button onClick={() => setReplyTo(null)} className="cancel-reply">
            Cancel
          </button>
        </div>
      )}

      <InputBar
        ref={inputBarRef}
        onSend={handleSend}
        theme={theme}
        suggestions={userPrompts}
      />

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="chatbot-error"
        >
          <span className="error-message">{error}</span>
          <button
            className="error-close-btn"
            onClick={() => setError('')}
            aria-label="Close error"
          >
            ×
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default Chatbot;