export function copyTextToClipboard(text: string) {
  return navigator.clipboard.writeText(text)
}

export function capitalize(str: string): string {
  return str.split(' ')
    .map(word => capitalizeWord(word))
    .join(' ');

  function capitalizeWord(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }
}
