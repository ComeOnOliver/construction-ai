/**
 * Clean text by removing reference patterns like <ref>...</ref> or malformed <ref>...</>
 */
export function cleanText(text: string): string {
  // Remove well-formed <ref>...</ref> and malformed <ref>...</>
  return text.replace(/<ref>[\s\S]*?<\/ref>/g, '') // properly closed
             .replace(/<ref>[\s\S]*?>/g, '');       // malformed but closed with just '>'
}

/**
 * Stream text cleaner that handles partial patterns across chunks
 */
export class StreamTextCleaner {
  private buffer: string = '';

  /**
   * Process a chunk of text, handling partial reference patterns
   */
  processChunk(chunk: string): string {
    console.log('🔍 Processing chunk:', JSON.stringify(chunk));
    this.buffer += chunk;
    console.log('📝 Buffer after adding chunk:', JSON.stringify(this.buffer));

    // Remove all <ref>...</ref> and <ref>...</> (malformed)
    const fullPattern = /<ref>[\s\S]*?<\/ref>/g;
    const partialPattern = /<ref>[\s\S]*?>/g;
    const before = this.buffer;
    this.buffer = this.buffer.replace(fullPattern, '').replace(partialPattern, '');

    if (before !== this.buffer) {
      console.log('🧹 Cleaned full/malformed patterns. Buffer now:', JSON.stringify(this.buffer));
    }

    // Detect and preserve truly incomplete tags like `<ref>[1][2][3]`
    const incompleteMatch = this.buffer.match(/<ref>[\s\S]*$/);
    if (incompleteMatch) {
      const keepInBuffer = incompleteMatch[0];
      const output = this.buffer.slice(0, -keepInBuffer.length);
      this.buffer = keepInBuffer;
      console.log('🔄 Incomplete pattern found. Keeping in buffer:', JSON.stringify(keepInBuffer));
      console.log('✅ Output:', JSON.stringify(output));
      return output;
    } else {
      const output = this.buffer;
      this.buffer = '';
      console.log('✅ Output (complete):', JSON.stringify(output));
      return output;
    }
  }

  /**
   * Flush any remaining content in the buffer
   */
  flush(): string {
    console.log('🏁 Flushing buffer:', JSON.stringify(this.buffer));
    const cleaned = this.buffer
      .replace(/<ref>[\s\S]*?<\/ref>/g, '')
      .replace(/<ref>[\s\S]*?>/g, '');
    this.buffer = '';
    console.log('🏁 Final flush output:', JSON.stringify(cleaned));
    return cleaned;
  }

  /**
   * Reset the cleaner state
   */
  reset(): void {
    console.log('🔄 Resetting buffer');
    this.buffer = '';
  }
}
