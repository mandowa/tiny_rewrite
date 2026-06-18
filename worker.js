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
      
      // TTS endpoint
      if (provider === 'tts') {
        const projectId = env.GCP_PROJECT_ID || 'planar-night-499717-a2';
        const region = env.GCP_REGION || 'global';
        const host = region === 'global' 
          ? 'aiplatform.googleapis.com' 
          : `${region}-aiplatform.googleapis.com`;
        const ttsModel = model || 'gemini-3.1-flash-tts-preview';
        const rawText = messages[0]?.content || '';
        const text = `Say in a clear, natural, and professional tone: ${rawText}`;
        
        response = await fetch(
          `https://${host}/v1/projects/${projectId}/locations/${region}/publishers/google/models/${ttsModel}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': env.GEMINI_API_KEY
            },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: text }] }],
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: messages[0]?.voice || 'Kore'
                    }
                  }
                }
              }
            })
          }
        );
      } else if (provider === 'azure') {
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
      } else if (provider === 'qwen') {
        // Alibaba Qwen (OpenAI-compatible) - International endpoint
        response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.QWEN_API_KEY}`
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            stream: true
          })
        });
      } else if (provider === 'nvidia') {
        // NVIDIA NIM (OpenAI-compatible)
        response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.NVIDIA_API_KEY}`
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            stream: true
          })
        });
      } else if (provider === 'gemini') {
        // Google Gemini via Vertex AI (Agent Platform) - GCP billing
        const projectId = env.GCP_PROJECT_ID || 'planar-night-499717-a2';
        const region = env.GCP_REGION || 'global';
        const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
        const userMessage = messages.find(m => m.role === 'user')?.content || '';
        
        // Global uses no region prefix in host, regional uses {region}- prefix
        const host = region === 'global' 
          ? 'aiplatform.googleapis.com' 
          : `${region}-aiplatform.googleapis.com`;
        
        response = await fetch(
          `https://${host}/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': env.GEMINI_API_KEY
            },
            body: JSON.stringify({
              contents: [{ 
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] 
              }]
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
