import { describe, expect, test } from "@jest/globals";
import {
  calculatePlayerVsNpc,
  findEquipment,
  findEquipmentById,
  getTestMonster,
  getTestPlayer,
} from "@/tests/utils/TestUtils";
import { DetailKey } from "@/lib/CalcDetails";
import { Prayer } from "@/enums/Prayer";
import { PartialDeep } from "type-fest";
import { Player } from "@/types/Player";

describe("Prayers", () => {
  const monster = getTestMonster("Abyssal demon", "Standard");

  describe("Burst of Strength", () => {
    const basePlayer: PartialDeep<Player> = {
      prayers: [Prayer.BURST_OF_STRENGTH],
    };

    test("level 10 strength", () => {
      const player = getTestPlayer(monster, {
        ...basePlayer,
        skills: { str: 10 },
      });
      const { details } = calculatePlayerVsNpc(monster, player);
      expect(
        details.find((d) => d.label === DetailKey.DAMAGE_LEVEL_PRAYER)?.value,
      ).toBe(11);
    });

    test("level 99 strength", () => {
      const player = getTestPlayer(monster, {
        ...basePlayer,
        skills: { str: 99 },
      });
      const { details } = calculatePlayerVsNpc(monster, player);
      expect(
        details.find((d) => d.label === DetailKey.DAMAGE_LEVEL_PRAYER)?.value,
      ).toBe(103);
    });
  });

  describe("Sharp Eye", () => {
    const basePlayer: PartialDeep<Player> = {
      prayers: [Prayer.SHARP_EYE],
      equipment: {
        weapon: findEquipmentById(21902),
        ammo: findEquipmentById(21905),
      },
      style: {
        name: "Rapid",
        type: "ranged",
        stance: "Rapid",
      },
    };

    test("level 10 ranged", () => {
      const player = getTestPlayer(monster, {
        ...basePlayer,
        skills: { ranged: 10 },
      });
      const { details } = calculatePlayerVsNpc(monster, player);
      expect(
        details.find((d) => d.label === DetailKey.DAMAGE_LEVEL_PRAYER)?.value,
      ).toBe(11);
    });

    test("level 99 ranged", () => {
      const player = getTestPlayer(monster, {
        ...basePlayer,
        skills: { ranged: 99 },
      });
      const { details } = calculatePlayerVsNpc(monster, player);
      expect(
        details.find((d) => d.label === DetailKey.DAMAGE_LEVEL_PRAYER)?.value,
      ).toBe(103);
    });
  });

  describe("buffed ranged prayers", () => {
    const basePlayer: PartialDeep<Player> = {
      prayers: [Prayer.EAGLE_EYE],
      equipment: {
        weapon: findEquipmentById(21902),
        ammo: findEquipmentById(21905),
      },
      style: {
        name: "Rapid",
        type: "ranged",
        stance: "Rapid",
      },
      skills: {
        ranged: 99,
      },
    };

    test("increases ranged prayer-derived levels", () => {
      const baseDetails = calculatePlayerVsNpc(
        monster,
        getTestPlayer(monster, basePlayer),
      ).details;
      const buffedDetails = calculatePlayerVsNpc(
        monster,
        getTestPlayer(monster, {
          ...basePlayer,
          leagues: {
            six: {
              effects: {
                talent_buffed_ranged_prayers: 1,
              },
            },
          },
        }),
      ).details;

      expect(
        baseDetails.find(
          (d) => d.label === DetailKey.PLAYER_ACCURACY_LEVEL_PRAYER,
        )?.value,
      ).toBe(113);
      expect(
        baseDetails.find((d) => d.label === DetailKey.DAMAGE_LEVEL_PRAYER)
          ?.value,
      ).toBe(113);
      expect(
        buffedDetails.find(
          (d) => d.label === DetailKey.PLAYER_ACCURACY_LEVEL_PRAYER,
        )?.value,
      ).toBe(117);
      expect(
        buffedDetails.find((d) => d.label === DetailKey.DAMAGE_LEVEL_PRAYER)
          ?.value,
      ).toBe(117);
    });
  });

  describe("enemy protection prayers", () => {
    const basePlayer: PartialDeep<Player> = {
      equipment: {
        cape: findEquipment("Dizana's quiver", "Charged"),
        weapon: findEquipment("Twisted bow"),
        ammo: findEquipment("Dragon arrow", "Unpoisoned"),
      },
      style: {
        name: "Rapid",
        type: "ranged",
        stance: "Rapid",
      },
      skills: {
        ranged: 99,
      },
    };

    test("prayer penetration lets ranged damage pass through ranged protection prayers", () => {
      const unprotected = calculatePlayerVsNpc(
        monster,
        getTestPlayer(monster, basePlayer),
      );
      const protectedTarget = calculatePlayerVsNpc(
        monster,
        getTestPlayer(monster, {
          ...basePlayer,
          leagues: {
            six: {
              enemyPrayers: {
                ranged: true,
              },
            },
          },
        }),
      );
      const penetratedTarget = calculatePlayerVsNpc(
        monster,
        getTestPlayer(monster, {
          ...basePlayer,
          leagues: {
            six: {
              enemyPrayers: {
                ranged: true,
              },
              effects: {
                talent_prayer_pen_all: 25,
              },
            },
          },
        }),
      );

      expect(unprotected.maxHit).toBeGreaterThan(0);
      expect(protectedTarget.maxHit).toBe(0);
      expect(protectedTarget.dps).toBe(0);
      expect(penetratedTarget.maxHit).toBe(
        Math.trunc(unprotected.maxHit * 0.25),
      );
      expect(penetratedTarget.dps).toBeGreaterThan(0);
    });
  });
});
