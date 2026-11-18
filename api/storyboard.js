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
      characters: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
        name: { type: 'STRING' }, description: { type: 'STRING' }, visual_identity: { type: 'STRING' }
      }, required: ['name', 'description', 'visual_identity'] } },
      scenes: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
        number: { type: 'INTEGER' }, title: { type: 'STRING' }, location: { type: 'STRING' },
        visual_description: { type: 'STRING' }, action: { type: 'STRING' }, camera: { type: 'STRING' },
        dialogue: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
          character: { type: 'STRING' }, line: { type: 'STRING' }
        }, required: ['character', 'line'] } },
        sound_effects: { type: 'ARRAY', items: { type: 'STRING' } },
        duration_seconds: { type: 'INTEGER' }
      }, required: ['number', 'title', 'location', 'visual_description', 'action', 'camera', 'dialogue', 'sound_effects', 'duration_seconds'] } }
    },
    required: ['title', 'logline', 'visual_style', 'characters', 'scenes']
  };

  async function requestModel(model) {
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        model, input: prompt, store: false,
        response_format: { type: 'text', mime_type: 'application/json', schema: responseSchema }
      })
    });
    const data = await upstream.json().catch(() => ({}));
    return { upstream, data };
  }

  try {
    const models = [
      process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite',
      process.env.GEMINI_LAST_FALLBACK_MODEL || 'gemini-3.1-flash-lite'
    ].filter((model, index, all) => model && all.indexOf(model) === index);

    let result;
    let usedModel;
    for (let index = 0; index < models.length; index += 1) {
      usedModel = models[index];
      result = await requestModel(usedModel);
      if (result.upstream.ok) break;

      const message = result.data.error?.message || '';
      const overloaded = result.upstream.status === 429 || result.upstream.status === 503 ||
        /high demand|overload|temporarily unavailable|resource exhausted/i.test(message);

      if (!overloaded || index === models.length - 1) break;
      console.warn(`Gemini model ${usedModel} is busy; trying next configured fallback.`);
    }

    const { upstream, data } = result;
    if (!upstream.ok) {
      console.error('Gemini Interactions API error:', upstream.status, data.error?.message || 'Unknown upstream error');
      const message = data.error?.message || '';
      const overloaded = upstream.status === 429 || upstream.status === 503 ||
        /high demand|overload|temporarily unavailable|resource exhausted/i.test(message);
      return res.status(overloaded ? 503 : 502).json({
        code: overloaded ? 'GEMINI_TEMPORARILY_BUSY' : 'GEMINI_REQUEST_FAILED',
        error: overloaded
          ? 'خدمات Gemini مزدحمة حالياً حتى بعد تجربة النماذج الاحتياطية. انتظر قليلاً ثم أعد المحاولة.'
          : (message || `تعذّر على Gemini معالجة القصة (HTTP ${upstream.status}).`)
      });
    }

    const outputText = data.output_text || (data.steps || [])
      .filter(step => step.type === 'model_output')
      .flatMap(step => step.content || [])
      .filter(part => part.type === 'text' && part.text)
      .map(part => part.text).join('');

    if (!outputText) {
      console.error('Gemini returned no output_text. Model:', usedModel, 'Response keys:', Object.keys(data));
      return res.status(502).json({ error: 'وصل رد من Gemini لكنه لا يحتوي على مخطط. حاول مرة أخرى.' });
    }

    const storyboard = JSON.parse(outputText);
    if (!Array.isArray(storyboard.scenes) || storyboard.scenes.length === 0) {
      return res.status(502).json({ error: 'المخطط الناتج غير مكتمل. حاول مرة أخرى.' });
    }
    return res.status(200).json({ storyboard, model: usedModel });
  } catch (error) {
    console.error('Storyboard request failed:', error?.name || 'Error', error?.message || '');
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      return res.status(504).json({ error: 'استغرق Gemini وقتاً أطول من اللازم. حاول مرة أخرى بعد قليل.' });
    }
    return res.status(502).json({ error: 'حدث خطأ أثناء الاتصال بمحرك Gemini. راجع إعداد المفتاح وحاول مجدداً.' });
  }
}
