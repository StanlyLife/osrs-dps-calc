import { findEquipment, getTestMonster, getTestPlayer } from '@/tests/utils/TestUtils';
import { describe, expect, test } from '@jest/globals';
import { calculateEquipmentBonusesFromGear } from '@/lib/Equipment';
import { Prayer } from '@/enums/Prayer';

describe('calculateEquipmentBonusesFromGear', () => {
  describe("with Dizana's quiver", () => {
    describe('with weapon using ammo slot', () => {
      test('applies bonus when charged', () => {
        const monster = getTestMonster('Abyssal demon', 'Standard');
        const playerWithChargedQuiver = getTestPlayer(monster, {
          equipment: {
            cape: findEquipment("Dizana's quiver", 'Charged'),
            weapon: findEquipment('Twisted bow'),
            ammo: findEquipment('Dragon arrow', 'Unpoisoned'),
          },
        });

        const bonuses = calculateEquipmentBonusesFromGear(playerWithChargedQuiver, monster);
        expect(bonuses.offensive.ranged).toStrictEqual(98);
        expect(bonuses.bonuses.ranged_str).toStrictEqual(84);
      });

      test('applies bonus when blessed', () => {
        const monster = getTestMonster('Abyssal demon', 'Standard');
        const playerWithChargedQuiver = getTestPlayer(monster, {
          equipment: {
            cape: findEquipment("Blessed dizana's quiver", 'Normal'),
            weapon: findEquipment('Twisted bow'),
            ammo: findEquipment('Dragon arrow', 'Unpoisoned'),
          },
          offensive: {
            ranged: 0,
          },
          bonuses: {
            ranged_str: 0,
          },
        });

        const bonuses = calculateEquipmentBonusesFromGear(playerWithChargedQuiver, monster);
        expect(bonuses.offensive.ranged).toStrictEqual(98);
        expect(bonuses.bonuses.ranged_str).toStrictEqual(84);
      });

      test('does not apply bonus when uncharged', () => {
        const monster = getTestMonster('Abyssal demon', 'Standard');
        const playerWithChargedQuiver = getTestPlayer(monster, {
          equipment: {
            cape: findEquipment("Dizana's quiver", 'Uncharged'),
            weapon: findEquipment('Twisted bow'),
            ammo: findEquipment('Dragon arrow', 'Unpoisoned'),
          },
          offensive: {
            ranged: 0,
          },
          bonuses: {
            ranged_str: 0,
          },
        });

        const bonuses = calculateEquipmentBonusesFromGear(playerWithChargedQuiver, monster);
        expect(bonuses.offensive.ranged).toStrictEqual(88);
        expect(bonuses.bonuses.ranged_str).toStrictEqual(83);
      });
    });
    describe('with weapon not using ammo slot', () => {
      test('does not apply bonus when charged', () => {
        const monster = getTestMonster('Abyssal demon', 'Standard');
        const playerWithChargedQuiver = getTestPlayer(monster, {
          equipment: {
            cape: findEquipment("Dizana's quiver", 'Charged'),
            weapon: findEquipment('Dragon dart'),
          },
        });

        const bonuses = calculateEquipmentBonusesFromGear(playerWithChargedQuiver, monster);
        expect(bonuses.offensive.ranged).toStrictEqual(18);
        expect(bonuses.bonuses.ranged_str).toStrictEqual(38);
      });

      test('does not apply bonus when blessed', () => {
        const monster = getTestMonster('Abyssal demon', 'Standard');
        const playerWithChargedQuiver = getTestPlayer(monster, {
          equipment: {
            cape: findEquipment("Blessed dizana's quiver", 'Normal'),
            weapon: findEquipment('Dragon dart'),
          },
          offensive: {
            ranged: 0,
          },
          bonuses: {
            ranged_str: 0,
          },
        });

        const bonuses = calculateEquipmentBonusesFromGear(playerWithChargedQuiver, monster);
        expect(bonuses.offensive.ranged).toStrictEqual(18);
        expect(bonuses.bonuses.ranged_str).toStrictEqual(38);
      });

      test('does not apply bonus when uncharged', () => {
        const monster = getTestMonster('Abyssal demon', 'Standard');
        const playerWithChargedQuiver = getTestPlayer(monster, {
          equipment: {
            cape: findEquipment("Dizana's quiver", 'Uncharged'),
            weapon: findEquipment('Dragon dart'),
          },
          offensive: {
            ranged: 0,
          },
          bonuses: {
            ranged_str: 0,
          },
        });

        const bonuses = calculateEquipmentBonusesFromGear(playerWithChargedQuiver, monster);
        expect(bonuses.offensive.ranged).toStrictEqual(18);
        expect(bonuses.bonuses.ranged_str).toStrictEqual(38);
      });
    });
  });

  describe('with demonic pact prayer scaling', () => {
    test('adds half worn prayer bonus to melee strength', () => {
      const monster = getTestMonster('Abyssal demon', 'Standard');
      const basePlayer = getTestPlayer(monster, {
        equipment: {
          neck: findEquipment('Amulet of fury'),
        },
        prayers: [Prayer.PIETY],
      });
      const pactPlayer = getTestPlayer(monster, {
        equipment: {
          neck: findEquipment('Amulet of fury'),
        },
        prayers: [Prayer.PIETY],
        leagues: {
          six: {
            effects: {
              talent_melee_strength_prayer_bonus: 1,
            },
          },
        },
      });

      const baseBonuses = calculateEquipmentBonusesFromGear(basePlayer, monster);
      const pactBonuses = calculateEquipmentBonusesFromGear(pactPlayer, monster);

      expect(pactBonuses.bonuses.prayer).toBe(baseBonuses.bonuses.prayer);
      expect(pactBonuses.bonuses.str - baseBonuses.bonuses.str).toBe(Math.trunc(baseBonuses.bonuses.prayer / 2));
    });

    test('treats Eclipse atlatl as a thrown weapon for thrown-weapon pacts', () => {
      const monster = getTestMonster('Abyssal demon', 'Standard');
      const basePlayer = getTestPlayer(monster, {
        equipment: {
          weapon: findEquipment('Eclipse atlatl'),
        },
      });
      const pactPlayer = getTestPlayer(monster, {
        equipment: {
          weapon: findEquipment('Eclipse atlatl'),
        },
        leagues: {
          six: {
            effects: {
              talent_thrown_weapon_accuracy: 1,
              talent_thrown_weapon_melee_str_scale: 1,
            },
          },
        },
      });

      const baseBonuses = calculateEquipmentBonusesFromGear(basePlayer, monster);
      const pactBonuses = calculateEquipmentBonusesFromGear(pactPlayer, monster);

      expect(pactBonuses.offensive.ranged - baseBonuses.offensive.ranged).toBe(60);
      expect(pactBonuses.bonuses.ranged_str - baseBonuses.bonuses.ranged_str)
        .toBe(Math.trunc(baseBonuses.bonuses.str * 0.80));
    });
  });
});
