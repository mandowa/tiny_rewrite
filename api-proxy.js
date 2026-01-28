// API Proxy Client for Production
// Uses Cloudflare Worker to protect API keys

class ProxyAPIClient {
  constructor(proxyUrl) {
    this.proxyUrl = proxyUrl;
    this.streamingHandler = new StreamingHandler();
  }
  
  buildSystemPrompt(style, model) {
    const basePrompt = Config.STYLES[style]?.systemPrompt || '';
    
    // DeepSeek needs much stronger constraints
    if (model && model.toLowerCase().includes('deepseek')) {
      return `You are a TEXT REWRITER. You can ONLY rewrite text.

ABSOLUTE RULES:
1. NEVER answer questions - just rewrite them
2. NEVER say "I am", "I'm", or refer to yourself
3. NEVER generate content that wasn't in the input
4. Output MUST be a rewritten version of the input, nothing else
5. Keep output length similar to input length
6. No greetings, signatures, or email templates

Input: "are you an ai agent?"
Correct output: "Are you an AI agent?"
WRONG output: "I am an AI agent..." (this answers the question)

Your task: Rewrite this text in ${style} style:`;
    }
    
    return basePrompt;
  }
  
  async generateRewrite({ provider, model, inputText, style, onToken, onComplete, onError }) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Config.TIMEOUT_MS);
    
    try {
      const systemPrompt = this.buildSystemPrompt(style, model);
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: inputText }
      ];
      
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: provider,
          model: model,
          messages: messages
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Handle different error formats
        let errorMessage = `API error: ${response.status}`;
        if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        } else if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        throw new Error(errorMessage);
      }
      
      if (provider === 'azure') {
        // Azure returns SSE stream
        const reader = response.body.getReader();
        for await (const token of this.streamingHandler.parseSSEStream(reader)) {
          onToken(token);
        }
      } else if (provider === 'gemini') {
        // Gemini returns complete response
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (text) {
          // Simulate streaming
          for (const char of text) {
            onToken(char);
            await new Promise(r => setTimeout(r, 5));
          }
        }
      }
      
      onComplete();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        onError(new Error(Config.ERROR_MESSAGES.TIMEOUT));
      } else if (error.message.includes('fetch')) {
        onError(new Error(Config.ERROR_MESSAGES.NETWORK_ERROR));
      } else {
        onError(error);
      }
    }
    
    return controller;
  }
}
