/**
 * Clean text by removing reference patterns like <ref>[1]</ref>, <ref>[20]</ref>, etc.
 */
export function cleanText(text: string): string {
  // Remove <ref>[number]</ref> patterns
  return text.replace(/<ref>\[\d+\]<\/ref>/g, '');
}