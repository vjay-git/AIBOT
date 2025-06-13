// Reusable API utility for /ask_db with enhanced error handling and duplicate prevention
// ENHANCED: Added request deduplication and caching

// Request cache to prevent duplicate API calls
const requestCache = new Map<string, Promise<any>>();
const CACHE_DURATION = 5000; // 5 seconds

// Create a unique key for caching requests
function createRequestKey(payload: any): string {
  return JSON.stringify(payload, Object.keys(payload).sort());
}

// Enhanced askDB function with deduplication
export async function askDB({ 
  user_id, 
  question, 
  dashboard = '', 
  tile = '', 
  thread_id = '',
  bookmarkname = '',
  bookmark_id = '',
  query_type = '',
  ai_table = '',
}: {
  user_id: string;
  question: string;
  dashboard?: string;
  tile?: string;
  thread_id?: string;
  bookmarkname?: string;
  bookmark_id?: string;
  query_type?: string;
  ai_table?: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/ask_db`;
  
  // Build the complete payload with all fields
  const payload = {
    user_id,
    question,
    dashboard,
    tile,
    thread_id,
    bookmarkname,
    bookmark_id,
    query_type,
    ai_table
  };

  // Create cache key for deduplication
  const cacheKey = `askDB:${createRequestKey(payload)}`;
  
  // Check if same request is already in progress
  if (requestCache.has(cacheKey)) {
    console.log('🔄 Returning cached request for:', question.substring(0, 50));
    return requestCache.get(cacheKey);
  }

  // Debug log to see what's being sent
  console.log('🚀 askDB function sending payload:', JSON.stringify(payload, null, 2));
  
  const requestPromise = (async () => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }
      
      const contentType = res.headers.get('Content-Type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        
        if (typeof window !== 'undefined') {
          console.log('DEBUG: Full API response', data);
        }
        
        let answer = '';
        
        // Enhanced answer extraction logic with better error handling
        try {
          if (data?.response?.data?.data?.type === 'table' && Array.isArray(data.response.data.data.data)) {
            answer = data.response.data.data.data;
          } else if (typeof data?.response?.data?.data === 'string' && data.response.data.data.trim()) {
            answer = data.response.data.data;
          } else if (typeof data?.response?.data === 'string' && data.response.data.trim()) {
            answer = data.response.data;
          } else if (Array.isArray(data?.response?.data?.data) && data.response.data.data.length > 0) {
            answer = data.response.data.data;
          } else if (data?.data?.data?.type === 'table' && Array.isArray(data.data.data.data)) {
            answer = data.data.data.data;
          } else if (typeof data?.data === 'string' || Array.isArray(data?.data)) {
            answer = data.data;
          } else if (typeof data?.data?.message === 'string') {
            answer = data.data.message;
          } else {
            answer = 'No answer received.';
          }
        } catch (extractionError) {
          console.error('Error extracting answer:', extractionError);
          answer = 'Error processing response.';
        }
        
        if (typeof window !== 'undefined') {
          console.log('DEBUG: Extracted answer', answer);
        }
        
        return { ...data, answer };
        
      } else if (contentType && (
        contentType.includes('application/vnd.openxmlformats-officedocument') ||
        contentType.includes('application/pdf') ||
        contentType.includes('application/vnd.ms-excel')
      )) {
        // Handle file download (Excel, Word, PDF, etc)
        const blob = await res.blob();
        const fileExtension = contentType.includes('sheet') ? 'xlsx' : 
                             contentType.includes('wordprocessingml') ? 'docx' : 
                             contentType.includes('pdf') ? 'pdf' : 
                             contentType.includes('excel') ? 'xls' : 'bin';
        
        return {
          file: blob,
          contentType,
          fileName: `response_${new Date().toISOString().replace(/[:.]/g, '-')}.${fileExtension}`
        };
      } else {
        throw new Error(`Unsupported response type: ${contentType}`);
      }
    } catch (err) {
      console.error('Error in askDB:', err);
      throw err;
    } finally {
      // Remove from cache after delay to prevent memory leaks
      setTimeout(() => {
        requestCache.delete(cacheKey);
      }, CACHE_DURATION);
    }
  })();

  // Cache the promise
  requestCache.set(cacheKey, requestPromise);
  
  return requestPromise;
}

// Enhanced bookmark API with better error handling and deduplication
export async function bookmarkMessageAPI(messageIds: string[], bookmarkName: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/bookmark`;
  
  const cacheKey = `bookmark:${JSON.stringify(messageIds)}:${bookmarkName}`;
  
  // Prevent duplicate bookmark requests
  if (requestCache.has(cacheKey)) {
    console.log('🔄 Preventing duplicate bookmark request');
    return requestCache.get(cacheKey);
  }
  
  const requestPromise = (async () => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query_ids: Array.isArray(messageIds) ? messageIds : [messageIds], 
          bookmark_name: bookmarkName 
        })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to bookmark message: ${res.status} ${errorText}`);
      }
      
      return await res.json();
    } catch (error) {
      console.error('Error in bookmarkMessageAPI:', error);
      throw error;
    } finally {
      setTimeout(() => {
        requestCache.delete(cacheKey);
      }, CACHE_DURATION);
    }
  })();
  
  requestCache.set(cacheKey, requestPromise);
  return requestPromise;
}

// Enhanced fetch functions with caching
export async function fetchAllUserHistoryAPI() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/all`;
  const cacheKey = 'userHistory:all';
  
  if (requestCache.has(cacheKey)) {
    console.log('🔄 Returning cached user history');
    return requestCache.get(cacheKey);
  }
  
  const requestPromise = (async () => {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch user history: ${res.status} ${errorText}`);
      }
      
      return await res.json();
    } catch (error) {
      console.error('Error in fetchAllUserHistoryAPI:', error);
      throw error;
    } finally {
      setTimeout(() => {
        requestCache.delete(cacheKey);
      }, 2000); // Shorter cache for frequently changing data
    }
  })();
  
  requestCache.set(cacheKey, requestPromise);
  return requestPromise;
}

// Enhanced fetch thread by ID with caching
export async function fetchThreadById(threadId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/thread/${threadId}`;
  const cacheKey = `thread:${threadId}`;
  
  if (requestCache.has(cacheKey)) {
    console.log('🔄 Returning cached thread:', threadId);
    return requestCache.get(cacheKey);
  }
  
  const requestPromise = (async () => {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch thread: ${res.status} ${errorText}`);
      }
      
      return await res.json();
    } catch (error) {
      console.error('Error in fetchThreadById:', error);
      throw error;
    } finally {
      setTimeout(() => {
        requestCache.delete(cacheKey);
      }, 10000); // Longer cache for thread data
    }
  })();
  
  requestCache.set(cacheKey, requestPromise);
  return requestPromise;
}

// Enhanced AI Table fetch with caching
export async function fetchAiTableById(tableId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/aitable/${tableId}`;
  const cacheKey = `aiTable:${tableId}`;
  
  if (requestCache.has(cacheKey)) {
    console.log('🔄 Returning cached AI table:', tableId);
    return requestCache.get(cacheKey);
  }
  
  const requestPromise = (async () => {
    try {
      console.log(`📡 Fetching AI Table data for ID: ${tableId}`);
      console.log(`🔗 API URL: ${url}`);
      
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`❌ API Error Response: ${res.status} ${errorText}`);
        throw new Error(`Failed to fetch AI table: ${res.status} ${errorText}`);
      }
      
      const data = await res.json();
      console.log(`✅ AI Table data received for ${tableId}:`, data);
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        console.error('❌ Invalid AI Table response: not an object', data);
        throw new Error('Invalid AI Table response format');
      }
      
      if (!data["AI Table"]) {
        console.warn('⚠️ No "AI Table" key found in response. Available keys:', Object.keys(data));
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error in fetchAiTableById:', error);
      throw error;
    } finally {
      setTimeout(() => {
        requestCache.delete(cacheKey);
      }, 10000); // Longer cache for AI table data
    }
  })();
  
  requestCache.set(cacheKey, requestPromise);
  return requestPromise;
}

// Enhanced query fetch with caching
export async function getQueryById(queryId: any) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/query/${queryId}`;
  const cacheKey = `query:${queryId}`;
  
  if (requestCache.has(cacheKey)) {
    console.log('🔄 Returning cached query:', queryId);
    return requestCache.get(cacheKey);
  }
  
  const requestPromise = (async () => {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch query: ${res.status} ${errorText}`);
      }
      
      return await res.json();
    } catch (error) {
      console.error('Error in getQueryById:', error);
      throw error;
    } finally {
      setTimeout(() => {
        requestCache.delete(cacheKey);
      }, 15000); // Longer cache for query data
    }
  })();
  
  requestCache.set(cacheKey, requestPromise);
  return requestPromise;
}

