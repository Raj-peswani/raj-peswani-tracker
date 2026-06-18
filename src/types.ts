export type MarketQuote = {
  symbol: string;
  label: string;
  value: number;
  change: number;
  currency?: string;
};

export type Story = {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
};

export type StoryGroup = {
  label: string;
  stories: Story[];
};

export type NewsSection = {
  id: string;
  title: string;
  eyebrow: string;
  groups: StoryGroup[];
};

export type DashboardData = {
  generatedAt: string;
  markets: MarketQuote[];
  realEstateMarkets: MarketQuote[];
  newsSections: NewsSection[];
  realEstateGroups: StoryGroup[];
};
