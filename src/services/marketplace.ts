import type { MarketplaceItem } from '@/types/marketplace';
import { discoverPlatform } from '@/services/platformDiscovery';

const catalog: MarketplaceItem[] = [
  {
    slug: 'daily-briefing',
    kind: 'agent',
    name: 'Daily Briefing',
    summary: 'Turns your calendar, inbox, and commitments into a focused start to the day.',
    description:
      'A proactive agent that assembles a concise morning brief from the sources you explicitly connect. It runs with your model, permissions, and data policy.',
    publisher: 'Personal Agent',
    icon: 'wb_twilight',
    tags: ['Productivity', 'Proactive'],
    capabilities: ['Calendar read', 'Inbox read', 'Memory read'],
    featured: true,
    verified: true,
  },
  {
    slug: 'research-companion',
    kind: 'agent',
    name: 'Research Companion',
    summary: 'Plans source-backed research and returns a structured, cited result.',
    description:
      'A delegatable research agent for questions that need source discovery, comparison, and a durable trail of findings.',
    publisher: 'Personal Agent',
    icon: 'travel_explore',
    tags: ['Research', 'Knowledge'],
    capabilities: ['Web access', 'Notes write'],
    verified: true,
  },
  {
    slug: 'meeting-notes',
    kind: 'skill',
    name: 'Meeting Notes',
    summary: 'Converts rough transcripts into decisions, owners, and follow-ups.',
    description:
      'A reusable skill that recognizes decisions and action items while preserving uncertainty instead of inventing missing context.',
    publisher: 'Personal Agent',
    icon: 'summarize',
    tags: ['Meetings', 'Writing'],
    capabilities: ['Notes write'],
    featured: true,
    verified: true,
  },
  {
    slug: 'home-assistant',
    kind: 'integration',
    name: 'Home Assistant',
    summary: 'Connect entities, scenes, services, and event streams from your smart home.',
    description:
      'Brings Home Assistant entities into the Personal Agent world-state graph and exposes controlled actions to agents and workflows.',
    publisher: 'Personal Agent',
    icon: 'home',
    tags: ['Smart home', 'Entities'],
    capabilities: ['Entity read', 'Service calls', 'Event stream'],
    featured: true,
    verified: true,
  },
  {
    slug: 'github',
    kind: 'integration',
    name: 'GitHub',
    summary: 'Work with repositories, issues, pull requests, and code review context.',
    description:
      'Connects GitHub through a scoped account and makes repository work available to approved agents and workflows.',
    publisher: 'Personal Agent',
    icon: 'code',
    tags: ['Development', 'Source control'],
    capabilities: ['Repository read', 'Issues', 'Pull requests'],
    verified: true,
  },
  {
    slug: 'inbox-triage',
    kind: 'workflow',
    name: 'Inbox Triage',
    summary: 'Classifies new messages and prepares drafts for human approval.',
    description:
      'A durable workflow that groups inbound messages, proposes a priority, and drafts replies without sending anything automatically.',
    publisher: 'Personal Agent',
    icon: 'mark_email_unread',
    tags: ['Inbox', 'Approval'],
    capabilities: ['Inbox read', 'Draft write'],
    verified: true,
  },
];

export function listMarketplaceItems(): MarketplaceItem[] {
  // This boundary can switch to the public catalog API without changing the UI.
  return catalog;
}

export function getMarketplaceItem(slug: string): MarketplaceItem | undefined {
  return catalog.find((item) => item.slug === slug);
}

interface MarketplaceResponse {
  items: MarketplaceItem[];
}

export async function fetchMarketplaceItems(): Promise<MarketplaceItem[]> {
  const platform = await discoverPlatform();
  const response = await fetch(platform.marketplace_url, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Marketplace API returned ${response.status}`);
  return ((await response.json()) as MarketplaceResponse).items;
}

export async function fetchMarketplaceItem(slug: string): Promise<MarketplaceItem | undefined> {
  const platform = await discoverPlatform();
  const response = await fetch(`${platform.marketplace_url}/${encodeURIComponent(slug)}`, {
    headers: { Accept: 'application/json' },
  });
  if (response.status === 404) return undefined;
  if (!response.ok) throw new Error(`Marketplace API returned ${response.status}`);
  return (await response.json()) as MarketplaceItem;
}

export function marketplaceInstallUrl(slug: string): string {
  return `https://my.personal-agent.org/marketplace/install/${encodeURIComponent(slug)}`;
}