// Cache-aware functions for frequently called APIs
export async function getAllChats() {
  const cacheKey = 'allChats';
  
  if (requestCache.has(cacheKey)) {
    console.log('🔄 Returning cached chats');
    return requestCache.get(cacheKey);
  }
  
  const requestPromise = fetchAllUserHistoryAPI();
  requestCache.set(cacheKey, requestPromise);
  
  return requestPromise;
}

// Utility to clear cache (useful for refresh actions)
export function clearApiCache(pattern?: string) {
  if (pattern) {
    for (const key of requestCache.keys()) {
      if (key.includes(pattern)) {
        requestCache.delete(key);
      }
    }
  } else {
    requestCache.clear();
  }
  console.log('🧹 API cache cleared:', pattern || 'all');
}

// All other functions remain the same but with added logging for debugging
export async function bookmarkMessageAPIUpdate(messageId: string, bookmarkId: any) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/bookmark/${bookmarkId}`;
  
  try {
    console.log('📝 Updating bookmark:', { messageId, bookmarkId });
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query_id: messageId })
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to update bookmark: ${res.status} ${errorText}`);
    }
    
    // Clear related caches
    clearApiCache('bookmark');
    clearApiCache('userHistory');
    
    return await res.json();
  } catch (error) {
    console.error('Error in bookmarkMessageAPIUpdate:', error);
    throw error;
  }
}

