import { INITIAL_MONSTER_INPUTS, getMonsters } from '@/lib/Monsters';
import { GlobalState } from '@/state';
import { Monster } from '@/types/Monster';

const buildMonster = (name: string): Monster => {
  const monster = getMonsters().find((entry) => entry.name === name);

  if (!monster) {
    throw new Error(`Monster '${name}' was not found`);
  }

  return {
    ...monster,
    inputs: {
      ...INITIAL_MONSTER_INPUTS,
      monsterCurrentHp: monster.skills.hp,
    },
  };
};

describe('comparison monster persistence', () => {
  it('round-trips comparison monster slots through importable data', () => {
    const originalState = new GlobalState();
    const comparisonMonster = buildMonster('Abyssal demon');

    originalState.addComparisonMonsterSlot();
    originalState.updateComparisonMonsterSlot(originalState.comparisonMonsterSlots[0].id, comparisonMonster);

    const exported = originalState.asImportableData;

    expect(exported.comparisonMonsterSlots).toHaveLength(1);
    expect(exported.comparisonMonsterSlots?.[0].monster?.id).toBe(comparisonMonster.id);

    const rehydratedState = new GlobalState();
    rehydratedState.updateImportedData(exported);

    expect(rehydratedState.comparisonMonsterSlots).toHaveLength(1);
    expect(rehydratedState.comparisonMonsterSlots[0].monster?.id).toBe(comparisonMonster.id);
    expect(rehydratedState.comparisonMonsterSlots[0].monster?.inputs.monsterCurrentHp).toBe(comparisonMonster.inputs.monsterCurrentHp);
  });
});
