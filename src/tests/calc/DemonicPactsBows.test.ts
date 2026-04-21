import { describe, expect, test } from '@jest/globals';
import PlayerVsNPCCalc from '@/lib/PlayerVsNPCCalc';
import { EquipmentCategory } from '@/enums/EquipmentCategory';
import { getCombatStylesForCategory } from '@/utils';
import {
  findEquipment,
  findEquipmentById,
  getTestMonster,
  getTestPlayer,
} from '@/tests/utils/TestUtils';

describe('demonic pact bow repeat-hit stacks', () => {
  test('caps bow max-hit stacks at 15% of base max hit', () => {
    const monster = getTestMonster('Abyssal demon', 'Standard');
    const basePlayer = getTestPlayer(monster, {
      equipment: {
        weapon: findEquipment('Bow of faerdhinen'),
      },
      style: getCombatStylesForCategory(EquipmentCategory.BOW)[1],
      skills: {
        ranged: 99,
      },
    });
    const baseCalc = new PlayerVsNPCCalc(basePlayer, monster);
    const [, baseMaxHit] = baseCalc.getMinAndMax();

    const stackedPlayer = getTestPlayer(monster, {
      equipment: {
        weapon: findEquipment('Bow of faerdhinen'),
      },
      style: getCombatStylesForCategory(EquipmentCategory.BOW)[1],
      skills: {
        ranged: 99,
      },
      leagues: {
        six: {
          bowHitStacks: 999,
          effects: {
            talent_bow_max_hit_stacking_increase: 1,
          },
        },
      },
    });

    const stackedCalc = new PlayerVsNPCCalc(stackedPlayer, monster);
    const [, stackedMaxHit] = stackedCalc.getMinAndMax();

    expect(stackedMaxHit).toBe(
      baseMaxHit + Math.trunc((baseMaxHit * 15) / 100),
    );
  });

  test('applies current bow stacks to min-hit bonus for bows', () => {
    const monster = getTestMonster('Abyssal demon', 'Standard');
    const basePlayer = getTestPlayer(monster, {
      equipment: {
        weapon: findEquipment('Bow of faerdhinen'),
      },
      style: getCombatStylesForCategory(EquipmentCategory.BOW)[1],
      skills: {
        ranged: 99,
      },
    });
    const baseCalc = new PlayerVsNPCCalc(basePlayer, monster);
    const [, baseMaxHit] = baseCalc.getMinAndMax();

    const player = getTestPlayer(monster, {
      equipment: {
        weapon: findEquipment('Bow of faerdhinen'),
      },
      style: getCombatStylesForCategory(EquipmentCategory.BOW)[1],
      skills: {
        ranged: 99,
      },
      leagues: {
        six: {
          bowHitStacks: 3,
          effects: {
            talent_bow_min_hit_stacking_increase: 1,
          },
        },
      },
    });

    const calc = new PlayerVsNPCCalc(player, monster);
    const [minHit, maxHit] = calc.getMinAndMax();

    expect(minHit).toBe(3);
    expect(maxHit).toBe(baseMaxHit);
  });

  test('does not apply repeat-hit bow stacks to non-bow ranged weapons', () => {
    const monster = getTestMonster('Abyssal demon', 'Standard');
    const basePlayer = getTestPlayer(monster, {
      equipment: {
        weapon: findEquipment('Rune crossbow'),
        ammo: findEquipmentById(9144),
      },
      style: getCombatStylesForCategory(EquipmentCategory.CROSSBOW)[1],
      skills: {
        ranged: 99,
      },
    });
    const baseCalc = new PlayerVsNPCCalc(basePlayer, monster);

    const stackedPlayer = getTestPlayer(monster, {
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
          bowHitStacks: 99,
          effects: {
            talent_bow_min_hit_stacking_increase: 1,
            talent_bow_max_hit_stacking_increase: 1,
          },
        },
      },
    });
    const stackedCalc = new PlayerVsNPCCalc(stackedPlayer, monster);

    expect(stackedCalc.getMinAndMax()).toStrictEqual(baseCalc.getMinAndMax());
  });

  test('does not apply repeat-hit bow stacks to Eclipse atlatl', () => {
    const monster = getTestMonster('Abyssal demon', 'Standard');
    const basePlayer = getTestPlayer(monster, {
      equipment: {
        weapon: findEquipment('Eclipse atlatl'),
      },
      style: getCombatStylesForCategory(EquipmentCategory.BOW)[1],
      skills: {
        ranged: 99,
      },
    });
    const baseCalc = new PlayerVsNPCCalc(basePlayer, monster);

    const stackedPlayer = getTestPlayer(monster, {
      equipment: {
        weapon: findEquipment('Eclipse atlatl'),
      },
      style: getCombatStylesForCategory(EquipmentCategory.BOW)[1],
      skills: {
        ranged: 99,
      },
      leagues: {
        six: {
          bowHitStacks: 99,
          effects: {
            talent_bow_min_hit_stacking_increase: 1,
            talent_bow_max_hit_stacking_increase: 1,
          },
        },
      },
    });
    const stackedCalc = new PlayerVsNPCCalc(stackedPlayer, monster);

    expect(stackedCalc.getMinAndMax()).toStrictEqual(baseCalc.getMinAndMax());
  });
});
