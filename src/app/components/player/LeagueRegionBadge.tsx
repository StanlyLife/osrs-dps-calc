import React from 'react';
import { LeagueRegion } from '@/types/Player';
import { classNames } from '@/utils';
import { LEAGUE_REGIONS_BY_ID } from '@/app/components/player/leagueRegions';

interface LeagueRegionBadgeProps {
  region: LeagueRegion;
  className?: string;
  compact?: boolean;
}

const LeagueRegionBadge: React.FC<LeagueRegionBadgeProps> = ({ region, className, compact }) => {
  const meta = LEAGUE_REGIONS_BY_ID[region];

  return (
    <img
      draggable={false}
      src={meta.badgeImageUrl}
      alt={meta.name}
      className={classNames(
        'inline-block h-8 w-auto max-w-[22px] shrink-0 object-contain',
        compact ? 'h-5 max-w-[14px]' : '',
        className || '',
      )}
    />
  );
};

export default LeagueRegionBadge;
