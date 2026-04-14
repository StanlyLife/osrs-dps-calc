import React, { PropsWithChildren, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/state';
import { PlayerVsNPCCalculatedLoadout, UserIssue } from '@/types/State';
import Spinner from '@/app/components/Spinner';
import { ACCURACY_PRECISION, DPS_PRECISION, EXPECTED_HIT_PRECISION } from '@/lib/constants';
import { max, min, some } from 'd3-array';
import { isDefined } from '@/utils';
import UserIssueType from '@/enums/UserIssueType';
import LoadoutTabLabel from '../LoadoutTabLabel';

interface IResultRowProps {
  calcKey: keyof PlayerVsNPCCalculatedLoadout;
  hasResults: boolean;
  calcLoadouts: PlayerVsNPCCalculatedLoadout[];
  userIssues: UserIssue[];
  winnerIndices: Set<number>;
  title?: string;
}

interface PlayerVsNPCResultsTableProps {
  calcLoadouts: PlayerVsNPCCalculatedLoadout[];
}

const calcKeyToString = (value: number, calcKey: keyof PlayerVsNPCCalculatedLoadout): string | React.ReactNode => {
  if (value === undefined || value === null) {
    return (<p className="text-sm">---</p>);
  }

  switch (calcKey) {
    case 'accuracy':
    case 'specAccuracy':
      return `${(value * 100).toFixed(ACCURACY_PRECISION)}%`;
    case 'dps':
    case 'specMomentDps':
      return value.toFixed(DPS_PRECISION);
    case 'ttk':
      return `${value.toFixed(DPS_PRECISION)}s`;
    case 'specFullDps':
      return value.toPrecision(DPS_PRECISION);
    case 'expectedHit':
    case 'specExpected':
      return value.toFixed(EXPECTED_HIT_PRECISION);
    default:
      return `${value}`;
  }
};

const ResultRow: React.FC<PropsWithChildren<IResultRowProps>> = observer((props) => {
  const store = useStore();
  const {
    children,
    calcKey,
    calcLoadouts,
    title,
    hasResults,
    userIssues,
    winnerIndices,
  } = props;

  const cells = useMemo(() => {
    const aggregator = calcKey === 'npcDefRoll' || calcKey === 'ttk' ? min : max;
    const bestValue = aggregator(calcLoadouts.filter((loadout) => isDefined(loadout?.[calcKey])), (loadout) => loadout[calcKey] as number);

    return store.loadouts.map((_, i) => {
      const loadout = calcLoadouts[i];
      const value = loadout?.[calcKey] as number;
      if (hasResults && calcKey.startsWith('spec') && (value === undefined || value === null)) {
        return (
          // eslint-disable-next-line react/no-array-index-key
          <th key={i} className="w-28 border-r bg-dark-400 text-dark-200 text-center text-xs">
            {userIssues.find((is) => is.loadout === `${i + 1}` && is.type === UserIssueType.EQUIPMENT_SPEC_UNSUPPORTED) ? 'Not implemented' : 'N/A'}
          </th>
        );
      }

      const isWinner = winnerIndices.size > 0 && winnerIndices.has(i);
      const isBest = (store.loadouts.length > 1) && bestValue === value;

      return (
        // eslint-disable-next-line react/no-array-index-key
        <th className={`text-center w-28 border-r ${isWinner ? 'bg-green-300/10 dark:bg-green-300/10' : ''} ${isBest ? 'dark:text-green-200 text-green-800' : 'dark:text-body-200 text-black'}`} key={i}>
          {hasResults ? calcKeyToString(value, calcKey) : (<Spinner className="w-3" />)}
        </th>
      );
    });
  }, [calcLoadouts, calcKey, hasResults, store.loadouts, userIssues, winnerIndices]);

  return (
    <tr>
      <th className="w-40 px-4 border-r bg-btns-400 dark:bg-dark-500 select-none cursor-help underline decoration-dotted decoration-gray-300" title={title}>{children}</th>
      {cells}
    </tr>
  );
});

const PlayerVsNPCResultsTable: React.FC<PlayerVsNPCResultsTableProps> = observer((props) => {
  const store = useStore();
  const { selectedLoadout } = store;
  const { calcLoadouts } = props;

  const hasResults = useMemo(() => some(calcLoadouts, (loadout) => some(Object.entries(loadout), ([, value]) => isDefined(value))), [calcLoadouts]);
  const userIssues = useMemo(() => calcLoadouts.flatMap((loadout) => loadout.userIssues || []), [calcLoadouts]);

  const winnerIndices = useMemo(() => {
    if (store.loadouts.length <= 1) return new Set<number>();
    const ttkValues = calcLoadouts.map((l) => l?.ttk as number | undefined);
    const bestTtk = min(ttkValues.filter(isDefined));
    if (bestTtk === undefined) return new Set<number>();
    const indices = new Set<number>();
    ttkValues.forEach((v, i) => { if (v === bestTtk) indices.add(i); });
    return indices;
  }, [calcLoadouts, store.loadouts.length]);

  return (
    <table>
      <thead>
        <tr>
          <th aria-label="blank" className="bg-btns-400 border-r dark:bg-dark-500 select-none" />
          {store.loadouts.map((loadout, i) => {
            const isWinner = winnerIndices.size > 0 && winnerIndices.has(i);
            const isSelected = selectedLoadout === i;
            let headerBg = 'bg-btns-400 dark:bg-dark-500';
            if (isSelected) headerBg = 'bg-orange-400 dark:bg-orange-700';
            else if (isWinner) headerBg = 'bg-green-300/20 dark:bg-green-300/15';
            return (
              <th
                role="button"
                tabIndex={0}
              // eslint-disable-next-line react/no-array-index-key
                key={i}
                className={`text-center w-28 border-r py-1.5 font-bold font-serif leading-tight text-xs cursor-pointer transition-colors ${headerBg}`}
                onClick={() => store.setSelectedLoadout(i)}
                aria-label={`Select loadout ${loadout.name || i + 1}`}
                title={loadout.name || `Loadout ${i + 1}`}
              >
                <LoadoutTabLabel loadout={loadout} fallbackLabel={`${i + 1}`} showLabel labelClassName="w-20 text-[11px] leading-tight" regionBadgePlacement="left" />
                {isWinner && <span className="text-[9px] font-sans font-semibold uppercase tracking-wide text-green-700 dark:text-green-300">Best TTK</span>}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        <ResultRow calcKey="maxHit" title="The maximum hit that you will deal to the monster" hasResults={hasResults} calcLoadouts={calcLoadouts} userIssues={userIssues} winnerIndices={winnerIndices}>
          Max hit
        </ResultRow>
        <ResultRow calcKey="expectedHit" title="The average damage per attack, including misses." hasResults={hasResults} calcLoadouts={calcLoadouts} userIssues={userIssues} winnerIndices={winnerIndices}>
          Expected hit
        </ResultRow>
        <ResultRow calcKey="dps" title="The average damage you will deal per-second" hasResults={hasResults} calcLoadouts={calcLoadouts} userIssues={userIssues} winnerIndices={winnerIndices}>
          DPS
        </ResultRow>
        <ResultRow calcKey="ttk" title="The average time to kill the monster in seconds" hasResults={hasResults} calcLoadouts={calcLoadouts} userIssues={userIssues} winnerIndices={winnerIndices}>
          Avg. TTK
        </ResultRow>
        <ResultRow calcKey="accuracy" title="How accurate you are against the monster" hasResults={hasResults} calcLoadouts={calcLoadouts} userIssues={userIssues} winnerIndices={winnerIndices}>
          Accuracy
        </ResultRow>
        <ResultRow calcKey="specExpected" title="The expected hit that the special attack will deal to the monster per use, including misses" hasResults={hasResults} calcLoadouts={calcLoadouts} userIssues={userIssues} winnerIndices={winnerIndices}>
          Spec expected hit
        </ResultRow>
      </tbody>
    </table>
  );
});

export default PlayerVsNPCResultsTable;
