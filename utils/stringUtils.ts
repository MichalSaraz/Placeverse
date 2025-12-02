export function shortenString(text: string, maxLength = 25): string {
  if (text.length > maxLength) {
    return text.slice(0, maxLength - 3) + '...';
  }
  return text;
}
