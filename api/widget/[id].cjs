/**
 * API Route: GET /api/widget/[id]
 * Fetches widget configuration from Firestore.
 */

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const { id } = req.query;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
  console.log('API: Processing request for id:', id);

  if (!projectId || !apiKey) {
    console.error('API Error: Missing credentials (projectId or apiKey)');
    return res.status(500).json({
      error: 'Missing Firebase Configuration',
      details: 'Firebase Project ID or API Key is not set in environment variables on the server.',
      env: { project: !!projectId, key: !!apiKey }
    });
  }

  if (!id) {
    return res.status(400).json({ error: 'Widget ID is required' });
  }

  try {
    // 1. Fetch widget data from Firestore via REST API
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/widgets/${id}?key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error: Firestore responded with:', response.status, errorText);
      if (response.status === 404) {
        return res.status(404).json({ error: 'Widget not found' });
      }
      return res.status(500).json({
        error: 'Firestore Fetch Failed',
        status: response.status,
        details: errorText,
        url: url.replace(apiKey, 'HIDDEN')
      });
    }

    const data = await response.json();
    const f = data.fields;

    if (!f) {
      console.error('API Error: Firestore document has no fields:', data);
      return res.status(500).json({
        error: 'Data Corruption',
        details: 'Widget found but has no valid configuration data (Firestore fields missing).',
        rawData: data
      });
    }

    // Helper to safely extract values from Firestore's structured JSON
    const getVal = (field) => {
      if (!field) return null;
      if (field.stringValue !== undefined) return field.stringValue;
      if (field.booleanValue !== undefined) return field.booleanValue;
      if (field.integerValue !== undefined) return parseInt(field.integerValue);
      if (field.arrayValue && field.arrayValue.values) {
        return field.arrayValue.values.map(v => v.stringValue || v.integerValue || v.booleanValue);
      }
      return null;
    };

    const ownerUid = getVal(f.ownerUid);
    let showBranding = getVal(f.showBranding) !== false;

    // 2. Fetch User Plan for Branding Rules
    if (ownerUid) {
      try {
        const userUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${ownerUid}?key=${apiKey}`;
        const userRes = await fetch(userUrl);
        if (userRes.ok) {
          const userData = await userRes.json();
          const plan = getVal(userData.fields?.plan) || 'starter';

          if (plan === 'starter') {
            showBranding = true;
          } else if (plan === 'business') {
            showBranding = false;
          }
          // 'pro' plan stays as configured in widget settings
        }
      } catch (e) {
        console.error('Error fetching user plan:', e);
      }
    }

    // 3. Construct and Return Config
    const config = {
      hook: getVal(f.n8nWebhookUrl),
      name: getVal(f.name),
      logo: getVal(f.logoUrl),
      color: getVal(f.primaryColor),
      botBg: getVal(f.botBubbleColor),
      usrBg: getVal(f.userBubbleColor),
      greetingMessage: getVal(f.greetingMessage),
      headerSubtitle: getVal(f.headerSubtitle),
      prompts: getVal(f.starterQuestions) || [],
      showBranding: showBranding,
      brandingText: getVal(f.brandingText),
      brandingLink: getVal(f.brandingLink),
      autoOpen: getVal(f.autoOpen) || false
    };

    return res.status(200).json(config);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      details: error.message,
      env: { project: !!projectId, key: !!apiKey }
    });
  }
}
