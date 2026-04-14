import React from 'react';
import PlayerVsNPCResultsTable from '@/app/components/results/PlayerVsNPCResultsTable';
import EnemyComparisonResults from '@/app/components/results/EnemyComparisonResults';
import MonsterResultsTitle from '@/app/components/results/MonsterResultsTitle';
import { observer } from 'mobx-react-lite';
import AutoHeight from '@/app/components/generic/AutoHeight';
import { useStore } from '@/state';
import { toJS } from 'mobx';
import { Monster } from '@/types/Monster';

interface ResultsContainerProps {
  comparisonMonsters: Monster[];
}

const ResultsContainer: React.FC<ResultsContainerProps> = observer((props) => {
  const store = useStore();
  const { comparisonMonsters } = props;
  const loadoutResults = toJS(store.calc.loadouts);

  return (
    <div className="grow basis-1/4 min-w-0 flex flex-col gap-2">
      <div
        className="sm:rounded shadow-lg bg-tile dark:bg-dark-300"
      >
        <div
          className="px-4 py-3.5 border-b-body-400 bg-body-100 dark:bg-dark-400 dark:border-b-dark-200 border-b md:rounded md:rounded-bl-none md:rounded-br-none flex justify-between items-center"
        >
          <MonsterResultsTitle monster={store.monster} />
        </div>
        <AutoHeight
          duration={200}
          height="auto"
        >
          <div className="overflow-x-auto max-w-[100vw]">
            <PlayerVsNPCResultsTable calcLoadouts={loadoutResults} />
          </div>
        </AutoHeight>
      </div>
      <EnemyComparisonResults comparisonMonsters={comparisonMonsters} />
    </div>
  );
});

export default ResultsContainer;
