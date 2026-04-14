import React, { useEffect, useMemo, useState } from 'react';
import { PartialDeep } from 'type-fest';
import demon from '@/public/img/bonuses/demon.png';
import hitpoints from '@/public/img/bonuses/hitpoints.png';
import mining from '@/public/img/bonuses/mining.png';
import toaRaidLevel from '@/public/img/toa_raidlevel.webp';
import raidsIcon from '@/public/img/raids_icon.webp';
import coxCmIcon from '@/public/img/cox_challenge_mode.png';
import { useStore } from '@/state';
import { observer } from 'mobx-react-lite';
import { MonsterAttribute } from '@/enums/MonsterAttribute';
import { getCdnImage, typedMerge } from '@/utils';
import NumberInput from '@/app/components/generic/NumberInput';
import {
  GUARDIAN_IDS,
  MONSTER_PHASES_BY_ID,
  PARTY_SIZE_REQUIRED_MONSTER_IDS,
  TOMBS_OF_AMASCUT_MONSTER_IDS,
  TOMBS_OF_AMASCUT_PATH_MONSTER_IDS,
} from '@/lib/constants';
import {
  IconChevronDown, IconChevronUp, IconPlus, IconTrash,
} from '@tabler/icons-react';
import { scaleMonster } from '@/lib/MonsterScaling';
import { Monster, MonsterCombatStyle } from '@/types/Monster';
import LazyImage from '@/app/components/generic/LazyImage';
import Toggle from '@/app/components/generic/Toggle';
import { toJS } from 'mobx';
import DefensiveReductions from '@/app/components/monster/DefensiveReductions';
import Select from '@/app/components/generic/Select';
import { INITIAL_MONSTER_INPUTS } from '@/lib/Monsters';
import MonsterSelect from './MonsterSelect';

interface ComparisonMonsterSlot {
  id: number;
  monster: Monster | null;
}

interface MonsterContainerProps {
  comparisonMonsterSlots: ComparisonMonsterSlot[];
  canAddComparisonMonster: boolean;
  onAddComparisonMonster: () => void;
  onRemoveComparisonMonster: (slotId: number) => void;
  onUpdateComparisonMonster: (slotId: number, monster: Monster | null) => void;
}

interface ITombsOfAmascutMonsterContainerProps {
  monster: Monster;
  onUpdateMonster: (monster: PartialDeep<Monster>) => void;
  isPathMonster?: boolean;
}

const TombsOfAmascutMonsterContainer: React.FC<ITombsOfAmascutMonsterContainerProps> = (props) => {
  const { monster, onUpdateMonster, isPathMonster } = props;

  return (
    <>
      <div>
        <h4 className="font-bold font-serif">
          <img src={toaRaidLevel.src} alt="" className="inline-block" />
          {' '}
          ToA raid level
        </h4>
        <div className="mt-2">
          <NumberInput
            value={monster.inputs.toaInvocationLevel}
            min={0}
            max={700}
            step={5}
            commitOnBlur
            onChange={(v) => onUpdateMonster({ inputs: { toaInvocationLevel: v } })}
            required
          />
        </div>
      </div>
      {isPathMonster && (
        <div className="mt-4">
          <h4 className="font-bold font-serif">
            <img src={toaRaidLevel.src} alt="" className="inline-block" />
            {' '}
            ToA path level
          </h4>
          <div className="mt-2">
            <NumberInput
              value={monster.inputs.toaPathLevel}
              min={0}
              max={6}
              step={1}
              commitOnBlur
              onChange={(v) => onUpdateMonster({ inputs: { toaPathLevel: v } })}
              required
            />
          </div>
        </div>
      )}
    </>
  );
};

interface MonsterSettingsOptionsParams {
  displayMonster: Monster;
  isCustomMonster: boolean;
  monster: Monster;
  phaseOptions?: { label: string }[];
  updateMonster: (monster: PartialDeep<Monster>) => void;
}

const COMBAT_STYLE_OPTIONS: { label: string, value: MonsterCombatStyle }[] = [
  { label: 'Crush', value: 'crush' },
  { label: 'Stab', value: 'stab' },
  { label: 'Slash', value: 'slash' },
  { label: 'Magic', value: 'magic' },
  { label: 'Ranged', value: 'ranged' },
];

const getMonsterKey = (monster: Pick<Monster, 'id' | 'version'>) => `${monster.id}:${monster.version || ''}`;

