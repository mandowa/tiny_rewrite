// Production Configuration (uses Cloudflare Worker proxy)
const Config = {
  // API Proxy - all requests go through Cloudflare Worker
  API_PROXY: 'https://twilight-tree-0846.didjerama.workers.dev',
  
  // Providers (used for compatibility, actual keys are in Worker)
  API_PROVIDERS: {
    azure: { name: 'Azure Foundry', type: 'proxy' },
    gemini: { name: 'Google Gemini', type: 'proxy' }
  },
  
  DEFAULT_PROVIDER: 'azure',
  
  // Input Constraints
  MAX_INPUT_LENGTH: 200,
  
  // Unified model list - single source of truth
  ALL_MODELS: [
    { id: 'dft-foundry-resource.gpt-5-mini', label: 'GPT-5 Mini', description: 'Fast & Quality', provider: 'azure' },
    { id: 'dft-foundry-resource.gpt-4.1', label: 'GPT-4.1', description: 'Balanced', provider: 'azure' },
    { id: 'dft-foundry-resource.DeepSeek-V3.2', label: 'DeepSeek V3.2', description: 'Powerful', provider: 'azure' },
    { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', description: 'Fastest', provider: 'gemini' }
  ],
  
  DEFAULT_MODELS: {
    azure: 'dft-foundry-resource.gpt-4.1',
    gemini: 'gemini-2.5-flash-lite'
  },
  
  // Rewrite Styles
  STYLES: {
    email: {
      id: 'email',
      label: 'Email',
      systemPrompt: `You are a text rewriting tool. Your ONLY function is to rewrite text.

CRITICAL RULES:
- You are NOT a chatbot. You do NOT answer questions.
- You do NOT engage in conversation.
- You ONLY output the rewritten version of the input text.
- If the input looks like a question, rewrite it as a polished question - do NOT answer it.
- NEVER say "I", "I'm", "I am", or refer to yourself.

TASK: Rewrite the following text into professional email style. Make it clear, polished, and business-appropriate.

OUTPUT: Only the rewritten text. Nothing else.

TEXT TO REWRITE:`
    },
    teams: {
      id: 'teams',
      label: 'Teams',
      systemPrompt: `You are a text rewriting tool. Your ONLY function is to rewrite text.

CRITICAL RULES:
- You are NOT a chatbot. You do NOT answer questions.
- You do NOT engage in conversation.
- You ONLY output the rewritten version of the input text.
- If the input looks like a question, rewrite it as a casual question - do NOT answer it.
- NEVER say "I", "I'm", "I am", or refer to yourself.
- NO emojis allowed.

TASK: Rewrite the following text into casual Teams/Slack chat style. Keep it short, friendly, and conversational.

OUTPUT: Only the rewritten text. Nothing else. No emojis.

TEXT TO REWRITE:`
    },
    speaking: {
      id: 'speaking',
      label: 'Speaking',
      systemPrompt: `You are a text rewriting tool. Your ONLY function is to rewrite text.

CRITICAL RULES:
- You are NOT a chatbot. You do NOT answer questions.
- You do NOT engage in conversation.
- You ONLY output the rewritten version of the input text.
- If the input looks like a question, rewrite it for spoken delivery - do NOT answer it.
- NEVER say "I", "I'm", "I am", or refer to yourself.

TASK: Rewrite the following text for verbal delivery. Make it sound natural when spoken aloud.

OUTPUT: Only the rewritten text. Nothing else.

TEXT TO REWRITE:`
    }
  },
  
  // Timing constants
  TIMEOUT_MS: 30000,
  DEBOUNCE_MS: 500,
  STREAM_DELAY_MS: 5,
  
  // TTS Configuration
  TTS_CONFIG: {
    DEFAULT_LANG: 'en-US',
    DEFAULT_RATE: 1.0,
    DEFAULT_PITCH: 1.0,
    DEFAULT_VOLUME: 1.0,
    PREFERRED_VOICES: ['Google US English', 'Microsoft David', 'Alex', 'Samantha']
  },
  
  // Error Messages
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    API_ERROR: 'API error. Please try again.',
    TIMEOUT: 'Request timed out. Please try again.',
    CLIPBOARD_ERROR: 'Failed to copy to clipboard.',
    TTS_ERROR: 'Failed to generate speech. Please try again.',
    EMPTY_INPUT: 'Please enter some text to rewrite.',
    CONFIG_ERROR: 'Service temporarily unavailable. Please try again later.'
  }
};

// Generate MODELS from ALL_MODELS (derived data, not duplicated)
Config.MODELS = Config.ALL_MODELS.reduce((acc, model) => {
  if (!acc[model.provider]) acc[model.provider] = [];
  acc[model.provider].push({ id: model.id, label: model.label, description: model.description });
  return acc;
}, {});
