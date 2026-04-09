/**
 * API Route: POST /api/track
 * Securely records widget analytics events to Firestore.
 */

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { widgetId, eventType, sessionId, country, sentiment } = req.body || {};
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;

  if (!widgetId || !eventType) {
    console.error('Track API: Missing fields:', { widgetId, eventType });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!projectId || !apiKey) {
    console.error('Track API: Missing credentials');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/analytics?key=${apiKey}`;

    const payload = {
      fields: {
        widgetId: { stringValue: widgetId },
        eventType: { stringValue: eventType },
        sessionId: { stringValue: sessionId || 'unknown' },
        ts: { timestampValue: new Date().toISOString() },
        country: { stringValue: country || 'Unknown' }
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
      const errText = await response.text();
      console.error('Track API: Firestore rejected:', response.status, errText);
      throw new Error('Failed to save to Firestore');
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Tracking Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
