exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  try {
    const { imageBase64, mediaType } = JSON.parse(event.body);
    if (!process.env.ANTHROPIC_API_KEY) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }) };
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } }, { type: 'text', text: 'You are an expert furniture appraiser. Analyze this furniture photo and respond ONLY with valid JSON: {"name":"product name","category":"Seating or Tables or Storage or Decor or Rugs or Lighting or Other","description":"one sentence","suggestedPrice":100,"condition":"Excellent or Good or Fair","style":"style name"}' }] }] })
    });
    const data = await response.json();
    if (!response.ok || !data.content) {
      return { statusCode: response.status || 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: data.error?.message || 'API failed', type: data.error?.type }) };
    }
    const raw = data.content.map(c => c.text || '').join('').trim();
    const s = raw.indexOf('{'), e = raw.lastIndexOf('}');
    if (s === -1 || e === -1) return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'No JSON in response' }) };
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: raw.slice(s, e + 1) };
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: err.message }) };
  }
};
