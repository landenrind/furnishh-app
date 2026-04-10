exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  try {
    const { imageBase64, mediaType } = JSON.parse(event.body);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 }
            },
            {
              type: 'text',
              text: 'You are an expert furniture appraiser for Furnishh, a boutique furniture store in West Jordan Utah. Analyze this furniture photo and respond ONLY with valid JSON no markdown: {"name":"4-6 word product name","category":"Seating or Tables or Storage or Decor or Rugs or Lighting or Other","description":"one warm sentence about this piece","suggestedPrice":000,"condition":"Excellent or Good or Fair","style":"e.g. Mid-century modern, Contemporary, Rustic, Scandinavian, Industrial, Traditional"}'
            }
          ]
        }]
      })
    });
    const data = await response.json();
    const raw = data.content.map(c => c.text || '').join('').replace(/```json|```/g, '').trim();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    const parsed = JSON.parse(raw.slice(start, end + 1));
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
