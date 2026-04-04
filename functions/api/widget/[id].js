export async function onRequestGet(context) {
  const { params, env } = context;
  const id = params.id;
  
  const projectId = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID;
  const apiKey = env.VITE_FIREBASE_API_KEY || env.FIREBASE_API_KEY;

  if (!projectId || !apiKey) {
    return new Response(JSON.stringify({ 
      error: 'Missing Firebase Configuration',
      details: 'Firebase credentials are not set in Cloudflare Environment Variables.'
    }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/widgets/${id}?key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 404) {
        return new Response(JSON.stringify({ error: 'Widget not found' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }
      return new Response(JSON.stringify({ error: 'Firestore Fetch Failed', details: errorText }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    const data = await response.json();
    const f = data.fields;
    if (!f) throw new Error('No fields in Firestore document');

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
      showBranding: getVal(f.showBranding) !== false,
      brandingText: getVal(f.brandingText),
      brandingLink: getVal(f.brandingLink),
      autoOpen: getVal(f.autoOpen) || false
    };

    return new Response(JSON.stringify(config), {
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