const getMonsterSettingsOptions = (params: MonsterSettingsOptionsParams): React.ReactNode[] => {
  const {
    displayMonster,
    isCustomMonster,
    monster,
    phaseOptions,
    updateMonster,
  } = params;
  const comps: React.ReactNode[] = [];

  if (isCustomMonster) {
    comps.push(
      <div key="combat-style">
        <h4 className="font-bold font-serif">
          Combat style
        </h4>
        <div className="mt-2">
          <Select<typeof COMBAT_STYLE_OPTIONS[0]>
            id="monster-combat-style"
            items={COMBAT_STYLE_OPTIONS}
            value={COMBAT_STYLE_OPTIONS.find((v) => v.value === monster.style)}
            onSelectedItemChange={(i) => updateMonster({ style: i?.value })}
          />
        </div>
      </div>,
      <div key="attack-speed">
        <h4 className="font-bold font-serif">
          Attack speed (ticks)
        </h4>
        <div className="mt-2">
          <NumberInput
            value={monster.speed}
            min={1}
            max={20}
            onChange={(s) => updateMonster({ speed: s })}
            required
          />
        </div>
      </div>,
      <div key="monster-size">
        <h4 className="font-bold font-serif">
          Size (tiles)
        </h4>
        <div className="mt-2">
          <NumberInput
            value={monster.size}
            min={1}
            max={10}
            onChange={(s) => updateMonster({ size: s })}
            required
          />
        </div>
      </div>,
    );
  }

  if (TOMBS_OF_AMASCUT_MONSTER_IDS.includes(monster.id) || isCustomMonster) {
    comps.push(
      <TombsOfAmascutMonsterContainer
        key="toa"
        monster={monster}
        onUpdateMonster={updateMonster}
        isPathMonster={TOMBS_OF_AMASCUT_PATH_MONSTER_IDS.includes(monster.id)}
      />,
    );
  }

  if (monster.attributes.includes(MonsterAttribute.XERICIAN)) {
    comps.push(
      <div key="cox-cm">
        <h4 className="font-bold font-serif">
          <img src={coxCmIcon.src} alt="" className="inline-block" />
          {' '}
          Challenge Mode
        </h4>
        <div className="mt-2">
          <Toggle
            checked={monster.inputs.isFromCoxCm}
            setChecked={(c) => updateMonster({ inputs: { isFromCoxCm: c } })}
          />
        </div>
      </div>,
    );
  }

  if (PARTY_SIZE_REQUIRED_MONSTER_IDS.includes(monster.id) || monster.attributes.includes(MonsterAttribute.XERICIAN)) {
    comps.push(
      <div key="party-size">
        <h4 className="font-bold font-serif">
          <img src={raidsIcon.src} alt="" className="inline-block" />
          {' '}
          Party size
        </h4>
        <div className="mt-2">
          <NumberInput
            value={monster.inputs.partySize}
            min={1}
            max={100}
            step={1}
            commitOnBlur
            onChange={(v) => updateMonster({ inputs: { partySize: v } })}
            required
          />
        </div>
      </div>,
    );
  }

  if (monster.attributes.includes(MonsterAttribute.XERICIAN)) {
    comps.push(
      <div key="cox-cb">
        <h4 className="font-bold font-serif">
          <img src={raidsIcon.src} alt="" className="inline-block" />
          {' '}
          Party&apos;s highest combat level
        </h4>
        <div className="mt-2">
          <NumberInput
            value={monster.inputs.partyMaxCombatLevel}
            min={3}
            max={126}
            step={1}
            onChange={(v) => updateMonster({ inputs: { partyMaxCombatLevel: v } })}
            required
          />
        </div>
      </div>,
    );

    comps.push(
      <div key="cox-hp">
        <h4 className="font-bold font-serif">
          <img src={raidsIcon.src} alt="" className="inline-block" />
          {' '}
          Party&apos;s highest HP level
        </h4>
        <div className="mt-2">
          <NumberInput
            value={monster.inputs.partyMaxHpLevel}
            min={1}
            max={99}
            step={1}
            onChange={(v) => updateMonster({ inputs: { partyMaxHpLevel: v } })}
            required
          />
        </div>
      </div>,
    );
  }

  if (GUARDIAN_IDS.includes(monster.id)) {
    comps.push(
      <div key="cox-guardian">
        <h4 className="font-bold font-serif">
          <img src={mining.src} alt="" className="inline-block" />
          {' '}
          Party&apos;s sum of mining levels
          {' '}
          <span
            className="align-super underline decoration-dotted cursor-help text-xs text-gray-300"
            data-tooltip-id="tooltip"
            data-tooltip-content="Does NOT include 'fake' board-scaling players."
          >
            ?
          </span>
        </h4>
        <div className="mt-2">
          <NumberInput
            value={monster.inputs.partySumMiningLevel}
            min={1}
            max={9900}
            step={1}
            onChange={(v) => updateMonster({ inputs: { partySumMiningLevel: v } })}
            required
          />
        </div>
      </div>,
    );
  }

  if (phaseOptions) {
    comps.push(
      <div key="td-phase">
        <h4 className="font-bold font-serif">
          Phase
        </h4>
        <div className="mt-2">
          <Select
            id="presets"
            items={phaseOptions}
            placeholder={monster.inputs.phase}
            value={phaseOptions.find((opt) => opt.label === monster.inputs.phase)}
            resetAfterSelect
            onSelectedItemChange={(v) => updateMonster({ inputs: { phase: v?.label } })}
          />
        </div>
      </div>,
    );
  }

  if (monster.attributes.includes(MonsterAttribute.DEMON) && isCustomMonster) {
    comps.push(
      <div key="demonbane-effectiveness">
        <h4 className="font-bold font-serif">
          <img src={demon.src} alt="" className="inline-block" />
          {' '}
          Demonbane effectiveness
        </h4>
        <div className="mt-2">
          <NumberInput
            value={monster.inputs.demonbaneVulnerability || 100}
            min={0}
            max={10000}
            step={1}
            onChange={(v) => updateMonster({ inputs: { demonbaneVulnerability: v } })}
          />
          %
        </div>
      </div>,
    );
  }

  comps.push(
    <div key="monster-current-hp">
      <h4 className="font-bold font-serif">
        <img src={hitpoints.src} alt="" className="inline-block" />
        {' '}
        Monster&apos;s current HP
      </h4>
      <div className="mt-2">
        <NumberInput
          value={monster.inputs.monsterCurrentHp}
          min={0}
          max={displayMonster.skills.hp}
          step={1}
          onChange={(v) => updateMonster({ inputs: { monsterCurrentHp: v } })}
          required
        />
      </div>
    </div>,
  );

  return comps;
};

