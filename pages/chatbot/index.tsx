import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { askDB, fetchThreadById, getQueryById, fetchAiTableById, getAllChats, clearApiCache } from '../../utils/api';
import InputBar from '../../components/Chatbot/InputBar';
import { ChatMessage } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from '../../components/Chatbot/MessageBubble';

const DEFAULT_USER_ID = '56376e63-0377-413d-8c9e-359028e2380d';

interface ChatbotProps {
  selectedChatId: string;
  selectedNewChatId: string;
  chatData?: any[];
  setNewChatStarted: (started: boolean) => void;
  isBookmarked: boolean;
  bookmarks: any[];
  refreshBookmarks: () => void;
  isFromBookmarks?: boolean;
  isFromFolder?: boolean;
}

const WelcomeMessage = React.memo(({ onSuggestionClick, suggestions }: {
  onSuggestionClick: (text: string, queryType?: 'CHAT' | 'DB_QUERY' | 'SCRAP') => void;
  suggestions: string[];
}) => {
  const defaultSuggestions = [
    "Top 5 Vendors by Purchasing amount",
    "Top 5 customers fiscal year 2024",
    "Top 5 business fiscal year 2024",
    "Top 10 Customers by Billing Amount"
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
            onClick={() => {
              console.log('🔍 Suggestion clicked, sending with DB_QUERY:', suggestion);
              onSuggestionClick(suggestion, 'DB_QUERY');
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                console.log('🔍 Suggestion selected via keyboard, sending with DB_QUERY:', suggestion);
                onSuggestionClick(suggestion, 'DB_QUERY');
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
  isFromBookmarks = false,
  isFromFolder = false
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
  const [globalUserPrompts, setGlobalUserPrompts] = useState<string[]>([]);
  
  // Add loading states to prevent duplicate API calls
  const [isLoadingExistingChat, setIsLoadingExistingChat] = useState(false);
  const [isLoadingUserPrompts, setIsLoadingUserPrompts] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputBarRef = useRef<{ focusInput: () => void }>(null);
  const chatbotContainerRef = useRef<HTMLDivElement>(null);

  // Enhanced scroll to bottom function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Helper function to check if a query ID exists in bookmarks
  const isQueryIdBookmarked = useCallback((queryId: string, messageId: string): boolean => {
    return bookmarks.some(bookmark => 
      bookmark.queries?.some((q: any) => {
        // Check if this specific query_id is bookmarked
        if (typeof q.query_id === 'string') {
          return q.query_id === queryId;
        } else if (Array.isArray(q.query_id)) {
          return q.query_id.includes(queryId);
        }
        return false;
      })
    );
  }, [bookmarks]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Enhanced new chat handling - OPTIMIZED: Single useEffect for new chat
  useEffect(() => {
    if (selectedNewChatId) {
      console.log('🆕 Starting new chat:', selectedNewChatId);
      setMessages([]);
      setReplyTo(null);
      setThreadId(null);
      setQueryIds([]);
      setIsNewChatContext(true);
      setError('');

      // Clear localStorage for new chat
      localStorage.removeItem('chatbot_threadId');
      localStorage.setItem('chatbot_queryIds', JSON.stringify([]));
      
      // Clear API cache for fresh start
      clearApiCache();
    }
  }, [selectedNewChatId]);

  // Function to convert AI Table response to chat messages
  const convertAiTableToChatMessages = useCallback((apiResponse: any, tableId: string): ChatMessage[] => {
    const allMessages: ChatMessage[] = [];
    
    // Access the correct data structure - API returns {"AI Table": {...}}
    const tableData = apiResponse?.["AI Table"] || apiResponse;
    
    if (!tableData || !tableData.queries || !Array.isArray(tableData.queries)) {
      console.warn('AI Table has no valid queries:', tableData);
      return allMessages;
    }

    console.log(`📊 Processing ${tableData.queries.length} queries from folder:`, tableData.table_name || tableId);
    
    for (const query of tableData.queries) {
      // Handle null messages properly
      if (!query.messages || query.messages === null) {
        console.log('⏭️ Skipping query with null messages:', query.query_id);
        continue;
      }

      // Handle the nested array structure from API response
      const messageGroups = Array.isArray(query.messages) && Array.isArray(query.messages[0])
        ? query.messages[0]  // API returns [[messages]] format
        : query.messages;

      if (!Array.isArray(messageGroups)) {
        console.warn('❌ Invalid message format for query:', query.query_id);
        continue;
      }

      let validMessagesInQuery = 0;
      
      for (let idx = 0; idx < messageGroups.length; idx++) {
        const msg = messageGroups[idx];
        let sender: "user" | "bot" = msg.role === "user" ? "user" : "bot";
        let text = "";
        let type: ChatMessage["type"] = "text";
        let rawAnswer: any = undefined;

        // Skip system/SQL messages and table_used messages
        if (typeof msg.content === "string" && msg.content.startsWith("SQL Generated by LLM:")) continue;
        if (msg.table_used) continue;

        if (typeof msg.content === "string") {
          text = msg.content;
        } else if (typeof msg.results === "string") {
          text = msg.results;
        } else if (typeof msg.results === "object" && msg.results?.data) {
          rawAnswer = msg.results.type === 'table' ? msg.results.data.data : msg.results.data;
          text = msg.results.data;
          type = msg.results.type as ChatMessage["type"] || "text";
        } else {
          text = "";
        }

        // Skip empty messages
        if (text === null || text === undefined || (typeof text === "string" && text.trim() === "")) continue;

        allMessages.push({
          id: `${query.query_id}-${idx}`,
          sender,
          text,
          timestamp: new Date().toISOString(),
          type,
          rawAnswer,
          queryId: query.query_id,
          bookmarked: false // Folder messages are not bookmarked by default
        });
        
        validMessagesInQuery++;
      }
      
      console.log(`✅ Query ${query.query_id}: ${validMessagesInQuery} messages processed`);
    }
    
    console.log(`🎉 Total folder messages processed: ${allMessages.length}`);
    return allMessages;
  }, []);

  // Helper function to convert query response to chat messages (for bookmarks)
  const convertQueryResponseToChatMessages = useCallback((response: any, bookmarkId?: string): ChatMessage[] => {
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
  }, []);

  // OPTIMIZED: Single useEffect for existing chat loading with proper dependency management
  useEffect(() => {
    // Prevent duplicate loading
    if (isLoadingExistingChat) return;
    if (!selectedChatId || selectedChatId === selectedNewChatId) return;

    console.log('🔄 Loading existing chat:', {
      selectedChatId,
      isFromBookmarks,
      isFromFolder,
      bookmarksCount: bookmarks.length
    });
    
    const loadExistingChat = async () => {
      setIsLoadingExistingChat(true);
      setMessages([]);
      setReplyTo(null);
      setIsNewChatContext(false);
      setError('');
      setLoading(true);

      try {
        if (isFromBookmarks) {
          console.log('🔖 Loading bookmark with ID:', selectedChatId);
          const allBookmarkMessages: ChatMessage[] = [];
          let selectedBookmark = bookmarks.find(b => b.id === selectedChatId || b.bookmark_id === selectedChatId);

          if (!selectedBookmark) {
            console.error('❌ Bookmark not found with ID:', selectedChatId);
            setError('Bookmark not found');
            return;
          }

          if (selectedBookmark.queries && Array.isArray(selectedBookmark.queries)) {
            for (const q of selectedBookmark.queries) {
              let id = q.query_id;
              if (q.query_id == null) continue;
              if(Array.isArray(q.query_id) && q.query_id.length === 0) id = q.query_id[0]; 
              
              try {
                const queryObj = await getQueryById(q.query_id);
                if (!queryObj) {
                  console.warn('⚠️ Query not found:', q.query_id);
                  continue;
                }

                const msgs = convertQueryResponseToChatMessages(queryObj, selectedBookmark.id || selectedBookmark.bookmark_id);
                allBookmarkMessages.push(...msgs);
              } catch (error) {
                console.error('❌ Error fetching query:', q.query_id, error);
                continue;
              }
            }
            setMessages(allBookmarkMessages);
          } else {
            console.warn('⚠️ Bookmark has no queries or queries is not an array:', selectedBookmark);
            setMessages([]);
          }
          return;
        }
        
        if (isFromFolder) {
          console.log('🗂️ Loading folder (AI Table) with ID:', selectedChatId);
          try {
            console.log('📡 Calling fetchAiTableById with ID:', selectedChatId);
            const aiTableData = await fetchAiTableById(selectedChatId);
            console.log('📊 Raw AI Table data received:', aiTableData);
            
            const folderMessages = convertAiTableToChatMessages(aiTableData, selectedChatId);
            console.log('💬 Processed folder messages:', folderMessages.length, 'messages');
            
            setMessages(folderMessages);
            setThreadId(null); // Folders don't have thread IDs
            
            console.log(`✅ Successfully loaded ${folderMessages.length} folder messages`);
          } catch (err) {
            console.error('❌ Failed to fetch AI table:', err);
            setError('Failed to load folder data');
          }
          return;
        }
        
        // Regular chat loading
        console.log('💬 Loading regular chat with ID:', selectedChatId);
        try {
          const data = await fetchThreadById(selectedChatId);
          const chatMessages = await convertApiMessagesToChatMessages(data);

          setMessages(chatMessages);
          setThreadId(selectedChatId);

          console.log('✅ Loaded chat messages:', chatMessages.length);
        } catch (err) {
          console.error('❌ Failed to fetch thread:', err);
          setError('Failed to load chat history');
        }
      } catch (err) {
        console.error('❌ Error in loadExistingChat:', err);
        setError('Failed to load chat data');
      } finally {
        setLoading(false);
        setIsLoadingExistingChat(false);
      }
    };

    loadExistingChat();
  }, [selectedChatId, selectedNewChatId, isFromBookmarks, isFromFolder, bookmarks.length]); // Only depend on length to avoid unnecessary re-renders

  // Focus input when replying
  useEffect(() => {
    if (replyTo && inputBarRef.current?.focusInput) {
      inputBarRef.current.focusInput();
    }
  }, [replyTo]);

  // Welcome message component
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
      console.log('🔄 Converting API data to chat messages:', apiData);
      if (!apiData?.Thread?.queries || !Array.isArray(apiData.Thread.queries) || apiData.Thread.queries.length === 0) {
        console.log('⚠️ No queries found in API data');
        return [];
      }
      const allMessages: ChatMessage[] = [];
      for (const query of apiData.Thread.queries) {
        console.log('📝 Processing query:', query.query_id, 'with messages:', query.messages);
        const isThisQueryBookmarked = isQueryIdBookmarked(query.query_id, `${query.query_id}-0`);
        let flatMessages: any[] = [];
        if (!query.messages) {
          console.log('⏭️ Skipping query with no messages:', query.query_id);
          continue;
        }
        if (Array.isArray(query.messages)) {
          if (query.messages.length === 0) {
            console.log('⏭️ Skipping query with empty messages array:', query.query_id);
            continue;
          }
          if (Array.isArray(query.messages[0])) {
            flatMessages = query.messages.flat();
            if (Array.isArray(flatMessages[0])) {
              flatMessages = flatMessages.flat();
            }
          } else {
            flatMessages = query.messages;
          }
        } else {
          console.log('⚠️ Messages is not an array for query:', query.query_id);
          continue;
        }
        console.log('📋 Flattened messages for query', query.query_id, ':', flatMessages.length, 'messages');
        for (let idx = 0; idx < flatMessages.length; idx++) {
          const msg = flatMessages[idx];
          console.log(`🔍 Processing message ${idx}:`, msg);
          let sender: "user" | "bot" = msg.role === "user" ? "user" : "bot";
          let text = "";
          let type: ChatMessage["type"] = "text";
          let rawAnswer: any = undefined;
          if (msg.table_used) {
            console.log('⏭️ Skipping table_used message');
            continue;
          }
          if (typeof msg.content === "string" && msg.content.startsWith("SQL Generated by LLM:")) {
            console.log('⏭️ Skipping SQL Generated by LLM message:', msg.content.substring(0, 50));
            continue;
          }
          if (typeof msg.content === "string") {
            text = msg.content;
            console.log('✅ Using content as text:', text.substring(0, 50) + '...');
          } else if (typeof msg.results === "string" && msg.results.trim() !== "") {
            text = msg.results;
            console.log('✅ Using results as text:', text.substring(0, 50) + '...');
          } else if (typeof msg.results === "object" && msg.results !== null) {
            console.log('🔍 Processing results object:', msg.results);
            if (msg.results.type === 'text' && typeof msg.results.data === "string" && msg.results.data.trim() !== "") {
              text = msg.results.data;
              type = 'text';
              console.log('✅ Using results.data as text');
            } else if (msg.results.data) {
              const dataToProcess = msg.results.data.data || msg.results.data;
              if (Array.isArray(dataToProcess)) {
                console.log('📊 Processing tabular data:', dataToProcess.length, 'rows');
                const tableData = dataToProcess.map((row: any[]) =>
                  Array.isArray(row)
                    ? row.map(cell => {
                        if (cell && typeof cell === 'object' && cell.constructor && cell.constructor.name === 'Decimal') {
                          return cell.toString();
                        }
                        if (typeof cell === 'object' && cell !== null && cell.toString) {
                          return cell.toString();
                        }
                        return cell;
                      })
                    : row
                );
                rawAnswer = tableData;
                type = msg.results.type as ChatMessage["type"] || "tabular";
                text = "";
                console.log('✅ Processed tabular data with', tableData.length, 'rows');
              } else if (typeof dataToProcess === "string" && dataToProcess.trim() !== "") {
                text = dataToProcess;
                type = 'text';
                console.log('✅ Using nested data as text');
              } else {
                console.log('⏭️ Skipping results with no displayable data');
                continue;
              }
            } else {
              console.log('⏭️ Skipping results object with no data');
              continue;
            }
          } else {
            console.log('⏭️ Skipping message with no displayable content');
            continue;
          }
          if (text === null || text === undefined || (typeof text === "string" && text.trim() === "")) {
            if (!rawAnswer) {
              console.log('⏭️ Skipping empty message');
              continue;
            }
          }
          const chatMessage: ChatMessage = {
            id: `${query.query_id}-${idx}`,
            sender,
            text,
            timestamp: new Date().toISOString(),
            type,
            rawAnswer,
            queryId: query.query_id,
            bookmarked: isThisQueryBookmarked
          };
          allMessages.push(chatMessage);
          console.log('✅ Added message:', chatMessage.id, 'type:', type, 'sender:', sender);
        }
      }
      console.log('🎉 Total messages processed:', allMessages.length);
      return allMessages;
    } catch (error) {
      console.error('❌ Error converting API messages to ChatMessages:', error);
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

  // OPTIMIZED: askDbAndFormatResponse function with proper query_type handling
  async function askDbAndFormatResponse({
    msg,
    isAudio,
    replyTo,
    messages,
    threadId,
    isNewChatContext,
    setNewChatStarted,
    queryType = 'CHAT',
    isFromFolder,
    selectedChatId
  }: {
    msg: string | Blob;
    isAudio: boolean;
    replyTo: ChatMessage | null;
    messages: ChatMessage[];
    threadId: string | null;
    isNewChatContext: boolean;
    setNewChatStarted: (started: boolean) => void;
    queryType?: 'CHAT' | 'DB_QUERY' | 'SCRAP';
    isFromFolder?: boolean;
    selectedChatId?: string;
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

    // Build API request body with proper ai_table handling
    const apiRequestBody: any = {
      user_id: DEFAULT_USER_ID,
      question: concatenatedQuestion,
      dashboard: '',
      tile: '',
      bookmarkname: '',
      bookmark_id: '',
      thread_id: threadId || '',
      query_type: queryType,
    };

    // Add ai_table ONLY when we're in a folder context
    if (isFromFolder && selectedChatId) {
      apiRequestBody.ai_table = selectedChatId;
      console.log('🗂️ Adding ai_table to payload:', selectedChatId);
    }

    console.log('📤 Final API Request Body:', apiRequestBody);
   
    if (isAudio && msg instanceof Blob) {
      const formData = new FormData();
      formData.append('audio', msg, 'audio.webm');
      formData.append('user_id', DEFAULT_USER_ID);
      formData.append('question', concatenatedQuestion);
      formData.append('dashboard', '');
      formData.append('tile', '');
      formData.append('bookmarkname', '');
      formData.append('bookmark_id', '');
      formData.append('thread_id', threadId || '');
      formData.append('query_type', queryType);
      
      // Add ai_table for audio requests when in folder context
      if (isFromFolder && selectedChatId) {
        formData.append('ai_table', selectedChatId);
        console.log('🗂️ Adding ai_table to FormData:', selectedChatId);
      }
      
      response = await fetch('/ask_db', { method: 'POST', body: formData });
      contentType = response.headers.get('Content-Type');
    } else {
      res = await askDB(apiRequestBody);
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

  // Wrapper function to handle suggestions with DB_QUERY
  const handleSuggestionClick = useCallback((text: string, queryType: 'CHAT' | 'DB_QUERY' | 'SCRAP' = 'DB_QUERY') => {
    console.log('🎯 Suggestion clicked:', text, 'with queryType:', queryType);
    handleSend(text, queryType);
  }, []);

  // OPTIMIZED: handleSend function with debouncing to prevent duplicate calls
  const [sendingRequest, setSendingRequest] = useState(false);

  const handleSend = useCallback(
    async (msg: string | Blob, queryType = 'CHAT', isAudio = false) => {
      // Prevent duplicate sends
      if (sendingRequest) {
        console.log('🚫 Request already in progress, ignoring duplicate send');
        return;
      }

      console.log('📤 handleSend called with:', { 
        message: typeof msg === 'string' ? msg.slice(0, 50) : '[Audio]', 
        queryType, 
        isAudio,
        isFromFolder,
        selectedChatId
      });
      
      setSendingRequest(true);
      setReplyTo(null);
      setError('');

      // Optimistically create user message
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
      setMessages(msgs => [...msgs, userMessage]); // Show user message immediately
      setLoading(true); // Now show loading spinner

      try {
        const {
          botMessages,
          res,
          newThreadId,
        } = await askDbAndFormatResponse({
          msg,
          isAudio,
          replyTo,
          messages: [...messages, userMessage],
          threadId,
          isNewChatContext,
          setNewChatStarted,
          queryType: queryType as 'CHAT' | 'DB_QUERY' | 'SCRAP',
          isFromFolder,
          selectedChatId
        });

        // Handle new thread creation
        if (!threadId && newThreadId) {
          setThreadId(newThreadId);
          setIsNewChatContext(false);
        }

        // Update query IDs
        if (res?.query_id) {
          setQueryIds(prev => prev.includes(res.query_id) ? prev : [...prev, res.query_id]);
          // Update ONLY the user message with queryId (no automatic bookmarking)
          setMessages(msgs => {
            const updated = [...msgs];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].sender === 'user' && !updated[i].queryId) {
                updated[i] = {
                  ...updated[i],
                  queryId: res.query_id,
                  bookmarked: false
                };
                break;
              }
            }
            return updated;
          });
        }

        // Add bot messages after user message is visible
        setTimeout(() => {
          setMessages(msgs => [
            ...msgs,
            ...botMessages.map(botMsg => ({
              ...botMsg,
              queryId: res?.query_id || '',
              bookmarked: false
            }))
          ]);
          setLoading(false);
        }, 100);
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
      } finally {
        setSendingRequest(false);
      }
    },
    [replyTo, messages, threadId, isNewChatContext, setNewChatStarted, isFromFolder, selectedChatId, sendingRequest]
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

  // OPTIMIZED: Fetch all user messages with proper loading state and deduplication
  useEffect(() => {
    if (isLoadingUserPrompts) return;

    async function fetchAllUserPrompts() {
      setIsLoadingUserPrompts(true);
      try {
        const allChats = await getAllChats();
        // allChats may be { chatSessions: [...] } or an array; handle both
        const sessions = Array.isArray(allChats) ? allChats : allChats.chatSessions || [];
        const allUserMessages: string[] = [];
        sessions.forEach((session: any) => {
          if (Array.isArray(session.messages)) {
            session.messages.forEach((msg: any) => {
              if (msg.role === 'user' && typeof msg.content === 'string' && msg.content.trim()) {
                allUserMessages.push(msg.content.trim());
              }
            });
          }
        });
        // Deduplicate and filter out very short/generic messages
        const uniquePrompts = Array.from(new Set(allUserMessages)).filter(
          p => p.length > 2 && !['ok', 'okay', 'thanks', 'hi', 'hello'].includes(p.toLowerCase())
        );
        setGlobalUserPrompts(uniquePrompts);
      } catch (err) {
        console.warn('Failed to fetch user prompts:', err);
        setGlobalUserPrompts([]);
      } finally {
        setIsLoadingUserPrompts(false);
      }
    }

    // Only fetch once when component mounts
    if (globalUserPrompts.length === 0) {
      fetchAllUserPrompts();
    }
  }, []); // Empty dependency array for one-time fetch

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
          <WelcomeMessage 
            onSuggestionClick={handleSuggestionClick} 
            suggestions={globalUserPrompts} 
          />
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
        suggestions={globalUserPrompts}
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