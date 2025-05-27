import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchChatbotData } from '../../utils/apiMocks';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = await fetchChatbotData();
    // Return chatSessions as the array expected by the frontend
    res.status(200).json(data.chatSessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load chat history' });
  }
}
