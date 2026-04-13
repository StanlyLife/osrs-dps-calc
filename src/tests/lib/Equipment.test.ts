import { findEquipment, getTestMonster, getTestPlayer } from '@/tests/utils/TestUtils';
import { describe, expect, test } from '@jest/globals';
import { calculateEquipmentBonusesFromGear } from '@/lib/Equipment';

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

  describe('with Demonic Pact thrown weapon bonuses', () => {
    test('applies thrown accuracy and melee strength scaling to Drygore blowpipe', () => {
      const monster = getTestMonster('Abyssal demon', 'Standard');
      const equipment = {
        weapon: findEquipment('Drygore blowpipe', 'Charged'),
        neck: findEquipment('Amulet of strength'),
      };

      const basePlayer = getTestPlayer(monster, { equipment });
      const pactPlayer = getTestPlayer(monster, {
        equipment,
        leagues: {
          six: {
            effects: {
              talent_thrown_weapon_accuracy: 60,
              talent_thrown_weapon_melee_str_scale: 1,
            },
          },
        },
      });

      const baseBonuses = calculateEquipmentBonusesFromGear(basePlayer, monster);
      const pactBonuses = calculateEquipmentBonusesFromGear(pactPlayer, monster);

      expect(pactBonuses.offensive.ranged - baseBonuses.offensive.ranged).toBe(60);
      expect(pactBonuses.bonuses.ranged_str - baseBonuses.bonuses.ranged_str).toBe(
        Math.trunc(baseBonuses.bonuses.str * 0.80),
      );
    });

    test('treats Toxic and Drygore blowpipe the same for thrown equipment pacts', () => {
      const monster = getTestMonster('Abyssal demon', 'Standard');
      const drygoreBaseBonuses = calculateEquipmentBonusesFromGear(getTestPlayer(monster, {
        equipment: {
          weapon: findEquipment('Drygore blowpipe', 'Charged'),
          neck: findEquipment('Amulet of strength'),
        },
      }), monster);
      const drygoreBonuses = calculateEquipmentBonusesFromGear(getTestPlayer(monster, {
        equipment: {
          weapon: findEquipment('Drygore blowpipe', 'Charged'),
          neck: findEquipment('Amulet of strength'),
        },
        leagues: {
          six: {
            effects: {
              talent_thrown_weapon_accuracy: 60,
              talent_thrown_weapon_melee_str_scale: 1,
            },
          },
        },
      }), monster);
      const toxicBaseBonuses = calculateEquipmentBonusesFromGear(getTestPlayer(monster, {
        equipment: {
          weapon: findEquipment('Toxic blowpipe', 'Charged'),
          neck: findEquipment('Amulet of strength'),
        },
      }), monster);
      const toxicBonuses = calculateEquipmentBonusesFromGear(getTestPlayer(monster, {
        equipment: {
          weapon: findEquipment('Toxic blowpipe', 'Charged'),
          neck: findEquipment('Amulet of strength'),
        },
        leagues: {
          six: {
            effects: {
              talent_thrown_weapon_accuracy: 60,
              talent_thrown_weapon_melee_str_scale: 1,
            },
          },
        },
      }), monster);

      expect(drygoreBonuses.offensive.ranged - drygoreBaseBonuses.offensive.ranged).toBe(
        toxicBonuses.offensive.ranged - toxicBaseBonuses.offensive.ranged,
      );
      expect(drygoreBonuses.bonuses.ranged_str - drygoreBaseBonuses.bonuses.ranged_str).toBe(
        toxicBonuses.bonuses.ranged_str - toxicBaseBonuses.bonuses.ranged_str,
      );
    });
  });
});
