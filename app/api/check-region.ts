// pages/api/check-region.ts

import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const region = process.env.VERCEL_REGION || 'unknown';
  console.log('🌍 Running in region:', region); // This appears in Vercel logs
  res.status(200).json({ region });
}
