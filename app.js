// ============================================================================
// Validation Service
// ============================================================================
class ValidationService {
  validateInput(text, maxLength) {
    if (this.isEmpty(text)) {
      return { isValid: false, error: Config.ERROR_MESSAGES.EMPTY_INPUT };
    }
    if (this.exceedsLimit(text, maxLength)) {
      return { isValid: false, error: `Text exceeds ${maxLength} characters` };
    }
    return { isValid: true };
  }
  
  isEmpty(text) {
    return !text || text.trim().length === 0;
  }
  
  exceedsLimit(text, maxLength) {
    return text.length > maxLength;
  }
}

// ============================================================================
// TTS Service
// ============================================================================
class TTSService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.currentUtterance = null;
  }
  
  getVoices() {
    return this.synth.getVoices();
  }
  
  speak(text, options = {}) {
    // Stop any current speech
    this.stop();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || Config.TTS_CONFIG.DEFAULT_LANG;
    utterance.rate = options.rate || Config.TTS_CONFIG.DEFAULT_RATE;
    utterance.pitch = options.pitch || Config.TTS_CONFIG.DEFAULT_PITCH;
    utterance.volume = options.volume || Config.TTS_CONFIG.DEFAULT_VOLUME;
    
    // Try to use preferred voice
    if (options.voice) {
      utterance.voice = options.voice;
    } else {
      const voices = this.getVoices();
      const preferredVoice = voices.find(voice => 
        Config.TTS_CONFIG.PREFERRED_VOICES.some(name => 
          voice.name.includes(name)
        )
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }
    
    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }
  
  stop() {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }
  
  isSpeaking() {
    return this.synth.speaking;
  }
  
  pause() {
    this.synth.pause();
  }
  
  resume() {
    this.synth.resume();
  }
}

// ============================================================================
// Streaming Handler
// ============================================================================
class StreamingHandler {
  async *parseSSEStream(reader) {
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim() === '') continue;
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            const token = this.extractToken(parsed);
            if (token) yield token;
          } catch (e) {
            console.error('Parse error:', e);
          }
        }
      }
    }
  }
  
  extractToken(chunk) {
    return chunk.choices?.[0]?.delta?.content || null;
  }
}

// ============================================================================
// API Client
// ============================================================================
class APIClient {
  constructor(provider, config) {
    this.provider = provider;
    this.endpoint = config.endpoint;
    this.apiKey = config.apiKey;
    this.type = config.type;
    this.streamingHandler = new StreamingHandler();
  }
  
  buildSystemPrompt(style) {
    return Config.STYLES[style]?.systemPrompt || '';
  }
  
  async generateRewrite({ model, inputText, style, onToken, onComplete, onError }) {
    if (this.type === 'gemini') {
      return this.generateRewriteGemini({ model, inputText, style, onToken, onComplete, onError });
    } else {
      return this.generateRewriteOpenAI({ model, inputText, style, onToken, onComplete, onError });
    }
  }
  
