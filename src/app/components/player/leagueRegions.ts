import { LeagueRegion } from '@/types/Player';

export interface LeagueRegionMeta {
  id: LeagueRegion;
  name: string;
  badgeImageUrl: string;
}

export const LEAGUE_REGIONS: LeagueRegionMeta[] = [
  {
    id: 'varlamore',
    name: 'Varlamore',
    badgeImageUrl: 'https://oldschool.runescape.wiki/images/Varlamore_Area_Badge.png',
  },
  {
    id: 'karamja',
    name: 'Karamja',
    badgeImageUrl: 'https://oldschool.runescape.wiki/images/Karamja_Area_Badge.png',
  },
  {
    id: 'asgarnia',
    name: 'Asgarnia',
    badgeImageUrl: 'https://oldschool.runescape.wiki/images/Asgarnia_Area_Badge.png?4ec29',
  },
  {
    id: 'fremennik',
    name: 'Fremennik',
    badgeImageUrl: 'https://oldschool.runescape.wiki/images/Fremennik_Area_Badge.png?f8338',
  },
  {
    id: 'kandarin',
    name: 'Kandarin',
    badgeImageUrl: 'https://oldschool.runescape.wiki/images/Kandarin_Area_Badge.png?f8338',
  },
  {
    id: 'desert',
    name: 'Desert',
    badgeImageUrl: 'https://oldschool.runescape.wiki/images/Desert_Area_Badge.png?2a1e3',
  },
  {
    id: 'morytania',
    name: 'Morytania',
    badgeImageUrl: 'https://oldschool.runescape.wiki/images/Morytania_Area_Badge.png?2a1e3',
  },
  {
    id: 'tirannwn',
    name: 'Tirannwn',
    badgeImageUrl: 'https://oldschool.runescape.wiki/images/Tirannwn_Area_Badge.png?4b9ee',
  },
  {
    id: 'wilderness',
    name: 'Wilderness',
    badgeImageUrl: 'https://oldschool.runescape.wiki/images/Wilderness_Area_Badge.png?2a1e3',
  },
  {
    id: 'kourend',
    name: 'Kourend',
    badgeImageUrl: 'https://oldschool.runescape.wiki/images/Kourend_Area_Badge.png?1f79a',
  },
];

export const LEAGUE_REGIONS_BY_ID = LEAGUE_REGIONS.reduce<Record<LeagueRegion, LeagueRegionMeta>>((acc, region) => {
  acc[region.id] = region;
  return acc;
}, {} as Record<LeagueRegion, LeagueRegionMeta>);
