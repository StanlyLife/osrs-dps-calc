import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/state';
import { classNames } from '@/utils';
import LeagueRegionBadge from '@/app/components/player/LeagueRegionBadge';
import { LEAGUE_REGIONS } from '@/app/components/player/leagueRegions';

const LoadoutRegionSelector: React.FC = observer(() => {
  const store = useStore();
  const selectedRegions = store.player.leagues.six.regions;
  const maxRegionsSelected = selectedRegions.length >= 3;

  return (
    <div className="mt-2 w-[200px] max-w-full">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-300">Regions</span>
      <div className="mt-1 grid grid-cols-5 gap-x-2 gap-y-1.5">
        {LEAGUE_REGIONS.map((region) => (
          <button
            type="button"
            key={region.id}
            className={classNames(
              'flex h-11 items-center justify-center rounded-md border px-1 transition-all',
              selectedRegions.includes(region.id)
                ? 'border-orange-300 bg-orange-100 shadow-[0_0_0_1px_rgba(251,146,60,0.35)] dark:border-orange-500 dark:bg-orange-900/40'
                : 'border-body-300 bg-body-100 hover:bg-btns-300 dark:border-dark-200 dark:bg-dark-400 dark:hover:bg-dark-500',
              maxRegionsSelected && !selectedRegions.includes(region.id) ? 'opacity-60' : '',
            )}
            onClick={() => store.toggleLeagues6Region(region.id)}
            data-tooltip-id="tooltip"
            data-tooltip-content={region.name}
            aria-label={`${selectedRegions.includes(region.id) ? 'Remove' : 'Set'} loadout region ${region.name}`}
          >
            <LeagueRegionBadge region={region.id} className="h-8 max-w-[22px]" />
          </button>
        ))}
      </div>
    </div>
  );
});

export default LoadoutRegionSelector;