  async generateRewriteOpenAI({ model, inputText, style, onToken, onComplete, onError }) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Config.TIMEOUT_MS);
    
    try {
      const systemPrompt = this.buildSystemPrompt(style);
      
      const requestBody = {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: inputText }
        ],
        stream: true
      };
      
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.detail || `API error: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      const reader = response.body.getReader();
      
      for await (const token of this.streamingHandler.parseSSEStream(reader)) {
        onToken(token);
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
  
  async generateRewriteGemini({ model, inputText, style, onToken, onComplete, onError }) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Config.TIMEOUT_MS);
    
    try {
      const systemPrompt = this.buildSystemPrompt(style);
      const fullPrompt = `${systemPrompt}\n\n${inputText}`;
      
      // Use non-streaming endpoint for reliability
      const endpoint = `${this.endpoint}/${model}:generateContent?key=${this.apiKey}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: fullPrompt }]
          }]
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `API error: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        // Simulate streaming by outputting character by character
        for (const char of text) {
          onToken(char);
          // Small delay for visual effect
          await new Promise(r => setTimeout(r, 5));
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

// ============================================================================
// Input Area Component
// ============================================================================
class InputArea {
  constructor(maxLength) {
    this.maxLength = maxLength;
    this.textarea = document.getElementById('input-text');
    this.charCount = document.getElementById('char-count');
    this.spellSuggestions = document.getElementById('spell-suggestions');
    this.changeCallbacks = [];
    this.currentError = null;
    this.selectedIndex = 0;
    this.spellCheckTimer = null;
    
    this.textarea.addEventListener('input', () => this.handleInput());
    this.textarea.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!this.spellSuggestions.contains(e.target) && e.target !== this.textarea) {
        this.hideSpellSuggestions();
      }
    });
    
    // Load dictionary
    spellChecker.loadDictionary();
  }
  
  handleInput() {
    this.updateCharCount();
    this.changeCallbacks.forEach(cb => cb(this.getText()));
    
    // Debounce spell check - wait 500ms after user stops typing
    clearTimeout(this.spellCheckTimer);
    
    // If text is empty or current error word no longer exists, hide immediately
    const text = this.getText();
    if (!text.trim()) {
      this.hideSpellSuggestions();
      return;
    }
    
    // If current error word was deleted/changed, hide suggestions
    if (this.currentError) {
      const currentWord = text.substring(this.currentError.start, this.currentError.end);
      if (currentWord !== this.currentError.word) {
        this.hideSpellSuggestions();
      }
    }
    
    this.spellCheckTimer = setTimeout(() => {
      this.checkSpelling();
    }, 500);
  }
  
  handleKeyDown(e) {
    // If suggestions visible, handle navigation
    const isVisible = this.spellSuggestions.style.display === 'flex';
    if (isVisible && this.currentError) {
      const items = this.spellSuggestions.querySelectorAll('.spell-item');
      if (items.length === 0) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
        this.updateSelection(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.updateSelection(items);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (items[this.selectedIndex]) {
          e.preventDefault();
          e.stopPropagation();
          this.applySuggestion(items[this.selectedIndex].dataset.word);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.hideSpellSuggestions();
      }
    }
  }
  
  updateSelection(items) {
    items.forEach((item, i) => {
      const isSelected = i === this.selectedIndex;
      item.style.color = isSelected ? '#a5b4fc' : '#a1a1aa';
      item.style.background = isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent';
      item.style.borderLeftColor = isSelected ? '#6366f1' : 'transparent';
      item.style.fontWeight = isSelected ? '500' : '400';
      
      if (isSelected) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }
  
  checkSpelling() {
    if (!spellChecker.loaded) return;
    
    const text = this.getText();
    if (!text.trim()) return;
    
    // Find all words and check them
    const words = text.match(/\b[a-zA-Z]+\b/g);
    if (!words) return;
    
    // Find the last misspelled word
    let lastError = null;
    const wordRegex = /\b[a-zA-Z]+\b/g;
    let match;
    
    while ((match = wordRegex.exec(text)) !== null) {
      const word = match[0];
      if (word.length >= 3 && !spellChecker.isCorrect(word)) {
        lastError = {
          word: word,
          start: match.index,
          end: match.index + word.length
        };
      }
    }
    
    if (lastError) {
      const suggestions = spellChecker.suggest(lastError.word);
      if (suggestions.length > 0) {
        this.showSpellSuggestions(lastError.word, lastError.start, suggestions);
      }
    }
  }
  
  showSpellSuggestions(word, wordStart, suggestions) {
    this.currentError = { word, start: wordStart, end: wordStart + word.length };
    this.selectedIndex = 0;
    
    // Calculate word position using mirror element technique
    const coords = this.getCaretCoordinates(wordStart);
    
    // Build suggestions HTML with inline styles for reliability
    const itemsHtml = suggestions.map((s, i) => {
      const isSelected = i === 0;
      const baseStyle = `
        display: block;
        width: 100%;
        padding: 10px 14px;
        font-family: inherit;
        font-size: 14px;
        color: ${isSelected ? '#a5b4fc' : '#a1a1aa'};
        background: ${isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent'};
        border: none;
        border-left: 3px solid ${isSelected ? '#6366f1' : 'transparent'};
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        text-align: left;
        cursor: pointer;
        font-weight: ${isSelected ? '500' : '400'};
      `;
      return `<button type="button" class="spell-item${isSelected ? ' selected' : ''}" data-word="${s}" style="${baseStyle}">${s}</button>`;
    }).join('');
    
    this.spellSuggestions.innerHTML = `
      <div style="
        padding: 10px 14px;
        font-size: 12px;
        font-weight: 600;
        color: #f87171;
        background: rgba(239, 68, 68, 0.08);
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      ">⚠ 「${word}」</div>
      ${itemsHtml}
    `;
    
    // Apply positioning with full styling
    this.spellSuggestions.style.cssText = `
      display: flex;
      flex-direction: column;
      position: fixed;
      top: ${coords.top}px;
      left: ${coords.left}px;
      background: linear-gradient(180deg, #1f1f23 0%, #18181b 100%);
      border: 1px solid rgba(99, 102, 241, 0.4);
      border-radius: 10px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 10px 20px -2px rgba(0, 0, 0, 0.4);
      min-width: 180px;
      max-width: 260px;
      overflow: hidden;
      z-index: 99999;
    `;
    
    // Add click and hover handlers
    const items = this.spellSuggestions.querySelectorAll('.spell-item');
    items.forEach((item, index) => {
      item.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.applySuggestion(item.dataset.word);
      };
      item.onmouseenter = () => {
        this.selectedIndex = index;
        this.updateSelection(items);
      };
    });
  }
  
  // Mirror element technique to get caret coordinates in textarea
  getCaretCoordinates(position) {
    // Create mirror div
    const mirror = document.createElement('div');
    const computed = window.getComputedStyle(this.textarea);
    
    // Copy textarea styles to mirror
    const properties = [
      'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
      'letterSpacing', 'textTransform', 'wordSpacing',
      'textIndent', 'whiteSpace', 'wordWrap', 'wordBreak',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
      'boxSizing', 'lineHeight'
    ];
    
    mirror.style.position = 'absolute';
    mirror.style.top = '0';
    mirror.style.left = '-9999px';
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.wordWrap = 'break-word';
    mirror.style.overflow = 'hidden';
    mirror.style.width = computed.width;
    
    properties.forEach(prop => {
      mirror.style[prop] = computed[prop];
    });
    
    document.body.appendChild(mirror);
    
    // Get text up to position
    const text = this.textarea.value.substring(0, position);
    mirror.textContent = text;
    
    // Add span to mark position
    const span = document.createElement('span');
    span.textContent = this.textarea.value.substring(position) || '.';
    mirror.appendChild(span);
    
    // Get coordinates
    const textareaRect = this.textarea.getBoundingClientRect();
    const spanRect = span.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();
    
    // Calculate relative position within mirror
    const relativeTop = spanRect.top - mirrorRect.top;
    const relativeLeft = spanRect.left - mirrorRect.left;
    
    // Account for textarea scroll
    const scrollTop = this.textarea.scrollTop;
    
    // Calculate final position (below the word)
    const lineHeight = parseInt(computed.lineHeight) || 20;
    const top = textareaRect.top + relativeTop - scrollTop + lineHeight + 4;
    const left = textareaRect.left + relativeLeft;
    
    // Cleanup
    document.body.removeChild(mirror);
    
    // Ensure dropdown stays within viewport
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownHeight = 200; // approximate
    const dropdownWidth = 200;
    
    return {
      top: Math.min(top, viewportHeight - dropdownHeight),
      left: Math.min(Math.max(left, 8), viewportWidth - dropdownWidth)
    };
  }
  
  hideSpellSuggestions() {
    this.spellSuggestions.style.display = 'none';
    this.currentError = null;
  }
  
  applySuggestion(suggestion) {
    if (!this.currentError) return;
    
    const text = this.getText();
    const newText = text.substring(0, this.currentError.start) + 
                    suggestion + 
                    text.substring(this.currentError.end);
    
    this.textarea.value = newText;
    
    // Move cursor to end of replaced word
    const newCursorPos = this.currentError.start + suggestion.length;
    this.textarea.setSelectionRange(newCursorPos, newCursorPos);
    this.textarea.focus();
    
    this.hideSpellSuggestions();
    this.updateCharCount();
    this.changeCallbacks.forEach(cb => cb(this.getText()));
  }
  
  updateCharCount() {
    const count = this.getCharCount();
    this.charCount.textContent = `${count} / ${this.maxLength}`;
  }
  
  getText() {
    return this.textarea.value;
  }
  
  getCharCount() {
    return this.textarea.value.length;
  }
  
  isValid() {
    const text = this.getText();
    return text.trim().length > 0 && text.length <= this.maxLength;
  }
  
  clear() {
    this.textarea.value = '';
    this.updateCharCount();
  }
  
  setEnabled(enabled) {
    this.textarea.disabled = !enabled;
  }
  
  onChange(callback) {
    this.changeCallbacks.push(callback);
  }
}

// ============================================================================
// Model Selector Component
// ============================================================================
class ModelSelector {
  constructor(models) {
    this.models = models;
    this.select = document.getElementById('model-selector');
    this.selectCallbacks = [];
    
    this.select.addEventListener('change', () => this.handleChange());
  }
  
  handleChange() {
    this.selectCallbacks.forEach(cb => cb(this.getSelectedModel()));
  }
  
  getSelectedModel() {
    return this.select.value;
  }
  
  setSelectedModel(modelId) {
    this.select.value = modelId;
  }
  
  onSelect(callback) {
    this.selectCallbacks.push(callback);
  }
}

// ============================================================================
// Rewrite Display Component
// ============================================================================
class RewriteDisplay {
  constructor(styleLabel, enableTTS = false) {
    this.styleLabel = styleLabel;
    this.enableTTS = enableTTS;
    this.card = document.querySelector(`[data-style="${styleLabel}"]`);
    this.loadingIndicator = this.card.querySelector('.loading-indicator');
    this.rewriteText = this.card.querySelector('.rewrite-text');
    this.errorMessage = this.card.querySelector('.error-message');
    this.placeholderText = this.card.querySelector('.placeholder-text');
    this.copyBtn = this.card.querySelector('.copy-btn');
    
    if (enableTTS) {
      this.playBtn = this.card.querySelector('.play-btn');
      this.ttsService = new TTSService();
      this.setupTTS();
    }
    
    this.setupCopy();
  }
  
  setupCopy() {
    this.copyBtn.addEventListener('click', () => this.copyToClipboard());
  }
  
  setupTTS() {
    this.playBtn.addEventListener('click', () => {
      if (this.ttsService.isSpeaking()) {
        this.stopAudio();
      } else {
        this.playAudio();
      }
    });
  }
  
  startStreaming() {
    this.loadingIndicator.classList.remove('hidden');
    this.rewriteText.textContent = '';
    this.errorMessage.classList.add('hidden');
    if (this.placeholderText) {
      this.placeholderText.classList.add('hidden');
    }
  }
  
  appendToken(token) {
    this.rewriteText.textContent += token;
  }
  
  completeStreaming() {
    this.loadingIndicator.classList.add('hidden');

    // If the stream produced no content, fall back to placeholder.
    if (this.placeholderText && !this.getText()) {
      this.placeholderText.classList.remove('hidden');
    }
  }
  
  showError(message) {
    this.loadingIndicator.classList.add('hidden');
    this.errorMessage.textContent = message;
    this.errorMessage.classList.remove('hidden');
    if (this.placeholderText) {
      this.placeholderText.classList.add('hidden');
    }
  }
  
  getText() {
    return this.rewriteText.textContent;
  }
  
  clear() {
    this.rewriteText.textContent = '';
    this.errorMessage.classList.add('hidden');
    this.loadingIndicator.classList.add('hidden');
    if (this.placeholderText) {
      this.placeholderText.classList.remove('hidden');
    }
  }
  
  async copyToClipboard() {
    const text = this.getText();
    if (!text) return;
    
    try {
      await navigator.clipboard.writeText(text);
      this.showCopyFeedback();
    } catch (error) {
      console.error('Copy failed:', error);
      this.showError(Config.ERROR_MESSAGES.CLIPBOARD_ERROR);
    }
  }
  
  showCopyFeedback() {
    this.copyBtn.classList.add('copied');
    setTimeout(() => {
      this.copyBtn.classList.remove('copied');
    }, 2000);
  }
  
  async playAudio() {
    const text = this.getText();
    if (!text) return;
    
    try {
      this.playBtn.classList.add('playing');
      
      this.ttsService.speak(text);
      
      // Listen for speech end
      if (this.ttsService.currentUtterance) {
        this.ttsService.currentUtterance.onend = () => {
          this.stopAudio();
        };
      }
    } catch (error) {
      console.error('TTS failed:', error);
      this.showError(Config.ERROR_MESSAGES.TTS_ERROR);
      this.stopAudio();
    }
  }
  
  stopAudio() {
    this.ttsService.stop();
    this.playBtn.classList.remove('playing');
  }
  
  isPlaying() {
    return this.ttsService && this.ttsService.isSpeaking();
  }
}

// ============================================================================
// App State
// ============================================================================
class AppState {
  constructor() {
    this.inputText = '';
    this.selectedModel = Config.DEFAULT_MODEL;
    this.rewrites = {
      email: '',
      teams: '',
      speaking: ''
    };
    this.isProcessing = false;
  }
  
  setInputText(text) {
    this.inputText = text;
  }
  
  setSelectedModel(model) {
    this.selectedModel = model;
  }
  
  updateRewrite(style, text) {
    this.rewrites[style] = text;
  }
  
  setProcessing(processing) {
    this.isProcessing = processing;
  }
  
  clearRewrites() {
    this.rewrites = {
      email: '',
      teams: '',
      speaking: ''
    };
  }
}

// ============================================================================
// Main App Controller
// ============================================================================
class App {
  constructor() {
    // Initialize services
    this.validationService = new ValidationService();
    
    // Check if using proxy (production) or direct API (development)
    if (typeof Config.API_PROXY !== 'undefined' && typeof ProxyAPIClient !== 'undefined') {
      // Production mode: use proxy
      this.apiClient = new ProxyAPIClient(Config.API_PROXY);
      this.useProxy = true;
      this.currentProvider = Config.DEFAULT_PROVIDER || 'azure'; // Set default provider for proxy mode
    } else {
      // Development mode: direct API calls
      this.currentProvider = this.getInitialProvider();
      this.apiClient = this.createAPIClient(this.currentProvider);
      this.useProxy = false;
    }
    
    // Initialize state
    this.state = new AppState();
    this.state.setSelectedModel(Config.DEFAULT_MODELS[this.currentProvider]);
    
    // Initialize components
    this.inputArea = new InputArea(Config.MAX_INPUT_LENGTH);
    this.providerSelector = document.getElementById('provider-selector');
    if (!this.useProxy) {
      this.providerSelector.value = this.currentProvider;
    }
    this.modelSelector = new ModelSelector(Config.MODELS[this.currentProvider]);
    this.rewriteDisplays = {
      email: new RewriteDisplay('email'),
      teams: new RewriteDisplay('teams'),
      speaking: new RewriteDisplay('speaking', true)
    };
    
    // Get rewrite button
    this.rewriteBtn = document.getElementById('rewrite-btn');
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load saved preferences
    this.loadStylePreferences();
    if (!this.useProxy) {
      this.loadProviderPreference();
    }
    
    // Populate model selector
    this.updateModelSelector();

    // Warn (but don't abort) if provider config is missing.
    if (!this.useProxy) {
      this.warnIfProviderNotConfigured(this.currentProvider);
    }
    
    // Debounce timer
    this.debounceTimer = null;
  }

  getInitialProvider() {
    const saved = localStorage.getItem('selectedProvider');
    const candidate = (saved && Config.API_PROVIDERS[saved]) ? saved : Config.DEFAULT_PROVIDER;

    if (this.isProviderConfigured(candidate)) return candidate;

    const fallback = Object.keys(Config.API_PROVIDERS).find((provider) => this.isProviderConfigured(provider));
    return fallback || candidate;
  }

  isProviderConfigured(provider) {
    // In proxy mode, all providers are configured via the Worker
    if (this.useProxy) return true;
    
    const config = Config.API_PROVIDERS[provider];
    if (!config) return false;
    return Boolean(config.endpoint && config.apiKey);
  }

  warnIfProviderNotConfigured(provider) {
    if (this.isProviderConfigured(provider)) return;

    // Don't block UI initialization; the app can still be used for editing and
    // style selection, and users may switch to a configured provider.
    alert(Config.ERROR_MESSAGES.CONFIG_ERROR);
  }
  
  createAPIClient(provider) {
    const config = Config.API_PROVIDERS[provider];
    return new APIClient(provider, config);
  }
  
  loadProviderPreference() {
    const saved = localStorage.getItem('selectedProvider');
    if (saved && Config.API_PROVIDERS[saved]) {
      if (!this.isProviderConfigured(saved)) {
        this.warnIfProviderNotConfigured(saved);
        return;
      }

      this.currentProvider = saved;
      this.providerSelector.value = saved;
      this.apiClient = this.createAPIClient(saved);
      this.state.setSelectedModel(Config.DEFAULT_MODELS[saved]);
    }
  }
  
  saveProviderPreference() {
    localStorage.setItem('selectedProvider', this.currentProvider);
  }
  
  updateModelSelector() {
    const modelSelect = document.getElementById('model-selector');
    modelSelect.innerHTML = '';
    
    // In proxy mode, use unified model list if available
    const models = (this.useProxy && Config.ALL_MODELS) 
      ? Config.ALL_MODELS 
      : Config.MODELS[this.currentProvider];
    
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = `${model.label} — ${model.description}`;
      if (model.provider) {
        option.dataset.provider = model.provider;
      }
      modelSelect.appendChild(option);
    });
    
    // Set default model
    const defaultModel = Config.DEFAULT_MODELS[this.currentProvider];
    modelSelect.value = defaultModel;
    this.state.setSelectedModel(defaultModel);
  }
  
  loadStylePreferences() {
    const saved = localStorage.getItem('stylePreferences');
    if (saved) {
      try {
        const preferences = JSON.parse(saved);
        ['email', 'teams', 'speaking'].forEach(style => {
          const checkbox = document.getElementById(`style-${style}`);
          if (preferences[style] !== undefined) {
            checkbox.checked = preferences[style];
          }
        });
      } catch (e) {
        console.error('Failed to load style preferences:', e);
      }
    }
    this.updateRewriteButton();
  }
  
  saveStylePreferences() {
    const preferences = {};
    ['email', 'teams', 'speaking'].forEach(style => {
      const checkbox = document.getElementById(`style-${style}`);
      preferences[style] = checkbox.checked;
    });
    localStorage.setItem('stylePreferences', JSON.stringify(preferences));
  }
  
  setupEventListeners() {
    // Input change
    this.inputArea.onChange((text) => {
      this.state.setInputText(text);
      this.updateRewriteButton();
    });
    
    // Provider selection
    this.providerSelector.addEventListener('change', () => {
      const selected = this.providerSelector.value;
      
      // In proxy mode, just update currentProvider, don't recreate apiClient
      if (this.useProxy) {
        this.currentProvider = selected;
        this.updateModelSelector();
        return;
      }
      
      if (!this.isProviderConfigured(selected)) {
        this.warnIfProviderNotConfigured(selected);
        this.providerSelector.value = this.currentProvider;
        return;
      }

      this.currentProvider = selected;
      this.apiClient = this.createAPIClient(this.currentProvider);
      this.updateModelSelector();
      this.saveProviderPreference();
    });
    
    // Model selection
    const modelSelect = document.getElementById('model-selector');
    modelSelect.addEventListener('change', () => {
      const selectedOption = modelSelect.options[modelSelect.selectedIndex];
      const modelId = modelSelect.value;
      
      // In proxy mode with unified model list, auto-switch provider
      if (this.useProxy && selectedOption.dataset.provider) {
        this.currentProvider = selectedOption.dataset.provider;
      }
      
      this.state.setSelectedModel(modelId);
    });
    
    // Style checkboxes
    ['email', 'teams', 'speaking'].forEach(style => {
      const checkbox = document.getElementById(`style-${style}`);
      checkbox.addEventListener('change', () => {
        this.saveStylePreferences();
        this.updateRewriteButton();
      });
    });
    
    // Rewrite button
    this.rewriteBtn.addEventListener('click', () => {
      this.handleRewriteRequest();
    });

    // Keyboard shortcut: ⌘+Enter to rewrite
    // (Also support Ctrl+Enter for non-mac keyboards.)
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      if (!e.metaKey && !e.ctrlKey) return;
      if (this.rewriteBtn.disabled) return;

      e.preventDefault();
      this.rewriteBtn.click();
    });
  }
  
  getSelectedStyles() {
    const styles = [];
    ['email', 'teams', 'speaking'].forEach(style => {
      const checkbox = document.getElementById(`style-${style}`);
      if (checkbox.checked) {
        styles.push(style);
      }
    });
    return styles;
  }
  
  updateRewriteButton() {
    const hasInput = this.inputArea.isValid();
    const hasSelectedStyle = this.getSelectedStyles().length > 0;
    this.rewriteBtn.disabled = !hasInput || !hasSelectedStyle || this.state.isProcessing;
  }
  
  handleRewriteRequest() {
    if (!this.isProviderConfigured(this.currentProvider)) {
      this.warnIfProviderNotConfigured(this.currentProvider);
      return;
    }

    // Debounce rapid clicks
    if (this.debounceTimer) {
      return;
    }
    
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
    }, 500);
    
    // Validate input
    const validation = this.validationService.validateInput(
      this.state.inputText,
      Config.MAX_INPUT_LENGTH
    );
    
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }
    
    // Start processing
    this.state.setProcessing(true);
    this.updateRewriteButton();
    this.state.clearRewrites();
    
    // Clear previous results
    Object.values(this.rewriteDisplays).forEach(display => display.clear());
    
    // Generate rewrites sequentially for better performance
    this.generateRewritesSequentially();
  }
  
  async generateRewritesSequentially() {
    const selectedStyles = this.getSelectedStyles();
    
    // Hide unselected cards
    ['email', 'teams', 'speaking'].forEach(style => {
      const card = document.querySelector(`[data-style="${style}"]`);
      if (selectedStyles.includes(style)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
    
    for (const style of selectedStyles) {
      await this.generateRewrite(style);
    }
    
    this.state.setProcessing(false);
    this.updateRewriteButton();
  }
  
  async generateRewrite(style) {
    const display = this.rewriteDisplays[style];
    display.startStreaming();
    
    return new Promise((resolve) => {
      const params = {
        model: this.state.selectedModel,
        inputText: this.state.inputText,
        style: style,
        onToken: (token) => {
          display.appendToken(token);
          this.state.updateRewrite(style, display.getText());
        },
        onComplete: () => {
          display.completeStreaming();
          resolve();
        },
        onError: (error) => {
          console.error(`Error generating ${style} rewrite:`, error);
          display.showError(error.message || Config.ERROR_MESSAGES.API_ERROR);
          resolve();
        }
      };
      
      // Add provider if using proxy
      if (this.useProxy) {
        params.provider = this.currentProvider || 'azure';
      }
      
      this.apiClient.generateRewrite(params);
    });
  }
  
  checkAllComplete() {
    // No longer needed with sequential generation
  }
}

// ============================================================================
// Initialize App
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
