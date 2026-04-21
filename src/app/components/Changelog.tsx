import Modal from "@/app/components/generic/Modal";
import React, { PropsWithChildren, useState } from "react";
import { IconNews } from "@tabler/icons-react";

interface IChangelogEntryProps {
  date: string;
}

const ChangelogEntry: React.FC<PropsWithChildren<IChangelogEntryProps>> = (
  props,
) => {
  const { date, children } = props;

  return (
    <div className="border-t first:border-0 mt-2 first:mt-0 pt-2 first:pt-0 border-dark-300">
      <span className="rounded bg-green-500 px-1">{date}</span>
      <div className="mt-1">
        <ul className="list-inside list-disc text-gray-300 changelog-list">
          {children}
        </ul>
      </div>
    </div>
  );
};

const Changelog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="transition-all hover:scale-105 hover:text-white border border-body-500 bg-[#3e2816] py-1.5 px-2.5 rounded-md dark:bg-dark-300 dark:border-dark-200 flex items-center gap-1"
        onClick={() => setIsOpen(true)}
      >
        <IconNews size={20} aria-label="Changelog" />
        <div className="hidden md:block">Changelog</div>
      </button>
      <Modal
        isOpen={isOpen}
        setIsOpen={(open) => setIsOpen(open)}
        title="Changelog"
      >
        <div className="text-sm bg-dark-500 rounded p-2 shadow-inner border border-dark-200 overflow-auto max-h-64">
          <ChangelogEntry date="14 April 2026">
            <li>
              Added side-tab loadout management with support for up to 10
              loadouts, drag-to-reorder tabs, keyboard shortcuts from 1 to 0,
              and loadout badges that show equipped weapons and selected League
              regions.
            </li>
            <li>
              Added League region selection per loadout, persisted those regions
              through imports and shared state, and surfaced the chosen regions
              throughout the UI.
            </li>
            <li>
              Reworked the monster panel so you can add up to two comparison
              NPCs, configure each one separately, and reuse monster settings
              and defensive reductions across those comparison cards.
            </li>
            <li>
              Simplified the results area into focused per-NPC tables,
              highlighted the best average TTK between loadouts, and removed the
              older hit-distribution, TTK graph, loadout-comparison, and
              NPC-vs-player result panels from the main flow.
            </li>
            <li>
              Tuned several League-related combat calculations, including
              updated echo behavior handling and clearer per-loadout region
              context in the UI.
            </li>
            <li>
              Added Drygore blowpipe burn damage into DPS calculations and now
              warn when that burn is included in DPS but not yet reflected in
              TTK.
            </li>
            <li>
              Improved stability around startup and recalculation by preventing
              duplicate initial loads, discarding stale worker responses safely,
              and avoiding runaway TTK work for infinite-health or very large
              minion scenarios.
            </li>
            <li>
              Updated imports and defaults so comparison monsters persist
              correctly and the app now opens on Gemstone Crab as the default
              NPC.
            </li>
            <li>
              Removed the RuneLite WikiSync import flow from the current UI and
              trimmed the top bar actions to match the new comparison-focused
              workflow.
            </li>
          </ChangelogEntry>
        </div>
        <div className="flex justify-center text-xs mt-3 gap-1">
          <span>Weekly data updates not displayed here.</span>
          <a
            href="https://github.com/weirdgloop/osrs-dps-calc/commits/main/"
            target="_blank"
            aria-label="Visit the GitHub repo"
          >
            View commits on GitHub
          </a>
        </div>
      </Modal>
    </>
  );
};

export default Changelog;
