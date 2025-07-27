/**
 * Clean text by removing reference patterns like <ref>[1]</ref>, <ref>[20]</ref>, etc.
 */
export function cleanText(text: string): string {
  // Remove <ref>[number]</ref> patterns
  return text.replace(/<ref>\[\d+\]<\/ref>/g, '');
}

/**
 * Stream text cleaner that handles partial patterns across chunks
 */
export class StreamTextCleaner {
  private buffer: string = '';
  private readonly refPattern = /<ref>\[\d+\]<\/ref>/g;
  
  /**
   * Process a chunk of text, handling partial reference patterns
   */
  processChunk(chunk: string): string {
    // Add chunk to buffer
    this.buffer += chunk;
    
    // Find all complete reference patterns
    const matches = [...this.buffer.matchAll(this.refPattern)];
    
    if (matches.length === 0) {
      // No complete patterns found
      // Check if buffer ends with potential start of pattern
      const potentialStart = this.buffer.match(/<ref>(\[(\d*))?$/);
      if (potentialStart) {
        // Keep potential pattern start in buffer
        const keepLength = potentialStart[0].length;
        const output = this.buffer.slice(0, -keepLength);
        this.buffer = this.buffer.slice(-keepLength);
        return output;
      } else {
        // No potential pattern, output everything
        const output = this.buffer;
        this.buffer = '';
        return output;
      }
    }
    
    // Remove all complete patterns and output clean text
    let cleanBuffer = this.buffer.replace(this.refPattern, '');
    
    // Check if buffer ends with potential incomplete pattern
    const potentialStart = cleanBuffer.match(/<ref>(\[(\d*))?$/);
    if (potentialStart) {
      const keepLength = potentialStart[0].length;
      const output = cleanBuffer.slice(0, -keepLength);
      this.buffer = this.buffer.slice(-keepLength);
      return output;
    } else {
      this.buffer = '';
      return cleanBuffer;
    }
  }
  
  /**
   * Get any remaining text in buffer (call at end of stream)
   */
  flush(): string {
    const remaining = this.buffer.replace(this.refPattern, '');
    this.buffer = '';
    return remaining;
  }
  
  /**
   * Reset the cleaner state
   */
  reset(): void {
    this.buffer = '';
  }
}