import { describe, expect, test } from '@jest/globals';
import PlayerVsNPCCalc from '@/lib/PlayerVsNPCCalc';
import { DetailKey } from '@/lib/CalcDetails';
import {
  calculatePlayerVsNpc,
  findEquipment,
  findResult,
  getTestMonster,
  getTestPlayer,
} from '@/tests/utils/TestUtils';

const getLeaguesEchoCalc = (weaponName: string, weaponVersion = '', ammoName?: string) => {
  const monster = getTestMonster('Abyssal demon', 'Standard');
  const player = getTestPlayer(monster, {
    equipment: {
      weapon: findEquipment(weaponName, weaponVersion),
      ...(ammoName ? { ammo: findEquipment(ammoName) } : {}),
    },
    leagues: {
      six: {
        effects: {
          talent_regen_ammo: 100,
          talent_ranged_regen_echo_chance: 25,
        },
      },
    },
  });

  return new PlayerVsNPCCalc(player, monster, { detailedOutput: true });
};

describe('Drygore Demonic Pacts', () => {
  test('keeps thrown echo max-hit behavior scoped to thrown pact weapons', () => {
    const monster = getTestMonster('Abyssal demon', 'Standard');
    const drygoreBase = calculatePlayerVsNpc(monster, getTestPlayer(monster, {
      equipment: {
        weapon: findEquipment('Drygore blowpipe', 'Charged'),
      },
      leagues: {
        six: {
          effects: {
            talent_regen_ammo: 100,
            talent_ranged_regen_echo_chance: 25,
          },
        },
      },
    }));
    const drygoreThrownPact = calculatePlayerVsNpc(monster, getTestPlayer(monster, {
      equipment: {
        weapon: findEquipment('Drygore blowpipe', 'Charged'),
      },
      leagues: {
        six: {
          effects: {
            talent_regen_ammo: 100,
            talent_ranged_regen_echo_chance: 25,
            talent_thrown_maxhit_echoes: 20,
          },
        },
      },
    }));

    const bowfaBase = calculatePlayerVsNpc(monster, getTestPlayer(monster, {
      equipment: {
        weapon: findEquipment('Bow of faerdhinen (c)'),
      },
      leagues: {
        six: {
          effects: {
            talent_regen_ammo: 100,
            talent_ranged_regen_echo_chance: 25,
          },
        },
      },
    }));
    const bowfaThrownPact = calculatePlayerVsNpc(monster, getTestPlayer(monster, {
      equipment: {
        weapon: findEquipment('Bow of faerdhinen (c)'),
      },
      leagues: {
        six: {
          effects: {
            talent_regen_ammo: 100,
            talent_ranged_regen_echo_chance: 25,
            talent_thrown_maxhit_echoes: 20,
          },
        },
      },
    }));

    expect(drygoreThrownPact.dps).toBeGreaterThan(drygoreBase.dps);
    expect(bowfaThrownPact.dps).toBe(bowfaBase.dps);
  });

  test('does not get bow-only echo accuracy', () => {
    const drygoreCalc = getLeaguesEchoCalc('Drygore blowpipe', 'Charged');
    drygoreCalc.player.leagues.six.effects.talent_bow_always_pass_accuracy = 1;
    drygoreCalc.getDps();

    const bowCalc = getLeaguesEchoCalc('Bow of faerdhinen (c)');
    bowCalc.player.leagues.six.effects.talent_bow_always_pass_accuracy = 1;
    bowCalc.getDps();

    expect(findResult(drygoreCalc.details, DetailKey.LEAGUES_ECHO_ACCURACY)).toBeCloseTo(
      findResult(drygoreCalc.details, DetailKey.PLAYER_ACCURACY_FINAL) as number,
    );
    expect(findResult(bowCalc.details, DetailKey.LEAGUES_ECHO_ACCURACY)).toBe(1);
  });

  test('does not get crossbow-only echo trigger chance', () => {
    const drygoreCalc = getLeaguesEchoCalc('Drygore blowpipe', 'Charged');
    drygoreCalc.player.leagues.six.effects.talent_crossbow_echo_reproc_chance = 15;
    drygoreCalc.getDps();

    const crossbowCalc = getLeaguesEchoCalc('Rune crossbow', '', 'Ruby bolts (e)');
    crossbowCalc.player.leagues.six.effects.talent_crossbow_echo_reproc_chance = 15;
    crossbowCalc.getDps();

    expect(findResult(drygoreCalc.details, DetailKey.LEAGUES_ECHO_CHANCE_TRIGGER)).toBeCloseTo(0.25);
    expect(findResult(crossbowCalc.details, DetailKey.LEAGUES_ECHO_CHANCE_TRIGGER)).toBeCloseTo(0.40);
  });
});
