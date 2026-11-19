export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  return res.status(200).json({
    client_id: 'https://frameforge-ai-beta.vercel.app/.well-known/oauth-cimd',
    client_name: 'FrameForge AI',
    redirect_uris: ['https://frameforge-ai-beta.vercel.app/'],
    token_endpoint_auth_method: 'none',
    client_uri: 'https://frameforge-ai-beta.vercel.app'
  });
}
