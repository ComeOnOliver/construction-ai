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
    console.log('🔍 Processing chunk:', JSON.stringify(chunk));
    
    // Add chunk to buffer
    this.buffer += chunk;
    console.log('📝 Buffer after adding chunk:', JSON.stringify(this.buffer));
    
    // First, remove any complete reference patterns from the buffer
    const beforeClean = this.buffer;
    this.buffer = this.buffer.replace(this.refPattern, '');
    
    if (beforeClean !== this.buffer) {
      console.log('🧹 Removed complete patterns. Buffer now:', JSON.stringify(this.buffer));
    }
    
    // Check if buffer ends with potential incomplete pattern
    // Patterns to watch for: <, <r, <re, <ref, <ref>, <ref>[, <ref>[1, <ref>[12, etc.
    const incompletePatterns = [
      /<$/,                    // just <
      /<r$/,                   // <r
      /<re$/,                  // <re  
      /<ref$/,                 // <ref
      /<ref>$/,                // <ref>
      /<ref>\[$/,              // <ref>[
      /<ref>\[\d*$/            // <ref>[digits (incomplete)
    ];
    
    let keepInBuffer = '';
    for (const pattern of incompletePatterns) {
      const match = this.buffer.match(pattern);
      if (match) {
        keepInBuffer = match[0];
        console.log('🔄 Found incomplete pattern, keeping in buffer:', JSON.stringify(keepInBuffer));
        break;
      }
    }
    
    if (keepInBuffer) {
      // Output everything except the incomplete pattern
      const output = this.buffer.slice(0, -keepInBuffer.length);
      this.buffer = keepInBuffer;
      console.log('✅ Output:', JSON.stringify(output));
      console.log('📦 Remaining in buffer:', JSON.stringify(this.buffer));
      return output;
    } else {
      // No incomplete pattern, output everything and clear buffer
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
    
    // Clean any remaining complete patterns
    const remaining = this.buffer.replace(this.refPattern, '');
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