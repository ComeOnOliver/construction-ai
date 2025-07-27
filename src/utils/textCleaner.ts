/**
 * Clean text by removing reference patterns like <ref>[1]</ref>, <ref>[20]</ref>, etc.
 */
export function cleanText(text: string): string {
  // Remove <ref>[number]</ref> patterns and complex patterns like <ref>[1][2][7]</ref>
  return text.replace(/<ref>\[[\d\]\[]*\d*\]<\/ref>/g, '');
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
    
    // Look for complete reference patterns and remove them
    // This regex handles both simple <ref>[1]</ref> and complex <ref>[1][2][7]</ref> patterns
    const refPattern = /<ref>\[[\d\]\[]*\d*\]<\/ref>/g;
    const beforeClean = this.buffer;
    this.buffer = this.buffer.replace(refPattern, '');
    
    if (beforeClean !== this.buffer) {
      console.log('🧹 Removed complete patterns. Buffer now:', JSON.stringify(this.buffer));
    }
    
    // Check if buffer ends with potential incomplete pattern
    // We need to be more aggressive about detecting incomplete patterns
    const incompletePatterns = [
      /<$/,                           // just <
      /<r$/,                          // <r
      /<re$/,                         // <re  
      /<ref$/,                        // <ref
      /<ref>$/,                       // <ref>
      /<ref>\[$/,                     // <ref>[
      /<ref>\[[\d\]\[]*$/,            // <ref>[digits and brackets (incomplete)
      /<ref>\[[\d\]\[]*\d*$/,         // <ref>[complex pattern (incomplete)
      /<ref>\[[\d\]\[]*\d*\]$/,       // <ref>[pattern] but no closing tag
      /<ref>\[[\d\]\[]*\d*\]<$/,      // <ref>[pattern]< (incomplete closing)
      /<ref>\[[\d\]\[]*\d*\]<\/$/,    // <ref>[pattern]</ (incomplete closing)
      /<ref>\[[\d\]\[]*\d*\]<\/r$/,   // <ref>[pattern]</r (incomplete closing)
      /<ref>\[[\d\]\[]*\d*\]<\/re$/,  // <ref>[pattern]</re (incomplete closing)
      /<ref>\[[\d\]\[]*\d*\]<\/ref$/  // <ref>[pattern]</ref (incomplete closing)
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
    const refPattern = /<ref>\[[\d\]\[]*\d*\]<\/ref>/g;
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