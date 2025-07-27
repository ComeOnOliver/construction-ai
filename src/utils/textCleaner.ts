/**
 * Clean a full string by removing all <ref>...</ref> and malformed <ref>...>
 */
export function cleanText(text: string): string {
  return text
    .replace(/<ref>[\s\S]*?<\/ref>/g, '') // 完整 <ref>...</ref>
    .replace(/<ref>[\s\S]*?>/g, '');      // 不完整 <ref>...>
}

/**
 * Stream text cleaner that removes <ref>...</ref> references even if split across chunks
 */
export class StreamTextCleaner {
  private buffer: string = '';

  /**
   * Process one stream chunk
   */
  processChunk(chunk: string): string {
    this.buffer += chunk;

    // Step 1: Remove all complete <ref>...</ref> patterns
    let cleaned = '';
    const refPattern = /<ref>[\s\S]*?<\/ref>/g;
    this.buffer = this.buffer.replace(refPattern, '');

    // Step 2: Remove malformed but complete <ref>...</> or <ref>...>
    const malformedPattern = /<ref>[\s\S]*?>/g;
    this.buffer = this.buffer.replace(malformedPattern, '');

    // Step 3: Check for incomplete patterns left in buffer
    const incompleteMatch = this.buffer.match(/<ref>[\s\S]*$/);
    if (incompleteMatch) {
      const keepInBuffer = incompleteMatch[0];
      cleaned = this.buffer.slice(0, -keepInBuffer.length);
      this.buffer = keepInBuffer;
    } else {
      cleaned = this.buffer;
      this.buffer = '';
    }

    return cleaned;
  }

  /**
   * Flush remaining buffer at the end of stream
   */
  flush(): string {
    const result = this.buffer
      .replace(/<ref>[\s\S]*?<\/ref>/g, '')
      .replace(/<ref>[\s\S]*?>/g, '');
    this.buffer = '';
    return result;
  }

  /**
   * Reset buffer manually
   */
  reset(): void {
    this.buffer = '';
  }
}
