export type MarketplaceKind = 'agent' | 'skill' | 'integration' | 'workflow';

export interface MarketplaceItem {
  slug: string;
  kind: MarketplaceKind;
  name: string;
  summary: string;
  description: string;
  publisher: string;
  icon: string;
  tags: string[];
  capabilities: string[];
  featured?: boolean;
  verified?: boolean;
}
