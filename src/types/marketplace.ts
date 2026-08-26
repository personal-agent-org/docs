export type MarketplaceKind = 'agent' | 'skill' | 'integration' | 'workflow';
export type QualityTier = 'bronze' | 'silver' | 'gold' | 'platinum';

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
  source_url?: string;
  documentation_url?: string;
  package_ref?: string;
  quality_tier?: QualityTier | null;
  quality_rules?: Record<string, boolean>;
  featured?: boolean;
  verified?: boolean;
  security_status?: 'clean';
  artifact_sha256?: string;
}