export async function deletedThreadById(threadId: any) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/thread/${threadId}`;
  
  try {
    console.log(`🗑️ Deleting thread: ${threadId}`);
    
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to delete thread: ${res.status} ${errorText}`);
    }
    
    // Clear related caches
    clearApiCache('thread');
    clearApiCache('userHistory');
    clearApiCache('allChats');
    
    const result = await res.json();
    console.log(`✅ Thread ${threadId} deleted successfully`);
    return result;
  } catch (error) {
    console.error('Error in deletedThreadById:', error);
    throw error;
  }
}

export async function updateThreadTitle(threadId: any, newTitle: any) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/thread/${threadId}`;
  
  try {
    console.log('📝 Updating thread title:', { threadId, newTitle });
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread_name: newTitle })
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to update thread title: ${res.status} ${errorText}`);
    }
    
    // Clear related caches
    clearApiCache(`thread:${threadId}`);
    clearApiCache('userHistory');
    clearApiCache('allChats');
    
    return await res.json();
  } catch (error) {
    console.error('Error in updateThreadTitle:', error);
    throw error;
  }
}

// Keep all other existing functions with minimal changes...
export async function deleteBookmark(bookmarkId: any) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/bookmark/${bookmarkId}`;
  
  try {
    console.log('🗑️ Deleting bookmark:', bookmarkId);
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to delete bookmark: ${res.status} ${errorText}`);
    }
    
    // Clear related caches
    clearApiCache('bookmark');
    clearApiCache('userHistory');
    
    return await res.json();
  } catch (error) {
    console.error('Error in deleteBookmark:', error);
    throw error;
  }
}

