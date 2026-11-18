// Free-only video generation guard.
// This endpoint intentionally never calls a paid or metered provider.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(503).json({
    code: 'FREE_VIDEO_ENGINE_NOT_READY',
    freeOnly: true,
    error: 'لم يتم ربط محرك فيديو مجاني محلي بعد. لن يتم الاتصال بأي خدمة مدفوعة أو خصم أي مبلغ. مخطط القصة جاهز، ونعمل الآن على تجهيز مسار التوليد المجاني.'
  });
}
