export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();
  const { widgetId, eventType, sessionId, sentiment } = body;
  
  let detectedCountry = request.headers.get('cf-ipcountry') || 'Unknown';
  if (detectedCountry !== 'Unknown' && detectedCountry.length === 2) {
    try {
      const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
      detectedCountry = regionNames.of(detectedCountry) || detectedCountry;
    } catch(e) {}
  }
  
  const projectId = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID;
  const apiKey = env.VITE_FIREBASE_API_KEY || env.FIREBASE_API_KEY;

  if (!widgetId || !eventType || !projectId || !apiKey) {
    return new Response(JSON.stringify({ error: 'Missing logic' }), { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/analytics?key=${apiKey}`;
    
    const payload = {
      fields: {
        widgetId: { stringValue: widgetId },
        eventType: { stringValue: eventType },
        sessionId: { stringValue: sessionId || 'unknown' },
        ts: { timestampValue: new Date().toISOString() },
        country: { stringValue: detectedCountry }
      }
    };

    if (sentiment) {
      payload.fields.sentiment = { stringValue: sentiment };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Failed to save to Firestore');
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// OPTIONS handler for CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
