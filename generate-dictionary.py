#!/usr/bin/env python3
"""
Generate a ~50,000 word English dictionary for spell checking.
Uses frequency-based filtering to get the most useful words.
"""

import json
import urllib.request

# Download word list from dwyl/english-words
WORDS_URL = "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt"

# Common word frequency list (top 10k most used)
FREQ_URL = "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english.txt"

def download_file(url):
    """Download a file and return its content as lines."""
    print(f"Downloading: {url}")
    with urllib.request.urlopen(url) as response:
        return response.read().decode('utf-8').strip().split('\n')

def main():
    # Download word lists
    all_words = set(download_file(WORDS_URL))
    freq_words = download_file(FREQ_URL)
    
    print(f"Total words available: {len(all_words)}")
    print(f"Frequency words: {len(freq_words)}")
    
    # Start with all frequency words (most important)
    selected = set()
    for word in freq_words:
        word = word.strip().lower()
        if word.isalpha() and len(word) >= 2:
            selected.add(word)
    
    print(f"After adding frequency words: {len(selected)}")
    
    # Add more words from the full list, prioritizing by length
    # Shorter words are more commonly misspelled
    remaining = all_words - selected
    
    # Sort by length (shorter first) then alphabetically
    sorted_remaining = sorted(remaining, key=lambda w: (len(w), w))
    
    # Add words until we reach ~50,000
    target = 50000
    for word in sorted_remaining:
        if len(selected) >= target:
            break
        word = word.strip().lower()
        if word.isalpha() and 2 <= len(word) <= 15:
            selected.add(word)
    
    # Convert to sorted list
    word_list = sorted(selected)
    
    print(f"Final dictionary size: {len(word_list)}")
    
    # Save as JSON
    output_file = "dictionary.json"
    with open(output_file, 'w') as f:
        json.dump(word_list, f)
    
    # Calculate file size
    import os
    size_bytes = os.path.getsize(output_file)
    size_kb = size_bytes / 1024
    
    print(f"Saved to: {output_file}")
    print(f"File size: {size_kb:.1f} KB")
    
    # Show some stats
    print(f"\nSample words:")
    print(f"  Shortest: {word_list[:5]}")
    print(f"  Longest: {sorted(word_list, key=len, reverse=True)[:5]}")

if __name__ == "__main__":
    main()
