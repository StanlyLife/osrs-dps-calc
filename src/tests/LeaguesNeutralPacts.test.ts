import { describe, expect, test } from '@jest/globals';
import { runInAction } from 'mobx';
import PlayerVsNPCCalc from '@/lib/PlayerVsNPCCalc';
import { GlobalState } from '@/state';
import { EquipmentCategory } from '@/enums/EquipmentCategory';
import { getCombatStylesForCategory } from '@/utils';
import {
  findEquipment,
  findEquipmentById,
  getTestMonster,
  getTestPlayer,
} from '@/tests/utils/TestUtils';

const buildRangedCalc = (accuracyBonus: number) => {
  const monster = getTestMonster('Abyssal demon', 'Standard');
  const player = getTestPlayer(monster, {
    equipment: {
      weapon: findEquipment('Rune crossbow'),
      ammo: findEquipmentById(9144),
    },
    style: getCombatStylesForCategory(EquipmentCategory.CROSSBOW)[1],
    skills: {
      ranged: 99,
    },
    leagues: {
      six: {
        effects:
          accuracyBonus > 0 ? { talent_all_style_accuracy: accuracyBonus } : {},
      },
    },
  });

  return new PlayerVsNPCCalc(player, monster);
};

describe('leagues neutral pact buffs', () => {
  test('damage pacts contribute a displayed +10% all-style accuracy bonus', () => {
    const store = new GlobalState();
    store.prefs.manualMode = true;
    runInAction(() => {
      store.player.leagues.six.selectedNodeIds = new Set(['node1', 'node67']);
    });

    store.recalculateLeaguesEffects();

    expect(
      store.player.leagues.six.effects.talent_percentage_magic_damage,
    ).toBe(1);
    expect(store.player.leagues.six.effects.talent_all_style_accuracy).toBe(10);
    expect(
      store.currentEffects.get('talent_all_style_accuracy')?.values,
    ).toStrictEqual([10]);
  });

  test('small and big accuracy pacts use the updated 25/50 values in calculations', () => {
    const store = new GlobalState();
    store.prefs.manualMode = true;
    runInAction(() => {
      store.player.leagues.six.selectedNodeIds = new Set([
        'node1',
        'node7',
        'node11',
        'node67',
      ]);
    });

    store.recalculateLeaguesEffects();

    expect(store.player.leagues.six.effects.talent_all_style_accuracy).toBe(85);
    expect(
      [
        ...(store.currentEffects.get('talent_all_style_accuracy')?.values
          ?? []),
      ].sort((a, b) => Number(a) - Number(b)),
    ).toStrictEqual([10, 25, 50]);

    const baseCalc = buildRangedCalc(0);
    const buffedCalc = buildRangedCalc(
      store.player.leagues.six.effects.talent_all_style_accuracy ?? 0,
    );

    expect(buffedCalc.getMaxAttackRoll()).toBe(
      Math.trunc((baseCalc.getMaxAttackRoll() * 185) / 100),
    );
  });
});
