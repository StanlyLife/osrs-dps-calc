import { describe, expect, test } from '@jest/globals';
import PlayerVsNPCCalc from '@/lib/PlayerVsNPCCalc';
import { findSpell, getTestMonster, getTestPlayer } from '@/tests/utils/TestUtils';
import { Prayer } from '@/enums/Prayer';

describe('getPrayerTicks', () => {
  test('no prayers lasts forever', () => {
    const m = getTestMonster('Abyssal demon', 'Standard');
    const p = getTestPlayer(m, {
      bonuses: {
        prayer: 0,
      },
      prayers: [],
    });
    const calc = new PlayerVsNPCCalc(p, m);

    expect(calc.getPrayerTicks()).toBe(Infinity);
    expect(calc.getPrayerDuration()).toBe(Infinity);
  });

  test('0 prayer bonus 99 prayer piety', () => {
    const m = getTestMonster('Abyssal demon', 'Standard');
    const p = getTestPlayer(m, {
      bonuses: {
        prayer: 0,
      },
      prayers: [
        Prayer.PIETY,
      ],
    });
    const calc = new PlayerVsNPCCalc(p, m);

    expect(calc.getPrayerTicks()).toBe(248);
    expect(calc.getPrayerDuration()).toBeCloseTo(148.8);
  });

  test('30 prayer 99 prayer bonus piety', () => {
    const m = getTestMonster('Abyssal demon', 'Standard');
    const p = getTestPlayer(m, {
      bonuses: {
        prayer: 30,
      },
      prayers: [
        Prayer.PIETY,
      ],
    });
    const calc = new PlayerVsNPCCalc(p, m);

    expect(calc.getPrayerTicks()).toBe(495);
    expect(calc.getPrayerDuration()).toBeCloseTo(297);
  });

  test('15 prayer bonus 99 prayer steel skin and superhuman strength and improved reflexes', () => {
    const m = getTestMonster('Abyssal demon', 'Standard');
    const p = getTestPlayer(m, {
      bonuses: {
        prayer: 15,
      },
      prayers: [
        Prayer.STEEL_SKIN,
        Prayer.SUPERHUMAN_STRENGTH,
        Prayer.IMPROVED_REFLEXES,
      ],
    });
    const calc = new PlayerVsNPCCalc(p, m);

    expect(calc.getPrayerTicks()).toBe(372);
    expect(calc.getPrayerDuration()).toBeCloseTo(223.2);
  });

  test('demonic pact no-overhead prayer restore extends duration', () => {
    const m = getTestMonster('Abyssal demon', 'Standard');
    const p = getTestPlayer(m, {
      bonuses: {
        prayer: 14,
      },
      prayers: [
        Prayer.PIETY,
      ],
      leagues: {
        six: {
          effects: {
            talent_prayer_restore_no_overhead: 1,
          },
        },
      },
    });
    const calc = new PlayerVsNPCCalc(p, m);

    expect(calc.getPrayerTicks()).toBe(506);
    expect(calc.getPrayerDuration()).toBeCloseTo(303.6);
  });

  test('demonic pact no-overhead prayer restore does not apply with protection prayers active', () => {
    const m = getTestMonster('Abyssal demon', 'Standard');
    const p = getTestPlayer(m, {
      bonuses: {
        prayer: 14,
      },
      prayers: [
        Prayer.PROTECT_MELEE,
      ],
      leagues: {
        six: {
          effects: {
            talent_prayer_restore_no_overhead: 1,
          },
        },
      },
    });
    const calc = new PlayerVsNPCCalc(p, m);

    expect(calc.getPrayerTicks()).toBe(726);
    expect(calc.getPrayerDuration()).toBeCloseTo(435.6);
  });

  test('demonic pact air rune regeneration can restore prayer while casting', () => {
    const m = getTestMonster('Abyssal demon', 'Standard');
    const p = getTestPlayer(m, {
      attackSpeed: 5,
      prayers: [
        Prayer.PIETY,
      ],
      spell: findSpell('Fire Strike'),
      style: {
        name: 'Manual Cast',
        type: 'magic',
        stance: 'Manual Cast',
      },
      leagues: {
        six: {
          effects: {
            talent_regen_ammo: 100,
            talent_airrune_regen_prayer_restore: 15,
          },
        },
      },
    });
    const calc = new PlayerVsNPCCalc(p, m);

    expect(calc.getPrayerTicks()).toBe(292);
    expect(calc.getPrayerDuration()).toBeCloseTo(175.2);
  });
});