export async function getBookmarkById(bookmarkId: any) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/bookmark/${bookmarkId}`;
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch bookmark: ${res.status} ${errorText}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error in getBookmarkById:', error);
    throw error;
  }
}

// Dashboard functions with caching
export async function getUserDashboard(user_name: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/user_dashboard/${user_name}`;
  const cacheKey = `dashboard:${user_name}`;
  
  if (requestCache.has(cacheKey)) {
    console.log('🔄 Returning cached dashboard for:', user_name);
    return requestCache.get(cacheKey);
  }
  
  const requestPromise = (async () => {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.status === 404) {
        return {};
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch user dashboard: ${res.status} ${errorText}`);
      }
      
      return await res.json();
    } catch (error) {
      console.error('Error in getUserDashboard:', error);
      throw error;
    } finally {
      setTimeout(() => {
        requestCache.delete(cacheKey);
      }, 30000); // Cache dashboard for 30 seconds
    }
  })();
  
  requestCache.set(cacheKey, requestPromise);
  return requestPromise;
}

export async function getAiTables() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/aitables`;
  const cacheKey = 'aiTables:all';

  if (requestCache.has(cacheKey)) {
    console.log('🔄 Returning cached AI tables');
    return requestCache.get(cacheKey);
  }

  const requestPromise = (async () => {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch AI tables: ${res.status} ${errorText}`);
      }

      return await res.json();
    } catch (error) {
      console.error('Error in getAiTables:', error);
      throw error;
    } finally {
      setTimeout(() => {
        requestCache.delete(cacheKey);
      }, 10000);
    }
  })();

  requestCache.set(cacheKey, requestPromise);
  return requestPromise;
}

// Remaining functions with minimal changes but added cache clearing where appropriate...
export async function dashboardCreate(user_id: string, dashboardBody: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/user_dashboard`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: dashboardBody
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to create dashboard: ${res.status} ${errorText}`);
    }
    
    // Clear dashboard cache
    clearApiCache('dashboard');
    
    return await res.json();
  } catch (error) {
    console.error('Error in dashboardCreate:', error);
    throw error;
  }
}

export async function dashboardUpdate(user_id: string, dashboardBody: { default_dashboard: any; dashboards: any; ai_tables: any; username?: string; }) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/user_dashboard/${user_id}`;
  
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dashboardBody)
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to update dashboard: ${res.status} ${errorText}`);
    }
    
    // Clear dashboard cache
    clearApiCache('dashboard');
    
    return await res.json();
  } catch (error) {
    console.error('Error in dashboardUpdate:', error);
    throw error;
  }
}

// Generic error handler remains the same
export function handleApiError(error: { name: string; message: string | string[]; }, context = 'API call') {
  console.error(`${context} failed:`, error);
  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return new Error('Network error: Please check your internet connection and try again.');
  }
  
  if (error.message.includes('404')) {
    return new Error('Resource not found. It may have been deleted or moved.');
  }
  
  if (error.message.includes('401')) {
    return new Error('Authentication required. Please log in and try again.');
  }
  
  if (error.message.includes('403')) {
    return new Error('Access denied. You do not have permission to perform this action.');
  }
  
  if (error.message.includes('500')) {
    return new Error('Server error. Please try again later or contact support.');
  }
  
  return error instanceof Error ? error : new Error('An unexpected error occurred.');
}

// Rate limiting utility remains the same
const apiCallQueue = new Map();

export async function throttledApiCall(key: any, apiFunction: () => any, delay = 1000) {
  const now = Date.now();
  const lastCall = apiCallQueue.get(key) || 0;
  
  if (now - lastCall < delay) {
    const waitTime = delay - (now - lastCall);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  apiCallQueue.set(key, Date.now());
  return apiFunction();
}