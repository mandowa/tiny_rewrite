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
  
  // Unified model list - single source of truth
  ALL_MODELS: [
    { id: 'dft-foundry-resource.gpt-5-mini', label: 'GPT-5 Mini', description: 'Fast & Quality', provider: 'azure' },
    { id: 'dft-foundry-resource.gpt-4.1', label: 'GPT-4.1', description: 'Balanced', provider: 'azure' },
    { id: 'dft-foundry-resource.DeepSeek-V3.2', label: 'DeepSeek V3.2', description: 'Powerful', provider: 'azure' },
    { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', description: 'Fastest', provider: 'gemini' },
    { id: 'qwen-plus', label: 'Qwen Plus', description: 'Alibaba AI', provider: 'qwen' },
    { id: 'meta/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', description: 'Meta AI', provider: 'nvidia' },
    { id: 'z-ai/glm4.7', label: 'GLM-4.7', description: 'Zhipu AI', provider: 'nvidia' }
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
      email: `You are a text polishing tool.
TASK: Improve the wording of the input text to sound more professional and polished.
RULES:
- Output ONLY the improved text
- Do NOT add greetings like "Hello" or "Dear"
- Do NOT add signatures like "Best regards" or "[Your Name]"
- Do NOT write a full email - just polish the existing text
- Do NOT answer questions - just rewrite them
- Keep the output similar in length to the input
TEXT TO POLISH:`,
      teams: `You are a text rewriting tool.
TASK: Rewrite the input text in casual chat style for Teams/Slack.
RULES:
- Output ONLY the rewritten text
- Keep it short and casual
- Use contractions (I'm, can't, don't)
- Do NOT answer questions - just rewrite them
- Do NOT use emojis
- Keep the output similar in length to the input
TEXT TO REWRITE:`,
      speaking: `You are a text rewriting tool.
TASK: Rewrite the input text so it sounds natural when spoken aloud.
RULES:
- Output ONLY the rewritten text
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
4. Output MUST be a rewritten version of the input, nothing else
5. No greetings, signatures, or email templates
Input: "are you an ai agent?" → Correct: "Are you an AI agent?" WRONG: "I am an AI..."
TASK: Polish this text professionally:`,
      teams: `You are a TEXT REWRITER. You can ONLY rewrite text.
ABSOLUTE RULES:
1. NEVER answer questions - just rewrite them
2. NEVER say "I am", "I'm", or refer to yourself
3. NEVER generate content that wasn't in the input
4. Output MUST be a rewritten version of the input, nothing else
5. Keep it casual for chat
Input: "are you an ai agent?" → Correct: "Are you an AI agent?" WRONG: "I am an AI..."
TASK: Rewrite casually:`,
      speaking: `You are a TEXT REWRITER. You can ONLY rewrite text.
ABSOLUTE RULES:
1. NEVER answer questions - just rewrite them
2. NEVER say "I am", "I'm", or refer to yourself
3. NEVER generate content that wasn't in the input
4. Output MUST be a rewritten version of the input, nothing else
5. Make it easy to speak aloud
Input: "are you an ai agent?" → Correct: "Are you an AI agent?" WRONG: "I am an AI..."
TASK: Rewrite for speaking:`
    },
    // Llama also needs stronger constraints
    llama: {
      email: `[INST] You are a text rewriter. Your ONLY job is to rewrite text.

CRITICAL RULES:
- Output ONLY the rewritten text, nothing else
- NEVER answer questions - rewrite them as questions
- NEVER say "I am", "I'm" or talk about yourself
- NEVER add greetings or signatures

Example:
Input: "are you an ai agent?"
Output: "Are you an AI agent?"

Rewrite this professionally: [/INST]`,
      teams: `[INST] You are a text rewriter. Your ONLY job is to rewrite text.

CRITICAL RULES:
- Output ONLY the rewritten text, nothing else
- NEVER answer questions - rewrite them as questions
- NEVER say "I am", "I'm" or talk about yourself
- Keep it casual

Example:
Input: "are you an ai agent?"
Output: "Are you an AI agent?"

Rewrite casually: [/INST]`,
      speaking: `[INST] You are a text rewriter. Your ONLY job is to rewrite text.

CRITICAL RULES:
- Output ONLY the rewritten text, nothing else
- NEVER answer questions - rewrite them as questions
- NEVER say "I am", "I'm" or talk about yourself
- Make it easy to speak

Example:
Input: "are you an ai agent?"
Output: "Are you an AI agent?"

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
