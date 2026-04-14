import React, { useEffect, useState } from 'react';
import PlayerVsNPCResultsTable from '@/app/components/results/PlayerVsNPCResultsTable';
import MonsterResultsTitle from '@/app/components/results/MonsterResultsTitle';
import { Monster } from '@/types/Monster';
import { PlayerVsNPCCalculatedLoadout } from '@/types/State';
import { useIndependentCalc } from '@/worker/CalcWorker';
import { WorkerRequestType } from '@/worker/CalcWorkerTypes';

interface ComparisonMonsterResultsCardProps {
  loadoutsJson: string;
  monster: Monster;
}

const ComparisonMonsterResultsCard: React.FC<ComparisonMonsterResultsCardProps> = (props) => {
  const calc = useIndependentCalc();
  const { loadoutsJson, monster } = props;
  const [calcLoadouts, setCalcLoadouts] = useState<PlayerVsNPCCalculatedLoadout[]>([]);

  useEffect(() => {
    if (!calc.isReady()) {
      setCalcLoadouts([]);
      return undefined;
    }

    let isCancelled = false;
    setCalcLoadouts([]);

    calc.do({
      type: WorkerRequestType.COMPUTE_BASIC,
      data: {
        loadouts: JSON.parse(loadoutsJson),
        monster,
        calcOpts: {
          detailedOutput: false,
          disableMonsterScaling: monster.id === -1,
        },
      },
    })
      .then((response) => {
        if (!isCancelled) {
          setCalcLoadouts(response.payload);
        }
      })
      .catch((error: unknown) => {
        if (
          !isCancelled
          && (!(error instanceof Error) || !error.message.includes('superseded by a newer'))
        ) {
          console.error('[ComparisonMonsterResultsCard] Failed to compute comparison result', error);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [calc, loadoutsJson, monster]);

  return (
    <div className="sm:rounded shadow-lg bg-tile dark:bg-dark-300">
      <div
        className="px-4 py-3.5 border-b-body-400 bg-body-100 dark:bg-dark-400 dark:border-b-dark-200 border-b md:rounded md:rounded-bl-none md:rounded-br-none flex justify-between items-center"
      >
        <MonsterResultsTitle monster={monster} />
      </div>
      <div className="overflow-x-auto max-w-[100vw]">
        <PlayerVsNPCResultsTable calcLoadouts={calcLoadouts} />
      </div>
    </div>
  );
};

export default ComparisonMonsterResultsCard;
