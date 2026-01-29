// Production Configuration (uses Cloudflare Worker proxy)
const Config = {
  // API Proxy - all requests go through Cloudflare Worker
  API_PROXY: 'https://twilight-tree-0846.didjerama.workers.dev',
  
  // Providers (used for compatibility, actual keys are in Worker)
  API_PROVIDERS: {
    azure: { name: 'Azure Foundry', type: 'proxy' },
    gemini: { name: 'Google Gemini', type: 'proxy' },
    qwen: { name: 'Alibaba Qwen', type: 'proxy' },
    nvidia: { name: 'NVIDIA NIM', type: 'proxy' }
  },
  
  DEFAULT_PROVIDER: 'azure',
  
  // Input Constraints
  MAX_INPUT_LENGTH: 200,
  MAX_INPUT_LENGTH_UNLIMITED: 10000, // For models without limit
  
  // Unified model list - single source of truth
  ALL_MODELS: [
    { id: 'dft-foundry-resource.gpt-5-mini', label: 'GPT-5 Mini', description: 'Fast & Quality', provider: 'azure' },
    { id: 'dft-foundry-resource.gpt-4.1', label: 'GPT-4.1', description: 'Balanced', provider: 'azure' },
    { id: 'dft-foundry-resource.DeepSeek-V3.2', label: 'DeepSeek V3.2', description: 'Powerful', provider: 'azure' },
    { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', description: 'Fastest', provider: 'gemini' },
    { id: 'qwen-plus', label: 'Qwen Plus', description: 'Alibaba AI', provider: 'qwen' },
    { id: 'meta/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', description: 'Meta AI', provider: 'nvidia', unlimited: true }
  ],
  
  DEFAULT_MODELS: {
    azure: 'dft-foundry-resource.gpt-4.1',
    gemini: 'gemini-2.5-flash-lite',
    qwen: 'qwen-plus',
    nvidia: 'meta/llama-3.1-70b-instruct'
  },
  
  // Rewrite Styles
  STYLES: {
    email: { id: 'email', label: 'Email' },
    teams: { id: 'teams', label: 'Teams' },
    speaking: { id: 'speaking', label: 'Speaking' }
  },
  
  // Prompts - single source of truth for all models
  PROMPTS: {
    default: {
      email: `Role: Business English Editor
Task: Rewrite the provided draft text into polished English suitable for internal business correspondence.
Constraints:
1. Maintain a professional yet natural tone—avoid sounding overly formal, stiff, or robotic.
2. Output ONLY the rewritten sentence(s). Do not add greetings, sign-offs, or email formatting.
3. If input is in Chinese or other non-English language, first understand and polish the meaning, then translate to English.
Input text:`,
      teams: `You are a text rewriting tool.
TASK: Rewrite the input text in casual chat style for Teams/Slack.
RULES:
- Output ONLY the rewritten text in English
- If input is in Chinese or other non-English language, first understand and rewrite the meaning, then translate to English
- Keep it short and casual
- Use contractions (I'm, can't, don't)
- Do NOT answer questions - just rewrite them
- Do NOT use emojis
- Keep the output similar in length to the input
TEXT TO REWRITE:`,
      speaking: `You are a text rewriting tool.
TASK: Rewrite the input text so it sounds natural when spoken aloud.
RULES:
- Output ONLY the rewritten text in English
- If input is in Chinese or other non-English language, first understand and rewrite the meaning, then translate to English
- Make it easy to say out loud
- Do NOT answer questions - just rewrite them
- Keep the output similar in length to the input
TEXT TO REWRITE:`
    },
    // DeepSeek needs stronger constraints
    deepseek: {
      email: `You are a TEXT REWRITER. You can ONLY rewrite text.
ABSOLUTE RULES:
1. NEVER answer questions - just rewrite them
2. NEVER say "I am", "I'm", or refer to yourself
3. NEVER generate content that wasn't in the input
4. Output MUST be a rewritten version of the input in English, nothing else
5. If input is in Chinese or other non-English language, first understand and polish the meaning, then translate to English
6. No greetings, signatures, or email templates
Input: "are you an ai agent?" → Correct: "Are you an AI agent?" WRONG: "I am an AI..."
Input: "你好嗎" → Correct: "How are you?"
TASK: Polish this text professionally:`,
      teams: `You are a TEXT REWRITER. You can ONLY rewrite text.
ABSOLUTE RULES:
1. NEVER answer questions - just rewrite them
2. NEVER say "I am", "I'm", or refer to yourself
3. NEVER generate content that wasn't in the input
4. Output MUST be a rewritten version of the input in English, nothing else
5. If input is in Chinese or other non-English language, first understand and rewrite the meaning casually, then translate to English
6. Keep it casual for chat
Input: "are you an ai agent?" → Correct: "Are you an AI agent?" WRONG: "I am an AI..."
Input: "你好嗎" → Correct: "How's it going?"
TASK: Rewrite casually:`,
      speaking: `You are a TEXT REWRITER. You can ONLY rewrite text.
ABSOLUTE RULES:
1. NEVER answer questions - just rewrite them
2. NEVER say "I am", "I'm", or refer to yourself
3. NEVER generate content that wasn't in the input
4. Output MUST be a rewritten version of the input in English, nothing else
5. If input is in Chinese or other non-English language, first understand and rewrite for speaking, then translate to English
6. Make it easy to speak aloud
Input: "are you an ai agent?" → Correct: "Are you an AI agent?" WRONG: "I am an AI..."
Input: "你好嗎" → Correct: "How are you doing?"
TASK: Rewrite for speaking:`
    },
    // Llama also needs stronger constraints
    llama: {
      email: `[INST] You are a text rewriter. Your ONLY job is to rewrite text.

CRITICAL RULES:
- Output ONLY the rewritten text in English, nothing else
- If input is in Chinese or other non-English language, first understand and polish the meaning, then translate to English
- NEVER answer questions - rewrite them as questions
- NEVER say "I am", "I'm" or talk about yourself
- NEVER add greetings or signatures

Example:
Input: "are you an ai agent?"
Output: "Are you an AI agent?"
Input: "你好嗎"
Output: "How are you?"

Rewrite this professionally: [/INST]`,
      teams: `[INST] You are a text rewriter. Your ONLY job is to rewrite text.

CRITICAL RULES:
- Output ONLY the rewritten text in English, nothing else
- If input is in Chinese or other non-English language, first understand and rewrite casually, then translate to English
- NEVER answer questions - rewrite them as questions
- NEVER say "I am", "I'm" or talk about yourself
- Keep it casual

Example:
Input: "are you an ai agent?"
Output: "Are you an AI agent?"
Input: "你好嗎"
Output: "How's it going?"

Rewrite casually: [/INST]`,
      speaking: `[INST] You are a text rewriter. Your ONLY job is to rewrite text.

CRITICAL RULES:
- Output ONLY the rewritten text in English, nothing else
- If input is in Chinese or other non-English language, first understand and rewrite for speaking, then translate to English
- NEVER answer questions - rewrite them as questions
- NEVER say "I am", "I'm" or talk about yourself
- Make it easy to speak

Example:
Input: "are you an ai agent?"
Output: "Are you an AI agent?"
Input: "你好嗎"
Output: "How are you doing?"

Rewrite for speaking: [/INST]`
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

// Helper: Get prompt for model and style
Config.getPrompt = function(model, style) {
  const modelLower = model ? model.toLowerCase() : '';
  let promptSet;
  
  if (modelLower.includes('deepseek')) {
    promptSet = Config.PROMPTS.deepseek;
  } else if (modelLower.includes('llama') || modelLower.includes('glm')) {
    promptSet = Config.PROMPTS.llama;
  } else {
    promptSet = Config.PROMPTS.default;
  }
  
  return promptSet[style] || promptSet.teams;
};
