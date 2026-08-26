export interface PlatformDiscovery {
  platform_api: string;
  customer_oidc_issuer: string;
  customer_web_client_id: string;
  marketplace_url: string;
}

let discovery: Promise<PlatformDiscovery> | undefined;

export function discoverPlatform(): Promise<PlatformDiscovery> {
  discovery ??= fetch('/.well-known/personal-agent.json', {
    headers: { Accept: 'application/json' },
  }).then(async (response) => {
    if (!response.ok) throw new Error(`Platform discovery returned ${response.status}`);
    const document = (await response.json()) as PlatformDiscovery;
    if (
      !document.platform_api.startsWith('https://') ||
      !document.customer_oidc_issuer.startsWith('https://') ||
      !document.customer_web_client_id ||
      !document.marketplace_url.startsWith('https://')
    ) {
      throw new Error('Invalid platform discovery document');
    }
    return document;
  });
  return discovery;
}
