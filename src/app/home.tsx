'use client';

import type { NextPage } from 'next';
import MonsterContainer from '@/app/components/monster/MonsterContainer';
import { Tooltip } from 'react-tooltip';
import React, {
  Suspense,
  useEffect,
  useMemo,
} from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/state';
import { ToastContainer } from 'react-toastify';
import PlayerContainer from '@/app/components/player/PlayerContainer';
import PlayerVsNPCResultsContainer from '@/app/components/results/PlayerVsNPCResultsContainer';
import { IReactionPublic, reaction, toJS } from 'mobx';
import InitialLoad from '@/app/components/InitialLoad';
import ShareModal from '@/app/components/ShareModal';
import DebugPanels from '@/app/components/results/DebugPanels';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useCalc } from '@/worker/CalcWorker';
import { NUMBER_OF_LOADOUTS } from '@/lib/constants';
import { Monster } from '@/types/Monster';

const isExpectedCalcWorkerError = (error: unknown): boolean => error instanceof Error
  && (
    error.message.includes('superseded by a newer')
    || error.message.includes('worker was shutdown')
  );

const LOADOUT_SHORTCUT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] as const;

const getMonsterKey = (monster: Pick<Monster, 'id' | 'version'>) => `${monster.id}:${monster.version || ''}`;

const Home: NextPage = observer(() => {
  const calc = useCalc();
  const store = useStore();
  const debugEnabled = process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true';

  const comparisonMonsters = useMemo(
    () => store.comparisonMonsterSlots.flatMap((slot) => (slot.monster ? [slot.monster] : [])),
    [store.comparisonMonsterSlots],
  );

  useEffect(() => {
    if (store.debug !== debugEnabled) {
      store.debug = debugEnabled;
    }
  }, [debugEnabled, store]);

  useEffect(() => {
    const primaryMonsterKey = getMonsterKey(store.monster);
    let didChange = false;
    const seen = new Set<string>([primaryMonsterKey]);
    const normalizedSlots = store.comparisonMonsterSlots.map((slot) => {
      if (!slot.monster) {
        return slot;
      }

      const monsterKey = getMonsterKey(slot.monster);
      if (seen.has(monsterKey)) {
        didChange = true;
        return {
          ...slot,
          monster: null,
        };
      }

      seen.add(monsterKey);
      return slot;
    });

    if (didChange) {
      store.setComparisonMonsterSlots(normalizedSlots);
    }
  }, [store, store.comparisonMonsterSlots, store.monster]);

  useEffect(() => {
    store.setCalcWorker(calc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canAddComparisonMonster = store.comparisonMonsterSlots.length < 2;

  const globalKeyDownHandler = (e: KeyboardEvent) => {
    // We only handle events that occur outside <input>, <textarea>, etc
    if (e.target !== document.body) return;

    // Ignore if any modifier keys are held (to not interfere with browser/system shortcuts)
    if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;

    if (LOADOUT_SHORTCUT_KEYS.includes(e.key as typeof LOADOUT_SHORTCUT_KEYS[number])) {
      const shortcutIndex = e.key === '0' ? 9 : Number(e.key) - 1;
      if (shortcutIndex < NUMBER_OF_LOADOUTS && store.loadouts[shortcutIndex] !== undefined) {
        store.setSelectedLoadout(shortcutIndex);
      }
    } else {
      return;
    }

    // If we get here, we've handled the event, so prevent it bubbling
    e.preventDefault();
  };

  useEffect(() => {
    // Load preferences from browser storage if there are any
    store.loadPreferences();

    // Setup global event handling
    document.addEventListener('keydown', globalKeyDownHandler);

    return () => {
      document.removeEventListener('keydown', globalKeyDownHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const recompute = () => {
      store.doWorkerRecompute()
        .catch((error) => {
          if (!isExpectedCalcWorkerError(error)) {
            console.error(error);
          }
        });
    };

    // When a calculator input changes, trigger a re-compute on the worker
    const triggers: ((r: IReactionPublic) => unknown)[] = [
      () => toJS(store.loadouts),
      () => toJS(store.monster),
    ];
    const reactions = triggers.map((t) => reaction(t, recompute, { fireImmediately: true }));

    return () => {
      for (const r of reactions) {
        r();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {store.prefs.manualMode && (
        <button
          type="button"
          className="w-full bg-orange-500 text-white px-4 py-1 text-sm border-b border-orange-400 flex items-center gap-1"
          onClick={() => store.updatePreferences({ manualMode: false })}
        >
          <IconAlertTriangle className="text-orange-200" />
          Manual mode is enabled! Some things may not function correctly. Click here to disable it.
        </button>
      )}
      <Suspense>
        <InitialLoad />
      </Suspense>
      {/* Main container */}
      <div className="max-w-[1420px] mx-auto mt-4 px-2 pl-14 sm:px-4 sm:pl-16 md:pl-20 md:mb-8">
        <div className="flex gap-2 flex-wrap lg:flex-nowrap justify-center items-start">
          <div className="flex w-full flex-col gap-2 lg:max-w-[350px] lg:flex-none">
            <PlayerContainer />
            <MonsterContainer
              comparisonMonsterSlots={store.comparisonMonsterSlots}
              canAddComparisonMonster={canAddComparisonMonster}
              onAddComparisonMonster={store.addComparisonMonsterSlot}
              onRemoveComparisonMonster={store.removeComparisonMonsterSlot}
              onUpdateComparisonMonster={store.updateComparisonMonsterSlot}
            />
          </div>
          <PlayerVsNPCResultsContainer comparisonMonsters={comparisonMonsters} />
        </div>
      </div>
      <div className="max-w-[1420px] mx-auto mb-8 px-2 pl-14 sm:px-4 sm:pl-16 md:pl-20">
        <DebugPanels />
      </div>
      <Tooltip id="tooltip" />
      <Tooltip id="tooltip-warning" />
      <ToastContainer
        position="bottom-right"
        hideProgressBar
        draggable={false}
        limit={3}
        closeButton={false}
        className="text-sm"
      />
      <ShareModal />
    </div>
  );
});

export default Home;
