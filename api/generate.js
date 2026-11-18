// Vercel serverless adapter for FrameForge AI video providers.
// Keep provider credentials in Vercel Environment Variables, never in browser code.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, motion, mode, imageData, duration, aspectRatio, style } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
    return res.status(400).json({ error: 'A video prompt is required.' });
  }

  const providerUrl = process.env.VIDEO_PROVIDER_URL;
  const providerKey = process.env.VIDEO_PROVIDER_API_KEY;

  if (!providerUrl || !providerKey) {
    return res.status(503).json({
      code: 'VIDEO_PROVIDER_NOT_CONFIGURED',
      error: 'The video engine is not connected yet. Configure a supported provider before generating videos.',
    });
  }

  try {
    const upstream = await fetch(providerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${providerKey}`,
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        motion: typeof motion === 'string' ? motion : '',
        mode: mode || 'text',
        image: typeof imageData === 'string' ? imageData : null,
        duration: duration || '5 seconds',
        aspectRatio: aspectRatio || '16:9',
        style: style || 'Cinematic',
      }),
    });

    const raw = await upstream.text();
    let data;
    try { data = JSON.parse(raw); } catch { data = { message: raw.slice(0, 1000) }; }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data.error || data.message || 'The video provider rejected the request.',
      });
    }

    return res.status(202).json(data);
  } catch (error) {
    return res.status(502).json({
      error: 'Could not reach the configured video provider.',
    });
  }
}
