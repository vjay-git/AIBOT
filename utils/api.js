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

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const contentType = res.headers.get('Content-Type') || '';

    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (typeof window !== 'undefined') {
        console.log('DEBUG: Full API response', data);
      }

      // Try to extract answer from various possible response shapes
      let answer = (
        data?.response?.data?.data?.type === 'table' && Array.isArray(data?.response?.data?.data?.data)
          ? data.response.data.data.data
        : typeof data?.response?.data?.data === 'string' && data.response.data.data.trim()
          ? data.response.data.data
        : typeof data?.response?.data === 'string' && data.response.data.trim()
          ? data.response.data
        : Array.isArray(data?.response?.data?.data) && data.response.data.data.length > 0
          ? data.response.data.data
        : data?.data?.data?.type === 'table' && Array.isArray(data?.data?.data?.data)
          ? data.data.data.data
        : typeof data?.data === 'string' || Array.isArray(data?.data)
          ? data.data
        : typeof data?.data?.message === 'string'
          ? data.data.message
        : 'No answer received.'
      );

      if (typeof window !== 'undefined') {
        console.log('DEBUG: Extracted answer', answer);
      }
      return { ...data, answer };
    }

    if (
      contentType.includes('application/vnd.openxmlformats-officedocument') ||
      contentType.includes('application/pdf')
    ) {
      // Handle file download (Excel, Word, PDF, etc)
      const blob = await res.blob();
      let ext = 'bin';
      if (contentType.includes('sheet')) ext = 'xlsx';
      else if (contentType.includes('wordprocessingml')) ext = 'docx';
      else if (contentType.includes('pdf')) ext = 'pdf';

      return {
        file: blob,
        contentType,
        fileName: `response_${new Date().toISOString().replace(/[:.]/g, '-')}.${ext}`
      };
    }

    throw new Error('Unsupported response type.');
  } catch (err) {
    throw err;
  }
}
