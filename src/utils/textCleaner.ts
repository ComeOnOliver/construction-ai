/**
 * Clean text by removing reference patterns like <ref>...</ref>
 */
export function cleanText(text: string): string {
  // Remove any content inside <ref>...</ref>
  return text.replace(/<ref>[\s\S]*?<\/ref>/g, '');
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

    // Add chunk to buffer
    this.buffer += chunk;
    console.log('📝 Buffer after adding chunk:', JSON.stringify(this.buffer));

    // Remove complete <ref>...</ref> patterns (non-greedy match)
    const refPattern = /<ref>[\s\S]*?<\/ref>/g;
    const beforeClean = this.buffer;
    this.buffer = this.buffer.replace(refPattern, '');

    if (beforeClean !== this.buffer) {
      console.log('🧹 Removed complete patterns. Buffer now:', JSON.stringify(this.buffer));
    }

    // Check for potential incomplete <ref>...</ref> patterns at the end of the buffer
    const incompletePattern = /<ref>[\s\S]*$/;
    const match = this.buffer.match(incompletePattern);

    if (match) {
      const keepInBuffer = match[0];
      const output = this.buffer.slice(0, -keepInBuffer.length);
      this.buffer = keepInBuffer;
      console.log('🔄 Found incomplete pattern, keeping in buffer:', JSON.stringify(keepInBuffer));
      console.log('✅ Output:', JSON.stringify(output));
      console.log('📦 Remaining in buffer:', JSON.stringify(this.buffer));
      return output;
    } else {
      const output = this.buffer;
      this.buffer = '';
      console.log('✅ Output (complete):', JSON.stringify(output));
      console.log('📦 Buffer cleared');
      return output;
    }
  }

  /**
   * Get any remaining text in buffer (call at end of stream)
   */
  flush(): string {
    console.log('🏁 Flushing remaining buffer:', JSON.stringify(this.buffer));
    const refPattern = /<ref>[\s\S]*?<\/ref>/g;
    const remaining = this.buffer.replace(refPattern, '');
    this.buffer = '';
    console.log('🏁 Final flush output:', JSON.stringify(remaining));
    return remaining;
  }

  /**
   * Reset the cleaner state
   */
  reset(): void {
    console.log('🔄 Resetting text cleaner');
    this.buffer = '';
  }
}
