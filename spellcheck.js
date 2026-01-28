// ============================================================================
// Spell Check Service - Local Dictionary Based
// ============================================================================

class SpellCheckService {
  constructor() {
    this.dictionary = new Set();
    this.wordList = [];
    this.loaded = false;
    this.loading = false;
  }

  async loadDictionary() {
    if (this.loaded || this.loading) return;
    this.loading = true;

    try {
      const response = await fetch('dictionary.json');
      const words = await response.json();
      this.wordList = words;
      this.dictionary = new Set(words.map(w => w.toLowerCase()));
      this.loaded = true;
      console.log(`Dictionary loaded: ${this.dictionary.size} words`);
    } catch (error) {
      console.error('Failed to load dictionary:', error);
    } finally {
      this.loading = false;
    }
  }

  isCorrect(word) {
    if (!this.loaded) return true;
    const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
    if (cleaned.length < 2) return true;
    return this.dictionary.has(cleaned);
  }

  // Levenshtein distance algorithm
  levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  // Get suggestions for a misspelled word
  suggest(word, maxSuggestions = 5) {
    if (!this.loaded) return [];
    
    const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
    if (cleaned.length < 2) return [];
    if (this.dictionary.has(cleaned)) return [];

    const maxDistance = Math.min(2, Math.ceil(cleaned.length / 3) + 1);
    const suggestions = [];

    // Check all words - no early exit for better results
    for (const dictWord of this.wordList) {
      // Only check words with similar length
      const lenDiff = Math.abs(dictWord.length - cleaned.length);
      if (lenDiff > maxDistance) continue;
      
      const distance = this.levenshtein(cleaned, dictWord.toLowerCase());
      if (distance <= maxDistance && distance > 0) {
        suggestions.push({ word: dictWord, distance, lenDiff });
      }
    }

    // Sort by distance first, then by length difference
    return suggestions
      .sort((a, b) => {
        if (a.distance !== b.distance) return a.distance - b.distance;
        return a.lenDiff - b.lenDiff;
      })
      .slice(0, maxSuggestions)
      .map(s => s.word);
  }

  // Check all words in text and return errors with positions
  checkText(text) {
    if (!this.loaded) return [];
    
    const errors = [];
    const wordRegex = /\b[a-zA-Z]+\b/g;
    let match;

    while ((match = wordRegex.exec(text)) !== null) {
      const word = match[0];
      if (!this.isCorrect(word)) {
        errors.push({
          word: word,
          start: match.index,
          end: match.index + word.length,
          suggestions: this.suggest(word)
        });
      }
    }

    return errors;
  }
}

// Global instance
const spellChecker = new SpellCheckService();
