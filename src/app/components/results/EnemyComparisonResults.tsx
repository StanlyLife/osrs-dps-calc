import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import ComparisonMonsterResultsCard from '@/app/components/results/ComparisonMonsterResultsCard';
import { useStore } from '@/state';
import { Monster } from '@/types/Monster';

interface EnemyComparisonResultsProps {
  comparisonMonsters: Monster[];
}

const getMonsterKey = (monster: Pick<Monster, 'id' | 'version'>) => `${monster.id}:${monster.version || ''}`;

const EnemyComparisonResults: React.FC<EnemyComparisonResultsProps> = observer((props) => {
  const store = useStore();
  const { comparisonMonsters } = props;
  const loadouts = toJS(store.loadouts);

  const loadoutsJson = useMemo(() => JSON.stringify(loadouts), [loadouts]);

  if (comparisonMonsters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {comparisonMonsters.map((monster) => (
        <ComparisonMonsterResultsCard
          key={getMonsterKey(monster)}
          loadoutsJson={loadoutsJson}
          monster={monster}
        />
      ))}
    </div>
  );
});
export default EnemyComparisonResults;
