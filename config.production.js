// Production Configuration (uses Cloudflare Worker proxy)
const Config = {
  // API Proxy - all requests go through Cloudflare Worker
  API_PROXY: 'https://twilight-tree-0846.didjerama.workers.dev',
  
  // Dummy providers for compatibility (not used in proxy mode)
  API_PROVIDERS: {
    azure: { name: 'Azure Foundry', type: 'proxy' },
    gemini: { name: 'Google Gemini', type: 'proxy' }
  },
  
  DEFAULT_PROVIDER: 'azure',
  
  // Input Constraints
  MAX_INPUT_LENGTH: 200,
  
  // Available Models by Provider
  MODELS: {
    azure: [
      { id: 'dft-foundry-resource.gpt-5-mini', label: 'GPT-5 Mini', description: 'Fast & Quality' },
      { id: 'dft-foundry-resource.gpt-4.1', label: 'GPT-4.1', description: 'Balanced' },
      { id: 'dft-foundry-resource.DeepSeek-V3.2', label: 'DeepSeek V3.2', description: 'Powerful' }
    ],
    gemini: [
      { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', description: 'Fastest & Free' }
    ]
  },
  
  DEFAULT_MODELS: {
    azure: 'dft-foundry-resource.gpt-4.1',
    gemini: 'gemini-2.5-flash-lite'
  },
  
  DEFAULT_PROVIDER: 'azure',
  
  // Rewrite Styles
  STYLES: {
    email: {
      id: 'email',
      label: 'Email',
      systemPrompt: `### Role
You are an expert Native English Business Editor. You excel at refining rough or awkward English drafts into polished, natural-sounding, and impactful workplace communication.

### Task
Rewrite the provided [English Draft] to improve its clarity, flow, and tone. Do not change the original meaning, but elevate the phrasing to sound native and professional.

### Tone & Style Guidelines
- **Conversational but Professional**: Strike the balance between being respectful and sounding human. Avoid overly stiff, archaic, or robotic language.
- **Friendly & Approachable**: Use a warm, cooperative tone.
- **Clear & Direct**: Be concise. Remove unnecessary fluff or redundancy.

### Constraints
1. **Output Format**: Output **ONLY** the rewritten text.
2. **No Commentary**: Do NOT include "Here is the rewritten text," explanations, or notes.
3. **Language**: English to English refinement only.

### Input Data
[English Draft]:`
    },
    teams: {
      id: 'teams',
      label: 'Teams',
      systemPrompt: `### Role
You are an expert in concise workplace messaging. You specialize in rewriting text into natural, quick, and friendly messages for Teams or Slack, relying solely on words to convey tone.

### Task
Rewrite the provided [Draft Text] into a natural chat message.

### Style Guidelines
- **Casual & Relaxed**: Use contractions freely (e.g., "I'm", "can't", "don't").
- **Concise**: Keep it short and punchy. Avoid formal email phrasing.
- **Friendly but Clean**: Maintain a warm tone through word choice alone.
- **Strictly Text-Only**: Do not use any emojis or special graphical characters.

### Constraints
1. **Output Format**: Output **ONLY** the rewritten text.
2. **No Commentary**: Do NOT include explanations, context, or notes.
3. **No Emojis**: ABSOLUTELY NO emojis (e.g., 🚫, 😊, 👍).

### Input Data
[Draft Text]:`
    },
    speaking: {
      id: 'speaking',
      label: 'Speaking',
      systemPrompt: `### Role
You are an expert Speech Coach and Communication Specialist. You excel at converting written scripts into natural, confident spoken language that sounds authentic when said aloud.

### Task
Rewrite the provided [Draft Text] for verbal delivery in a workplace setting. Focus on how the words sound when spoken.

### Style Guidelines
- **Orality (Spoken Style)**: Use vocabulary suited for talking, not reading. (e.g., use "use" instead of "utilize", "about" instead of "regarding").
- **Rhythm & Flow**: Break up long, complex sentences. Ensure natural pause points for breathing.
- **Easy to Pronounce**: Avoid tongue-twisters or overly dense clusters of consonants.
- **Confident & Natural**: Project professional confidence without sounding like you are reading from a script.

### Constraints
1. **Output Format**: Output **ONLY** the rewritten text.
2. **No Commentary**: Do NOT include stage directions (like *pause here*) or explanations.
3. **No Slang**: Keep it professional, not street slang.

### Input Data
[Draft Text]:`
    }
  },
  
  // API Parameters
  TIMEOUT_MS: 30000,
  
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
