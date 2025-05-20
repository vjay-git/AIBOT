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
    // Extract answer from response.data
    let answer = '';
    if (data && data.response && typeof data.response.data === 'string' && data.response.data.trim()) {
      answer = data.response.data;
    } else {
      answer = 'No answer received.';
    }
    return { ...data, answer };
  } catch (err) {
    throw err;
  }
}
