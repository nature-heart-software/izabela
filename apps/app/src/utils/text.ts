export function copyTextToClipboard(text: string) {
  return navigator.clipboard.writeText(text)
}
