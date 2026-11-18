// Turns a user's story into a structured storyboard. The API key stays server-side.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { story, language = 'ar', style = 'Cartoon', duration = '30 seconds' } = req.body || {};
  if (typeof story !== 'string' || story.trim().length < 10) {
    return res.status(400).json({ error: 'اكتب قصة من 10 أحرف على الأقل.' });
  }
  if (story.length > 12000) {
    return res.status(413).json({ error: 'القصة طويلة جداً. اختصرها إلى 12000 حرف.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      code: 'STORY_ENGINE_NOT_CONFIGURED',
      error: 'محرك تحويل القصة غير مربوط بعد. أضف GEMINI_API_KEY في إعدادات Vercel.'
    });
  }

  const langName = language === 'en' ? 'English' : 'Arabic';
  const prompt = `You are a professional animation screenwriter and storyboard artist.
Convert the user's story into a coherent short animated film storyboard.
Write all natural-language values in ${langName}.
Preserve the story's meaning. Do not add unrelated characters or events.
Create 3 to 8 scenes suitable for a ${duration} ${style} animation.
Keep each recurring character's visual_identity exactly consistent across scenes.
Each scene must have a clear visual_description, visible action, camera direction, dialogue, sound effects, and duration_seconds.
Dialogue should be concise and assigned to a character. If there is no dialogue, use an empty array.
Return only JSON matching the required schema.

USER STORY:
${story.trim()}`;

  const responseSchema = {
    type: 'OBJECT',
    properties: {
      title: { type: 'STRING' },
      logline: { type: 'STRING' },
      visual_style: { type: 'STRING' },
      characters: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING' },
            description: { type: 'STRING' },
            visual_identity: { type: 'STRING' }
          },
          required: ['name', 'description', 'visual_identity']
        }
      },
      scenes: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            number: { type: 'INTEGER' },
            title: { type: 'STRING' },
            location: { type: 'STRING' },
            visual_description: { type: 'STRING' },
            action: { type: 'STRING' },
            camera: { type: 'STRING' },
            dialogue: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  character: { type: 'STRING' },
                  line: { type: 'STRING' }
                },
                required: ['character', 'line']
              }
            },
            sound_effects: { type: 'ARRAY', items: { type: 'STRING' } },
            duration_seconds: { type: 'INTEGER' }
          },
          required: ['number', 'title', 'location', 'visual_description', 'action', 'camera', 'dialogue', 'sound_effects', 'duration_seconds']
        }
      }
    },
    required: ['title', 'logline', 'visual_style', 'characters', 'scenes']
  };

  try {
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.7,
          maxOutputTokens: 4096
        }
      })
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data.error?.message || 'تعذّر على محرك الذكاء الاصطناعي تحليل القصة.'
      });
    }
    const text = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('');
    if (!text) return res.status(502).json({ error: 'لم يرجع المحرك مخططاً للقصة. حاول مرة أخرى.' });
    const storyboard = JSON.parse(text);
    if (!Array.isArray(storyboard.scenes) || storyboard.scenes.length === 0) {
      return res.status(502).json({ error: 'المخطط الناتج غير مكتمل. حاول مرة أخرى.' });
    }
    return res.status(200).json({ storyboard });
  } catch (error) {
    return res.status(502).json({ error: 'حدث خطأ أثناء تحويل القصة إلى مشاهد.' });
  }
}
