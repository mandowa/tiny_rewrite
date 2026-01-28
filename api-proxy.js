// API Proxy Client for Production
// Uses Cloudflare Worker to protect API keys

class ProxyAPIClient {
  constructor(proxyUrl) {
    this.proxyUrl = proxyUrl;
    this.streamingHandler = new StreamingHandler();
  }
  
  async generateRewrite({ provider, model, inputText, style, onToken, onComplete, onError }) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Config.TIMEOUT_MS);
    
    try {
      // Use centralized prompt from Config
      const systemPrompt = Config.getPrompt(model, style);
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: inputText }
      ];
      
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, messages }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(this.formatError(errorData, response.status));
      }
      
      if (provider === 'azure' || provider === 'qwen' || provider === 'nvidia') {
        await this.handleAzureStream(response, onToken);
      } else if (provider === 'gemini') {
        await this.handleGeminiResponse(response, onToken);
      }
      
      onComplete();
    } catch (error) {
      clearTimeout(timeoutId);
      onError(this.wrapError(error));
    }
    
    return controller;
  }
  
  async handleAzureStream(response, onToken) {
    const reader = response.body.getReader();
    for await (const token of this.streamingHandler.parseSSEStream(reader)) {
      onToken(token);
    }
  }
  
  async handleGeminiResponse(response, onToken) {
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      // Emit by words instead of characters for better performance
      const words = text.split(/(\s+)/);
      for (const word of words) {
        onToken(word);
        await new Promise(r => setTimeout(r, Config.STREAM_DELAY_MS));
      }
    }
  }
  
  formatError(errorData, status) {
    if (typeof errorData.error === 'string') return errorData.error;
    if (errorData.error?.message) return errorData.error.message;
    if (errorData.message) return errorData.message;
    return `API error: ${status}`;
  }
  
  wrapError(error) {
    if (error.name === 'AbortError') return new Error(Config.ERROR_MESSAGES.TIMEOUT);
    if (error.message.includes('fetch')) return new Error(Config.ERROR_MESSAGES.NETWORK_ERROR);
    return error;
  }
}
