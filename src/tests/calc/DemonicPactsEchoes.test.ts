import { describe, expect, test } from '@jest/globals';
import PlayerVsNPCCalc from '@/lib/PlayerVsNPCCalc';
import { findEquipment, getTestMonster, getTestPlayer } from '@/tests/utils/TestUtils';
import { getCombatStylesForCategory } from '@/utils';
import { EquipmentCategory } from '@/enums/EquipmentCategory';
import { Prayer } from '@/enums/Prayer';

const getBaseEchoEffects = () => ({
  talent_regen_ammo: 55,
  talent_ranged_regen_echo_chance: 25,
  talent_distance_melee_minhit: 3,
  talent_bow_always_pass_accuracy: 1,
  talent_crossbow_echo_reproc_chance: 15,
  talent_thrown_maxhit_echoes: 20,
  talent_free_random_weapon_attack_chance: 15,
  talent_melee_range_multiplier: 2,
  talent_defence_boost: 10,
  talent_all_style_accuracy: 135,
  talent_max_accuracy_roll_from_range: 1,
  talent_restore_sa_energy_from_distance: 1,
  talent_percentage_ranged_damage: 1,
  talent_percentage_melee_damage: 5,
  talent_ranged_echo_cyclical: 1,
  talent_unique_blindbag_chance: 1,
  talent_overheal_consumption_boost: 1,
  talent_melee_distance_healing_chance: 20,
  talent_percentage_melee_maxhit_distance: 4,
  talent_melee_strength_prayer_bonus: 1,
  talent_unique_blindbag_damage: 2,
  talent_melee_range_conditional_boost: 1,
  talent_multi_hit_str_increase: 1,
  talent_2h_melee_echos: 1,
});

describe('demonic pact melee echoes', () => {
  test('keeps halberd echoes near the Jagex reference output', () => {
    const monster = getTestMonster('Gemstone Crab', '', { skills: { def: 0 } });
    const player = getTestPlayer(monster, {
      equipment: {
        head: findEquipment('Torva full helm'),
        cape: findEquipment('Infernal cape'),
        neck: findEquipment('Amulet of rancour'),
        weapon: findEquipment('Noxious halberd'),
        body: findEquipment('Torva platebody'),
        legs: findEquipment('Torva platelegs'),
        hands: findEquipment('Ferocious gloves'),
        feet: findEquipment('Avernic treads'),
        ring: findEquipment('Ultor ring'),
      },
      style: getCombatStylesForCategory(EquipmentCategory.POLEARM)[1],
      boosts: {
        atk: 19,
        str: 19,
      },
      prayers: [Prayer.PIETY],
      leagues: {
        six: {
          distanceToEnemy: 7,
          blindbagWeapons: [
            findEquipment('Holy scythe of vitur', 'Charged'),
            findEquipment('Holy scythe of vitur', 'Uncharged'),
            findEquipment('Sanguine scythe of vitur', 'Charged'),
            findEquipment('Sanguine scythe of vitur', 'Uncharged'),
            findEquipment('Scythe of vitur', 'Charged'),
          ],
          effects: getBaseEchoEffects(),
        },
      },
    });

    const calc = new PlayerVsNPCCalc(player, monster);

    expect(calc.getDps()).toBeGreaterThan(35);
    expect(calc.getDps()).toBeLessThan(36.5);
  });

  test('matches the scythe two-handed echo reference', () => {
    const monster = getTestMonster('Gemstone Crab', '', { skills: { def: 0 } });
    const player = getTestPlayer(monster, {
      equipment: {
        head: findEquipment('Torva full helm'),
        cape: findEquipment('Infernal cape'),
        neck: findEquipment('Amulet of rancour'),
        weapon: findEquipment('Scythe of vitur', 'Charged'),
        body: findEquipment('Torva platebody'),
        legs: findEquipment('Torva platelegs'),
        hands: findEquipment('Ferocious gloves'),
        feet: findEquipment('Avernic treads'),
        ring: findEquipment('Ultor ring'),
      },
      style: getCombatStylesForCategory(EquipmentCategory.SCYTHE)[1],
      boosts: {
        atk: 19,
        str: 19,
      },
      prayers: [Prayer.PIETY],
      leagues: {
        six: {
          distanceToEnemy: 2,
          blindbagWeapons: [
            findEquipment('Holy scythe of vitur', 'Charged'),
            findEquipment('Holy scythe of vitur', 'Uncharged'),
            findEquipment('Sanguine scythe of vitur', 'Charged'),
            findEquipment('Sanguine scythe of vitur', 'Uncharged'),
            findEquipment('Scythe of vitur', 'Uncharged'),
          ],
          effects: getBaseEchoEffects(),
        },
      },
    });

    const calc = new PlayerVsNPCCalc(player, monster);

    expect(calc.getDps()).toBeCloseTo(35.59, 1);
  });
});
