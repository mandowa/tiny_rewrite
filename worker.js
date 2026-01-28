// Writing Flow API Proxy
// Protects API keys by proxying requests server-side

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { provider, model, messages } = await request.json();
      
      // Input validation
      if (!provider || !model || !messages) {
        return new Response(JSON.stringify({ error: 'Missing required fields: provider, model, messages' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      let response;
      
      if (provider === 'azure') {
        // Azure Foundry (OpenAI-compatible)
        response = await fetch(env.AZURE_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.AZURE_API_KEY}`
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            stream: true
          })
        });
      } else if (provider === 'gemini') {
        // Google Gemini (non-streaming)
        const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
        const userMessage = messages.find(m => m.role === 'user')?.content || '';
        const fullPrompt = `${systemPrompt}\n\n${userMessage}`;
        
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }]
            })
          }
        );
      } else {
        return new Response(JSON.stringify({ error: 'Invalid provider' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Return response with CORS headers
      const newResponse = new Response(response.body, response);
      Object.keys(corsHeaders).forEach(key => {
        newResponse.headers.set(key, corsHeaders[key]);
      });
      
      return newResponse;
      
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
}
