const legacyRegionalHosts = new Set(
  [
    'arn1',
    'bom1',
    'cdg1',
    'cle1',
    'cpt1',
    'dub1',
    'fra1',
    'gru1',
    'hkg1',
    'hnd1',
    'iad1',
    'icn1',
    'kix1',
    'lhr1',
    'pdx1',
    'sfo1',
    'sin1',
    'syd1',
  ].map((region) => `izabela-server-${region}.vercel.app`),
)

/** Migrates known regional origins without rewriting custom API endpoints. */
export function migrateUniversalApiEndpoint(endpoint: string): string {
  try {
    const url = new URL(endpoint)
    if (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      !url.username &&
      !url.password &&
      !url.port &&
      legacyRegionalHosts.has(url.hostname)
    ) {
      return 'https://api.izabela.app'
    }
  } catch {
    // Leave incomplete or invalid custom endpoints unchanged.
  }
  return endpoint
}
