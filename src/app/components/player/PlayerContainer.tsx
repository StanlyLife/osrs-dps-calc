import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "@/state";
import { calculateCombatLevel, classNames } from "@/utils";
import LoadoutTabLabel from "@/app/components/LoadoutTabLabel";
import PlayerInnerContainer from "@/app/components/player/PlayerInnerContainer";
import LoadoutName from "@/app/components/player/LoadoutName";
import LoadoutRegionSelector from "@/app/components/player/LoadoutRegionSelector";
import { IconPlus, IconTrash } from "@tabler/icons-react";

const PlayerContainer: React.FC = observer(() => {
  const store = useStore();
  const [draggedLoadoutIndex, setDraggedLoadoutIndex] = useState<number | null>(
    null,
  );
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const activeDragIndexRef = useRef<number | null>(null);
  const dragMovedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const dragStartYRef = useRef<number | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const {
    loadouts,
    player,
    selectedLoadout,
    canCreateLoadout,
    createLoadout,
    renameLoadout,
    deleteLoadout,
    reorderLoadouts,
  } = store;

  const getLoadoutTooltip = (
    loadout: (typeof loadouts)[number],
    index: number,
  ) => {
    const baseLabel = loadout.name || `Loadout ${index + 1}`;
    const regionLabel =
      loadout.leagues.six.regions.length > 0
        ? ` • ${loadout.leagues.six.regions.join(", ")}`
        : "";
    const reorderHint =
      loadouts.length > 1 ? " • Drag over tabs to reorder" : "";
    return `${baseLabel}${regionLabel}${reorderHint}`;
  };

  const clearDragState = () => {
    activeDragIndexRef.current = null;
    dragStartYRef.current = null;
    setDraggedLoadoutIndex(null);
    setDropTargetIndex(null);
  };

  useEffect(() => {
    if (draggedLoadoutIndex === null) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const currentDragIndex = activeDragIndexRef.current;
      const startY = dragStartYRef.current;

      if (currentDragIndex === null || startY === null) {
        return;
      }

      if (!dragMovedRef.current && Math.abs(event.clientY - startY) < 6) {
        return;
      }

      dragMovedRef.current = true;

      const visibleTabs = tabRefs.current
        .map((tab, index) => ({ tab, index }))
        .filter(
          (entry): entry is { tab: HTMLButtonElement; index: number } =>
            entry.tab !== null,
        );

      if (!visibleTabs.length) {
        return;
      }

      let targetIndex = visibleTabs[0].index;
      let smallestDistance = Number.POSITIVE_INFINITY;

      for (const entry of visibleTabs) {
        const rect = entry.tab.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const distance = Math.abs(event.clientY - midpoint);

        if (distance < smallestDistance) {
          smallestDistance = distance;
          targetIndex = entry.index;
        }
      }

      if (
        Number.isNaN(targetIndex) ||
        currentDragIndex === null ||
        currentDragIndex === targetIndex
      ) {
        return;
      }

      reorderLoadouts(currentDragIndex, targetIndex);
      activeDragIndexRef.current = targetIndex;
      dragMovedRef.current = true;
      setDraggedLoadoutIndex(targetIndex);
      setDropTargetIndex(targetIndex);
    };

    const handlePointerUp = () => {
      if (dragMovedRef.current) {
        suppressClickRef.current = true;
      }
      dragMovedRef.current = false;
      clearDragState();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggedLoadoutIndex, reorderLoadouts]);

  return (
    <div className="w-full max-w-[350px]">
      <div className="fixed left-0 top-1/2 z-20 flex max-h-[calc(100vh-32px)] -translate-y-1/2 flex-col gap-1.5 overflow-y-auto pr-1 sm:pr-2 select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {loadouts.map((l, ix) => (
          <button
            type="button"
            // eslint-disable-next-line react/no-array-index-key
            key={ix}
            className={classNames(
              "flex h-8 w-10 sm:h-10 sm:w-12 cursor-grab touch-none items-center justify-center rounded-r-xl border border-l-0 border-body-100 shadow-sm transition-all active:cursor-grabbing dark:border-dark-300",
              draggedLoadoutIndex === ix ? "opacity-40" : "",
              dropTargetIndex === ix
                ? "translate-x-1 ring-2 ring-orange-300 dark:ring-orange-600"
                : "",
              selectedLoadout === ix
                ? "bg-orange-400 text-white dark:bg-orange-700"
                : "bg-btns-400 text-body-500 hover:bg-btns-300 dark:bg-dark-400 dark:text-dark-100 dark:hover:bg-dark-500",
            )}
            ref={(element) => {
              tabRefs.current[ix] = element;
            }}
            onPointerDown={(event) => {
              if (event.button !== 0) {
                return;
              }
              event.preventDefault();
              activeDragIndexRef.current = ix;
              dragMovedRef.current = false;
              dragStartYRef.current = event.clientY;
              event.currentTarget.setPointerCapture(event.pointerId);
              setDraggedLoadoutIndex(ix);
              setDropTargetIndex(ix);
            }}
            onPointerUp={() => {
              if (dragMovedRef.current) {
                suppressClickRef.current = true;
              }
              dragMovedRef.current = false;
              clearDragState();
            }}
            onClick={() => {
              if (suppressClickRef.current) {
                suppressClickRef.current = false;
                return;
              }
              store.setSelectedLoadout(ix);
            }}
            aria-label={`Select loadout ${l.name || ix + 1}`}
            data-tooltip-id="tooltip"
            data-tooltip-content={getLoadoutTooltip(l, ix)}
          >
            <LoadoutTabLabel
              loadout={l}
              fallbackLabel={`${ix + 1}`}
              imageClassName="h-6 w-6"
              regionBadgePlacement="none"
            />
          </button>
        ))}
        <button
          type="button"
          disabled={!canCreateLoadout}
          onClick={() => createLoadout(true, selectedLoadout)}
          className="flex h-8 w-10 sm:h-10 sm:w-12 items-center justify-center rounded-r-xl border border-l-0 border-body-100 bg-btns-400 text-body-500 shadow-sm transition-colors hover:text-green-300 disabled:cursor-not-allowed disabled:text-body-200 dark:border-dark-300 dark:bg-dark-400 dark:text-dark-100 dark:hover:bg-dark-500 dark:disabled:text-dark-500"
          data-tooltip-id="tooltip"
          data-tooltip-content="Add new loadout"
        >
          <IconPlus aria-label="Add new loadout" />
        </button>
      </div>
      <div className="min-w-0 bg-tile sm:rounded-lg dark:bg-dark-300 text-black dark:text-white shadow-lg flex flex-col">
        <div className="px-5 py-3 border-b-body-400 dark:border-b-dark-200 border-b flex justify-between items-center font-serif">
          <div className="min-w-0">
            <LoadoutName
              name={loadouts[selectedLoadout].name}
              renameLoadout={renameLoadout}
              index={selectedLoadout}
            />
            <div className="text-xs font-bold text-gray-500 dark:text-gray-300">
              Level {calculateCombatLevel(player.skills)}
            </div>
            <LoadoutRegionSelector />
          </div>
          <button
            type="button"
            onClick={() => deleteLoadout(selectedLoadout)}
            className="disabled:cursor-not-allowed text-body-500 dark:text-dark-100 disabled:text-btns-100 dark:disabled:text-dark-500 hover:text-red-300 transition-colors"
            data-tooltip-id="tooltip"
            data-tooltip-content="Remove loadout"
          >
            <IconTrash aria-label="Remove loadout" />
          </button>
        </div>
        <PlayerInnerContainer />
      </div>
    </div>
  );
});

export default PlayerContainer;
