// Reusable API utility for /ask_db
export async function askDB({ user_id, question, dashboard = '', tile = '', thread_id = '' }) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/ask_db`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, question, dashboard, tile, thread_id })
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
  }
}

// Enhanced bookmark API with better error handling
export async function bookmarkMessageAPI(messageIds, bookmarkName) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/bookmark`;
  
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
  }
}

// Enhanced bookmark update API
export async function bookmarkMessageAPIUpdate(messageId, bookmarkId) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/bookmark/${bookmarkId}`;
  
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query_id: messageId })
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to update bookmark: ${res.status} ${errorText}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error in bookmarkMessageAPIUpdate:', error);
    throw error;
  }
}

// Enhanced fetch all user history API
export async function fetchAllUserHistoryAPI() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/all`;
  
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
  }
}

// Enhanced fetch thread by ID
export async function fetchThreadById(threadId) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/thread/${threadId}`;
  
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
  }
}

// 🔧 ENHANCED: Fetch AI Table (folder) data by table_id with better error handling
export async function fetchAiTableById(tableId) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/aitable/${tableId}`;
  
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
    
    // 🔧 VALIDATE: Check if the response has the expected structure
    if (!data || typeof data !== 'object') {
      console.error('❌ Invalid AI Table response: not an object', data);
      throw new Error('Invalid AI Table response format');
    }
    
    // Check for the "AI Table" key
    if (!data["AI Table"]) {
      console.warn('⚠️ No "AI Table" key found in response. Available keys:', Object.keys(data));
      console.warn('⚠️ Full response:', data);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error in fetchAiTableById:', error);
    throw error;
  }
}

// Enhanced get all chats API
export async function getAllChats() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/all`;
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch chats: ${res.status} ${errorText}`);
    }
    
    const data = await res.json();
    console.log('getAllChats response:', data);
    return data;
  } catch (error) {
    console.error('Error in getAllChats:', error);
    throw error;
  }
}

// Enhanced delete thread by ID API
export async function deletedThreadById(threadId) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/thread/${threadId}`;
  
  try {
    console.log(`Attempting to delete thread: ${threadId}`);
    
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Delete API error: ${res.status} ${errorText}`);
      throw new Error(`Failed to delete thread: ${res.status} ${errorText}`);
    }
    
    const result = await res.json();
    console.log(`Thread ${threadId} deleted successfully:`, result);
    return result;
  } catch (error) {
    console.error('Error in deletedThreadById:', error);
    throw error;
  }
}

// Additional utility functions for better API management

// Create a new thread/chat
export async function createNewThread(title = 'New Chat') {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/thread`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to create thread: ${res.status} ${errorText}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error in createNewThread:', error);
    throw error;
  }
}

// Update thread title
export async function updateThreadTitle(threadId, newTitle) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/thread/${threadId}`;
  
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle })
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to update thread title: ${res.status} ${errorText}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error in updateThreadTitle:', error);
    throw error;
  }
}

// Delete a bookmark
export async function deleteBookmark(bookmarkId) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/bookmark/${bookmarkId}`;
  
  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to delete bookmark: ${res.status} ${errorText}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error in deleteBookmark:', error);
    throw error;
  }
}

// Get bookmark by ID
export async function getBookmarkById(bookmarkId) {
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

export async function getQueryById(queryId) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/query/${queryId}`;
  
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
  }
}

// Generic error handler for API responses
export function handleApiError(error, context = 'API call') {
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

// Rate limiting utility
const apiCallQueue = new Map();

export async function throttledApiCall(key, apiFunction, delay = 1000) {
  const now = Date.now();
  const lastCall = apiCallQueue.get(key) || 0;
  
  if (now - lastCall < delay) {
    const waitTime = delay - (now - lastCall);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  apiCallQueue.set(key, Date.now());
  return apiFunction();
}