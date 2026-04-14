import React, { useMemo } from 'react';
import { useStore } from '@/state';
import { observer } from 'mobx-react-lite';

import { Monster } from '@/types/Monster';
import { CUSTOM_MONSTER_BASE } from '@/lib/Monsters';
import { IconPencilPlus } from '@tabler/icons-react';
import Combobox from '../generic/Combobox';

interface MonsterOption {
  label: string;
  value: number;
  version: string;
  monster: Partial<Monster>;
}

interface MonsterSelectProps {
  id?: string;
  placeholder?: string;
  onSelectedMonsterChange?: (monster: Partial<Monster>) => void;
  includeCustomMonster?: boolean;
  excludedMonsters?: Array<Pick<Monster, 'id' | 'version'>>;
}

const MonsterSelect: React.FC<MonsterSelectProps> = observer((props) => {
  const store = useStore();
  const { availableMonsters } = store;
  const {
    id = 'monster-select',
    placeholder = 'Search for monster...',
    onSelectedMonsterChange,
    includeCustomMonster = true,
    excludedMonsters = [],
  } = props;

  const excludedMonsterKeys = useMemo(() => new Set(
    excludedMonsters.map((monster) => `${monster.id}:${monster.version || ''}`),
  ), [excludedMonsters]);

  const options: MonsterOption[] = useMemo(() => [
    ...(includeCustomMonster ? [{
      label: 'Create custom monster',
      value: -1,
      version: '',
      monster: { ...CUSTOM_MONSTER_BASE },
    }] : []),
    ...availableMonsters
      .filter((monster) => !excludedMonsterKeys.has(`${monster.id}:${monster.version || ''}`))
      .map((m, i) => ({
        label: `${m.name}`,
        value: i,
        version: m.version || '',
        monster: {
          ...m,
        },
      })),
  ], [availableMonsters, excludedMonsterKeys, includeCustomMonster]);

  return (
    <Combobox<MonsterOption>
      id={id}
      className="w-full"
      items={options}
      placeholder={placeholder}
      resetAfterSelect
      blurAfterSelect
      customFilter={(items, iv) => {
        if (!iv) return items;
        // When searching, don't show the custom monster option in the results
        return items.filter((i) => i.value !== -1);
      }}
      onSelectedItemChange={(item) => {
        if (item) {
          if (onSelectedMonsterChange) {
            onSelectedMonsterChange(item.monster);
          } else {
            store.updateMonster(item.monster);
          }
        }
      }}
      CustomItemComponent={({ item }) => {
        const i = item;

        // Handle custom monster option
        if (i.value === -1) {
          return (
            <div className="text-gray-300 flex gap-1 items-center italic">
              <IconPencilPlus size={14} />
              {i.label}
            </div>
          );
        }

        return (
          <div>
            {i.label}
            {i.version && (
            <span className="monster-version text-xs text-gray-400 dark:text-gray-300">
              #
              {i.version}
            </span>
            )}
          </div>
        );
      }}
    />
  );
});

export default MonsterSelect;
