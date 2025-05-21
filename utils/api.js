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
    const data = await res.json();
    // Debug log for troubleshooting
    if (typeof window !== 'undefined') {
      console.log('DEBUG: Full API response', data);
    }
    // Extract answer from response.response.data.data or response.response.data
    let answer = '';
    // Try to extract from various possible structures
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
  } catch (err) {
    throw err;
  }
}
