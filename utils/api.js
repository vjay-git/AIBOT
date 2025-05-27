// Reusable API utility for /ask_db
export async function askDB({ user_id, question, dashboard = '', tile = '' }) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/ask_db`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, question, dashboard, tile })
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }
    const contentType = res.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      if (typeof window !== 'undefined') {
        console.log('DEBUG: Full API response', data);
      }
      let answer = '';
      if (
        data &&
        data.response &&
        data.response.data &&
        data.response.data.data &&
        data.response.data.data.type === 'table' &&
        Array.isArray(data.response.data.data.data)
      ) {
        answer = data.response.data.data.data;
      } else if (
        data &&
        data.response &&
        data.response.data &&
        typeof data.response.data.data === 'string' &&
        data.response.data.data.trim()
      ) {
        answer = data.response.data.data;
      } else if (
        data &&
        data.response &&
        typeof data.response.data === 'string' &&
        data.response.data.trim()
      ) {
        answer = data.response.data;
      } else if (
        data &&
        data.response &&
        data.response.data &&
        Array.isArray(data.response.data.data) &&
        data.response.data.data.length > 0
      ) {
        answer = data.response.data.data;
      } else if (
        data &&
        data.data &&
        data.data.data &&
        data.data.data.type === 'table' &&
        Array.isArray(data.data.data.data)
      ) {
        answer = data.data.data.data;
      } else if (
        data &&
        data.data &&
        (typeof data.data === 'string' || Array.isArray(data.data))
      ) {
        answer = data.data;
      } else if (
        data &&
        data.data &&
        typeof data.data.message === 'string'
      ) {
        answer = data.data.message;
      } else {
        answer = 'No answer received.';
      }
      if (typeof window !== 'undefined') {
        console.log('DEBUG: Extracted answer', answer);
      }
      return { ...data, answer };
    } else if (
      contentType && (
        contentType.includes('application/vnd.openxmlformats-officedocument') ||
        contentType.includes('application/pdf')
      )
    ) {
      // Handle file download (Excel, Word, PDF, etc)
      const blob = await res.blob();
      return {
        file: blob,
        contentType,
        fileName: `response_${new Date().toISOString().replace(/[:.]/g, '-')}.${contentType.includes('sheet') ? 'xlsx' : contentType.includes('wordprocessingml') ? 'docx' : contentType.includes('pdf') ? 'pdf' : 'bin'}`
      };
    } else {
      throw new Error('Unsupported response type.');
    }
  } catch (err) {
    throw err;
  }
}

// Add a bookmark API call for messages
export async function bookmarkMessageAPI(messageId, bookmark) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/bookmark-message`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message_id: messageId, bookmark })
  });
  if (!res.ok) throw new Error('Failed to bookmark message');
  return await res.json();
}

// Fetch all user history (folders, threads, bookmarks, queries) from single endpoint
export async function fetchAllUserHistoryAPI() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${baseUrl}/userhistory/all`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch all user history');
  return await res.json();
}

// Deprecated: Use fetchAllUserHistoryAPI instead
// export async function listThreadsAPI() { ... }
// export async function listFoldersAPI() { ... }
