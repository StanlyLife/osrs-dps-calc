import React from 'react';
import { PartialDeep } from 'type-fest';
import { Player } from '@/types/Player';
import { classNames, getCdnImage } from '@/utils';
import LeagueRegionBadge from '@/app/components/player/LeagueRegionBadge';

interface LoadoutTabLabelProps {
  loadout: PartialDeep<Player>;
  fallbackLabel: string;
  imageClassName?: string;
  showLabel?: boolean;
  labelClassName?: string;
  regionBadgePlacement?: 'notch' | 'left' | 'none';
}

const LoadoutTabLabel: React.FC<LoadoutTabLabelProps> = ({
  loadout,
  fallbackLabel,
  imageClassName,
  showLabel,
  labelClassName,
  regionBadgePlacement = 'notch',
}) => {
  const weapon = loadout.equipment?.weapon;
  const regions = regionBadgePlacement === 'none' ? [] : (loadout.leagues?.six?.regions || []);
  const label = loadout.name || fallbackLabel;
  let icon: React.ReactNode;

  const regionBadges = regions.length > 0 ? (
    <span
      className={classNames(
        'pointer-events-none z-0 inline-flex items-end justify-center gap-0.5',
        regionBadgePlacement === 'left'
          ? 'flex-col'
          : 'absolute bottom-[-10px] left-1/2 -translate-x-1/2',
      )}
    >
      {regions.map((region) => (
        <LeagueRegionBadge
          key={region}
          region={region}
          compact
        />
      ))}
    </span>
  ) : null;

  if (weapon?.image) {
    icon = (
      <span className="relative inline-flex h-8 w-8 items-center justify-center">
        <img
          draggable={false}
          src={getCdnImage(`equipment/${weapon.image}`)}
          alt={weapon.name || label}
          className={classNames('absolute left-1/2 top-1/2 z-10 mx-auto h-7 w-7 -translate-x-1/2 -translate-y-1/2 object-contain', imageClassName || '')}
        />
        {regionBadgePlacement === 'notch' ? regionBadges : null}
      </span>
    );
  } else if (regionBadges && regionBadgePlacement !== 'left') {
    icon = regionBadges;
  } else {
    icon = <span>{fallbackLabel}</span>;
  }

  if (regionBadgePlacement === 'left') {
    return (
      <span className="pointer-events-none grid w-full grid-cols-[14px_1fr_14px] items-center select-none">
        <span className="flex min-h-[36px] items-center justify-center">{regionBadges}</span>
        <span className={classNames('flex items-center justify-center', showLabel ? 'flex-col gap-1' : '', !weapon?.image ? 'min-h-7' : '')}>
          {icon}
          {showLabel && (
            <span className={classNames('block max-w-full truncate text-center', labelClassName || '')}>{label}</span>
          )}
        </span>
        <span aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className={classNames('pointer-events-none flex items-center justify-center select-none', showLabel ? 'flex-col gap-1' : '', !weapon?.image ? 'min-h-7' : '')}>
      {icon}
      {showLabel && (
        <span className={classNames('block max-w-full truncate text-center', labelClassName || '')}>{label}</span>
      )}
    </span>
  );
};

export default LoadoutTabLabel;