const toComparisonMonster = (monster: Partial<Monster>): Monster | null => {
  if (!monster.skills) {
    return null;
  }

  return {
    ...(monster as Omit<Monster, 'inputs'>),
    inputs: {
      ...INITIAL_MONSTER_INPUTS,
      monsterCurrentHp: monster.skills.hp,
    },
  };
};

interface ComparisonMonsterSlotCardProps {
  index: number;
  primaryMonster: Monster;
  selectedComparisonMonsters: Monster[];
  slot: ComparisonMonsterSlot;
  onRemoveComparisonMonster: (slotId: number) => void;
  onUpdateComparisonMonster: (slotId: number, monster: Monster | null) => void;
}

const ComparisonMonsterSlotCard: React.FC<ComparisonMonsterSlotCardProps> = (props) => {
  const {
    index,
    primaryMonster,
    selectedComparisonMonsters,
    slot,
    onRemoveComparisonMonster,
    onUpdateComparisonMonster,
  } = props;
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [reductionsExpanded, setReductionsExpanded] = useState(false);
  const monster = slot.monster;

  const excludedMonsters = useMemo(() => [primaryMonster, ...selectedComparisonMonsters]
    .filter((entry) => !monster || getMonsterKey(entry) !== getMonsterKey(monster))
    .map((entry) => ({ id: entry.id, version: entry.version })), [monster, primaryMonster, selectedComparisonMonsters]);

  const isCustomMonster = monster?.id === -1;
  const phases = useMemo(() => (monster ? MONSTER_PHASES_BY_ID[monster.id] : undefined), [monster]);
  const phaseOptions = useMemo(() => phases?.map((phase) => ({ label: phase })), [phases]);
  const monsterJs = useMemo(() => (monster ? toJS(monster) : null), [monster]);
  const displayMonster = useMemo(() => {
    if (!monsterJs) {
      return null;
    }

    return isCustomMonster ? monsterJs : scaleMonster(monsterJs);
  }, [isCustomMonster, monsterJs]);

  const updateComparisonMonster = (updates: PartialDeep<Monster>) => {
    if (!monster) {
      return;
    }

    onUpdateComparisonMonster(slot.id, typedMerge(monster, updates));
  };

  useEffect(() => {
    if (monster && phases && !phases.includes(monster.inputs.phase || '')) {
      updateComparisonMonster({ inputs: { phase: phases[0] } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phases, slot.id]);

  useEffect(() => {
    if (monster && displayMonster && monster.inputs.monsterCurrentHp !== displayMonster.skills.hp) {
      updateComparisonMonster({ inputs: { monsterCurrentHp: displayMonster.skills.hp } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayMonster?.skills.hp, monster?.id, slot.id]);

  const extraMonsterOptions = (!monster || !displayMonster)
    ? []
    : getMonsterSettingsOptions({
      displayMonster,
      isCustomMonster,
      monster,
      phaseOptions,
      updateMonster: updateComparisonMonster,
    });

  return (
    <div className="rounded bg-body-100 px-3 py-3 dark:bg-dark-500">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {monster?.image && (
            <div className="flex h-8 w-8 items-center">
              <LazyImage
                responsive
                src={getCdnImage(`monsters/${monster.image}`)}
                alt={monster.name || 'Unknown'}
              />
            </div>
          )}
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300">
              NPC
              {' '}
              {index + 2}
            </div>
            <div className="mt-1 text-sm font-semibold text-black dark:text-white">
              {monster ? `${monster.name}${monster.version ? ` #${monster.version}` : ''}` : 'Not selected'}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm text-body-500 transition-colors hover:text-red-300 dark:text-dark-100"
          onClick={() => onRemoveComparisonMonster(slot.id)}
        >
          <IconTrash size={16} />
          Remove NPC
        </button>
      </div>
      <div className="mt-3">
        <MonsterSelect
          id={`comparison-monster-select-${slot.id}`}
          placeholder={monster ? 'Replace NPC...' : 'Add NPC...'}
          includeCustomMonster={false}
          excludedMonsters={excludedMonsters}
          onSelectedMonsterChange={(nextMonster) => {
            const comparisonMonster = toComparisonMonster(nextMonster);
            if (comparisonMonster) {
              onUpdateComparisonMonster(slot.id, comparisonMonster);
            }
          }}
        />
      </div>
      {monster && (
        <div className="mt-3 space-y-2 text-sm">
          {extraMonsterOptions.length > 0 && (
            <div className="rounded bg-white dark:bg-dark-400">
              <button
                type="button"
                className={`w-full pt-1 border-b-body-400 dark:border-b-dark-300 px-2 flex text-gray-500 dark:text-gray-300 font-semibold justify-between gap-2 ${settingsExpanded ? 'border-b' : ''}`}
                onClick={() => setSettingsExpanded(!settingsExpanded)}
              >
                <div>
                  Monster Settings
                </div>
                <div className="relative top-[-2px]">
                  {settingsExpanded ? <IconChevronUp width={20} /> : <IconChevronDown width={20} />}
                </div>
              </button>
              {settingsExpanded && (
                <div className="flex flex-wrap gap-4 rounded bg-body-100 px-2 py-2 dark:bg-dark-500">
                  {extraMonsterOptions}
                </div>
              )}
            </div>
          )}
          <DefensiveReductions
            monster={monster}
            isExpanded={reductionsExpanded}
            onExpandedChange={setReductionsExpanded}
            updateMonster={updateComparisonMonster}
          />
        </div>
      )}
    </div>
  );
};

const MonsterContainer: React.FC<MonsterContainerProps> = observer((props) => {
  const store = useStore();
  const { monster } = store;
  const {
    comparisonMonsterSlots,
    canAddComparisonMonster,
    onAddComparisonMonster,
    onRemoveComparisonMonster,
    onUpdateComparisonMonster,
  } = props;
  const [optionsExpanded, setOptionsExpanded] = useState(false);

  const isCustomMonster = store.monster.id === -1;

  const phases = useMemo(() => MONSTER_PHASES_BY_ID[monster.id], [monster.id]);

  const phaseOptions = useMemo(() => phases?.map((p) => ({ label: p })), [phases]);

  useEffect(() => {
    // When display monster name is changed, reset the phase option selection
    if (phases && !phases?.includes(store.monster.inputs.phase || '')) {
      store.updateMonster({ inputs: { phase: phases?.[0] } });
    }
  }, [store, phases]);

  // Don't automatically update the stat inputs if manual editing is on
  const monsterJS = toJS(monster);
  const displayMonster = useMemo(() => {
    if (isCustomMonster) {
      return monsterJS;
    }
    return scaleMonster(monsterJS);
  }, [isCustomMonster, monsterJS]);

  useEffect(() => {
    // When display monster HP or NPC ID is changed, update the monster's current HP
    if (store.monster.inputs.monsterCurrentHp !== displayMonster.skills.hp || store.monster.id !== displayMonster.id) {
      store.updateMonster({ inputs: { monsterCurrentHp: displayMonster.skills.hp } });
    }
  }, [store, displayMonster.skills.hp, displayMonster.id]);

  const selectedComparisonMonsters = useMemo(
    () => comparisonMonsterSlots.flatMap((slot) => (slot.monster ? [slot.monster] : [])),
    [comparisonMonsterSlots],
  );

  const extraMonsterOptions = useMemo(() => getMonsterSettingsOptions({
    displayMonster,
    isCustomMonster,
    monster,
    phaseOptions,
    updateMonster: store.updateMonster,
  }), [displayMonster, isCustomMonster, monster, phaseOptions, store.updateMonster]);

  return (
    <div className="w-full max-w-[350px] flex flex-col">
      <div
        className="bg-tile dark:bg-dark-300 sm:rounded-lg text-black dark:text-white shadow-lg"
      >
        <div
          className="px-6 py-2 border-b-body-400 dark:border-b-dark-200 border-b md:rounded md:rounded-bl-none md:rounded-br-none flex justify-between items-center bg-body-100 dark:bg-dark-400"
        >
          <h2 className="font-serif tracking-tight font-bold">
            NPCs
            {' '}
            <span className="text-sm text-gray-500 dark:text-gray-300 font-normal">
              (
              {1 + comparisonMonsterSlots.length}
              /3)
            </span>
          </h2>
        </div>
        <div className="px-4 py-4 border-b-body-400 dark:border-b-dark-200 border-b space-y-3">
          <div className="rounded bg-body-100 px-3 py-3 dark:bg-dark-500">
            <div className="flex items-center gap-2">
              {monster.image && (
                <div className="flex h-8 w-8 items-center">
                  <LazyImage
                    responsive
                    src={getCdnImage(`monsters/${monster.image}`)}
                    alt={monster.name || 'Unknown'}
                  />
                </div>
              )}
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300">
                  NPC 1
                </div>
                <div className="mt-1 text-sm font-semibold text-black dark:text-white">
                  {monster.name ? `${monster.name}${monster.version ? ` #${monster.version}` : ''}` : 'Not selected'}
                </div>
              </div>
            </div>
            <div className="mt-3">
              <MonsterSelect />
            </div>
            <div className="mt-3 space-y-2 text-sm">
              {(extraMonsterOptions.length > 0) && (
                <div className="rounded bg-white dark:bg-dark-400">
                  <button
                    type="button"
                    className={`w-full pt-1 border-b-body-400 dark:border-b-dark-300 px-2 flex text-gray-500 dark:text-gray-300 font-semibold justify-between gap-2 ${optionsExpanded ? 'border-b' : ''}`}
                    onClick={() => setOptionsExpanded(!optionsExpanded)}
                  >
                    <div>
                      Monster Settings
                    </div>
                    <div className="relative top-[-2px]">
                      {optionsExpanded ? <IconChevronUp width={20} />
                        : <IconChevronDown width={20} />}
                    </div>
                  </button>
                  {optionsExpanded && (
                    <div className="flex flex-wrap gap-4 rounded bg-body-100 px-2 py-2 dark:bg-dark-500">
                      {extraMonsterOptions}
                    </div>
                  )}
                </div>
              )}
              <DefensiveReductions />
            </div>
          </div>
          <div className="space-y-3">
            {comparisonMonsterSlots.map((slot, index) => (
              <ComparisonMonsterSlotCard
                key={slot.id}
                index={index}
                primaryMonster={monster}
                selectedComparisonMonsters={selectedComparisonMonsters}
                slot={slot}
                onRemoveComparisonMonster={onRemoveComparisonMonster}
                onUpdateComparisonMonster={onUpdateComparisonMonster}
              />
            ))}

            {canAddComparisonMonster && (
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm font-semibold text-body-500 transition-colors hover:text-green-300 dark:text-dark-100"
                onClick={onAddComparisonMonster}
              >
                <IconPlus size={16} />
                Add NPC
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default MonsterContainer;
