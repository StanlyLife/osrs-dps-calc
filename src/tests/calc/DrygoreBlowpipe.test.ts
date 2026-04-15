import { describe, expect, test } from '@jest/globals';
import PlayerVsNPCCalc from '@/lib/PlayerVsNPCCalc';
import { BurnImmunity } from '@/types/Monster';
import { findEquipment, getTestMonster, getTestPlayer } from '@/tests/utils/TestUtils';

describe('Drygore blowpipe burn', () => {
  test('adds expected burn against monsters that can be burned', () => {
    const monster = getTestMonster('Abyssal demon', 'Standard');
    const player = getTestPlayer(monster, {
      equipment: {
        weapon: findEquipment('Drygore blowpipe', 'Charged'),
      },
      style: {
        name: 'Rapid',
        type: 'ranged',
        stance: 'Rapid',
      },
      skills: {
        ranged: 99,
      },
    });

    const calc = new PlayerVsNPCCalc(player, monster);

    expect(calc.getDoTExpected()).toBeGreaterThan(0);
  });

  test('does not add burn against normal-burn-immune monsters', () => {
    const monster = getTestMonster('Abyssal demon', 'Standard', {
      immunities: {
        burn: BurnImmunity.NORMAL,
      },
    });
    const player = getTestPlayer(monster, {
      equipment: {
        weapon: findEquipment('Drygore blowpipe', 'Charged'),
      },
      style: {
        name: 'Rapid',
        type: 'ranged',
        stance: 'Rapid',
      },
      skills: {
        ranged: 99,
      },
    });

    const calc = new PlayerVsNPCCalc(player, monster);

    expect(calc.getDoTExpected()).toBe(0);
  });
});
