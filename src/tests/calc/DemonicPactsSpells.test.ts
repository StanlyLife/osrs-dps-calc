import { describe, expect, test } from "@jest/globals";
import PlayerVsNPCCalc from "@/lib/PlayerVsNPCCalc";
import { BurnImmunity } from "@/types/Monster";
import {
  findEquipment,
  findEquipmentById,
  findSpell,
  getTestMonster,
  getTestPlayer,
} from "@/tests/utils/TestUtils";

describe("demonic pact elemental spells", () => {
  test("adds expected burn for fire spells", () => {
    const monster = getTestMonster("Abyssal demon", "Standard");
    const basePlayer = getTestPlayer(monster, {
      spell: findSpell("Fire Bolt"),
      style: {
        name: "Spell",
        type: "magic",
        stance: "Manual Cast",
      },
      skills: {
        magic: 99,
      },
    });
    const pactPlayer = getTestPlayer(monster, {
      spell: findSpell("Fire Bolt"),
      style: {
        name: "Spell",
        type: "magic",
        stance: "Manual Cast",
      },
      skills: {
        magic: 99,
      },
      leagues: {
        six: {
          effects: {
            talent_fire_spell_burn_bounce: 1,
          },
        },
      },
    });

    expect(new PlayerVsNPCCalc(basePlayer, monster).getDoTExpected()).toBe(0);
    expect(
      new PlayerVsNPCCalc(pactPlayer, monster).getDoTExpected(),
    ).toBeGreaterThan(0);
  });

  test("treats blood spells as fire when the pact conversion is active", () => {
    const monster = getTestMonster("Abyssal demon", "Standard");
    const withoutConversion = getTestPlayer(monster, {
      spell: findSpell("Blood Blitz"),
      style: {
        name: "Spell",
        type: "magic",
        stance: "Manual Cast",
      },
      skills: {
        magic: 99,
      },
      leagues: {
        six: {
          effects: {
            talent_fire_spell_burn_bounce: 1,
          },
        },
      },
    });
    const withConversion = getTestPlayer(monster, {
      spell: findSpell("Blood Blitz"),
      style: {
        name: "Spell",
        type: "magic",
        stance: "Manual Cast",
      },
      skills: {
        magic: 99,
      },
      leagues: {
        six: {
          effects: {
            talent_fire_spell_burn_bounce: 1,
            talent_blood_counts_as_fire: 1,
          },
        },
      },
    });

    expect(
      new PlayerVsNPCCalc(withoutConversion, monster).getDoTExpected(),
    ).toBe(0);
    expect(
      new PlayerVsNPCCalc(withConversion, monster).getDoTExpected(),
    ).toBeGreaterThan(0);
  });

  test("does not add fire spell burn against burn-immune monsters", () => {
    const monster = getTestMonster("Abyssal demon", "Standard", {
      immunities: {
        burn: BurnImmunity.NORMAL,
      },
    });
    const player = getTestPlayer(monster, {
      spell: findSpell("Fire Bolt"),
      style: {
        name: "Spell",
        type: "magic",
        stance: "Manual Cast",
      },
      skills: {
        magic: 99,
      },
      leagues: {
        six: {
          effects: {
            talent_fire_spell_burn_bounce: 1,
          },
        },
      },
    });

    expect(new PlayerVsNPCCalc(player, monster).getDoTExpected()).toBe(0);
  });

  test("does not apply the water high-hp bonus to King's barrage when ice counts as water", () => {
    const monster = getTestMonster("Abyssal demon", "Standard");
    const basePlayer = getTestPlayer(monster, {
      equipment: {
        weapon: findEquipment("King's barrage"),
        ammo: findEquipmentById(9144),
      },
      skills: {
        ranged: 99,
        hp: 99,
      },
    });
    const noConversionPlayer = getTestPlayer(monster, {
      equipment: {
        weapon: findEquipment("King's barrage"),
        ammo: findEquipmentById(9144),
      },
      skills: {
        ranged: 99,
        hp: 99,
      },
      leagues: {
        six: {
          effects: {
            talent_water_spell_damage_high_hp: 1,
          },
        },
      },
    });
    const convertedPlayer = getTestPlayer(monster, {
      equipment: {
        weapon: findEquipment("King's barrage"),
        ammo: findEquipmentById(9144),
      },
      skills: {
        ranged: 99,
        hp: 99,
      },
      leagues: {
        six: {
          effects: {
            talent_water_spell_damage_high_hp: 1,
            talent_ice_counts_as_water: 1,
          },
        },
      },
    });

    const baseExpected = new PlayerVsNPCCalc(basePlayer, monster)
      .getDistribution()
      .getExpectedDamage();
    const noConversionExpected = new PlayerVsNPCCalc(
      noConversionPlayer,
      monster,
    )
      .getDistribution()
      .getExpectedDamage();
    const convertedExpected = new PlayerVsNPCCalc(convertedPlayer, monster)
      .getDistribution()
      .getExpectedDamage();

    const getMaxKingBarragePair = (
      player: Parameters<typeof getTestPlayer>[1],
    ) => {
      const calc = new PlayerVsNPCCalc(getTestPlayer(monster, player), monster);
      return calc
        .getDistribution()
        .zipped.hits.reduce((best, current) =>
          current.getSum() > best.getSum() ? current : best,
        );
    };

    const basePair = getMaxKingBarragePair({
      equipment: {
        weapon: findEquipment("King's barrage"),
        ammo: findEquipmentById(9144),
      },
      skills: {
        ranged: 99,
        hp: 99,
      },
    });
    const convertedPair = getMaxKingBarragePair({
      equipment: {
        weapon: findEquipment("King's barrage"),
        ammo: findEquipmentById(9144),
      },
      skills: {
        ranged: 99,
        hp: 99,
      },
      leagues: {
        six: {
          effects: {
            talent_water_spell_damage_high_hp: 1,
            talent_ice_counts_as_water: 1,
          },
        },
      },
    });

    expect(noConversionExpected).toBe(baseExpected);
    expect(convertedExpected).toBe(baseExpected);
    expect(convertedPair.hitsplats[0].damage).toBe(
      basePair.hitsplats[0].damage,
    );
    expect(convertedPair.hitsplats[1].damage).toBe(
      basePair.hitsplats[1].damage,
    );
  });
});
