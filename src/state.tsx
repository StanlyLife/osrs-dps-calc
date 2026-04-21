// noinspection FallThroughInSwitchStatementJS

import {
  autorun,
  IReactionDisposer,
  IReactionPublic,
  makeAutoObservable,
  reaction,
  toJS,
} from "mobx";
import React, { createContext, useContext } from "react";
import { PartialDeep } from "type-fest";
import * as localforage from "localforage";
import merge from "lodash.mergewith";
import { toast } from "react-toastify";
import {
  CalculatedLoadout,
  Calculator,
  ComparisonMonsterSlot,
  IMPORT_VERSION,
  ImportableData,
  Preferences,
  State,
  UI,
  UserIssue,
} from "@/types/State";
import {
  EquipmentPiece,
  LeagueRegion,
  Player,
  PlayerEquipment,
  PlayerSkills,
} from "@/types/Player";
import { Monster } from "@/types/Monster";
import { MonsterAttribute } from "@/enums/MonsterAttribute";
import {
  fetchPlayerSkills,
  fetchShortlinkData,
  getCombatStylesForCategory,
  isDefined,
  PotionMap,
} from "@/utils";
import {
  ComputeBasicRequest,
  WorkerRequestType,
} from "@/worker/CalcWorkerTypes";
import { getMonsters, INITIAL_MONSTER_INPUTS } from "@/lib/Monsters";
import {
  availableEquipment,
  calculateEquipmentBonusesFromGear,
} from "@/lib/Equipment";
import { CalcWorker } from "@/worker/CalcWorker";
import { spellByName } from "@/types/Spell";
import { DEFAULT_ATTACK_SPEED, NUMBER_OF_LOADOUTS } from "@/lib/constants";
import {
  dbrowDefinitions,
  LeaguesEffect,
  rootNode,
} from "@/app/components/player/demonicPactsLeague/parse_skill_tree_elements";
import { EquipmentCategory } from "./enums/EquipmentCategory";
import {
  ARM_PRAYERS,
  BRAIN_PRAYERS,
  DEFENSIVE_PRAYERS,
  OFFENSIVE_PRAYERS,
  OVERHEAD_PRAYERS,
  Prayer,
} from "./enums/Prayer";
import Potion from "./enums/Potion";

const EMPTY_CALC_LOADOUT = {} as CalculatedLoadout;

const generateDefaultMonster = (): Monster => {
  const defaultMonster = getMonsters().find(
    (monster) => monster.name === "Gemstone Crab",
  );

  if (!defaultMonster) {
    throw new Error("Default monster Gemstone Crab was not found");
  }

  return {
    ...defaultMonster,
    inputs: {
      ...INITIAL_MONSTER_INPUTS,
      monsterCurrentHp: defaultMonster.skills.hp,
    },
  };
};

const resolveImportedMonster = (monster: Monster): PartialDeep<Monster> => {
  if (monster.id <= -1) {
    return monster;
  }

  const monstersById = getMonsters().filter((entry) => entry.id === monster.id);
  if ((monstersById?.length || 0) === 0) {
    throw new Error(
      `Failed to find monster by id '${monster.id}' from imported data`,
    );
  }

  if (monstersById.length === 1) {
    return monstersById[0];
  }

  return (
    monstersById.find((entry) => entry.version === monster.version) ||
    monstersById[0]
  );
};

const generateInitialEquipment = () => {
  const initialEquipment: PlayerEquipment = {
    ammo: null,
    body: null,
    cape: null,
    feet: null,
    hands: null,
    head: null,
    legs: null,
    neck: null,
    ring: null,
    shield: null,
    weapon: null,
  };
  return initialEquipment;
};

export const generateEmptyPlayer = (name?: string): Player => ({
  name: name ?? "Loadout 1",
  style: getCombatStylesForCategory(EquipmentCategory.NONE)[0],
  skills: {
    atk: 99,
    def: 99,
    hp: 99,
    magic: 99,
    prayer: 99,
    ranged: 99,
    str: 99,
    mining: 99,
    herblore: 99,
  },
  boosts: {
    atk: 0,
    def: 0,
    hp: 0,
    magic: 0,
    prayer: 0,
    ranged: 0,
    str: 0,
    mining: 0,
    herblore: 0,
  },
  equipment: generateInitialEquipment(),
  attackSpeed: DEFAULT_ATTACK_SPEED,
  prayers: [],
  bonuses: {
    str: 0,
    ranged_str: 0,
    magic_str: 0,
    prayer: 0,
  },
  defensive: {
    stab: 0,
    slash: 0,
    crush: 0,
    magic: 0,
    ranged: 0,
  },
  offensive: {
    stab: 0,
    slash: 0,
    crush: 0,
    magic: 0,
    ranged: 0,
  },
  buffs: {
    potions: [],
    onSlayerTask: true,
    inWilderness: false,
    kandarinDiary: true,
    chargeSpell: false,
    markOfDarknessSpell: false,
    forinthrySurge: false,
    soulreaperStacks: 0,
    baAttackerLevel: 0,
    chinchompaDistance: 4, // 4 tiles is the optimal range for "medium fuse" (rapid), which is the default selected stance
    usingSunfireRunes: false,
  },
  spell: null,
  leagues: {
    six: {
      selectedNodeIds: new Set<string>(["node1"]),
      effects: {},
      regions: [],
      bowHitStacks: 0,
      minionEnabled: false,
      minionZamorakItemCount: 0,
      distanceToEnemy: 1,
      enemyPrayers: {
        melee: false,
        ranged: false,
        magic: false,
      },
      blindbagWeapons: [],
      regenerateMagicBonus: 0,
      cullingSpree: false,
    },
  },
});

export const parseLoadoutsFromImportedData = (data: ImportableData) =>
  data.loadouts.map((loadout, i) => {
    const legacyRegion = (
      loadout.leagues?.six as { region?: LeagueRegion | null } | undefined
    )?.region;
    if (loadout.leagues?.six && !Array.isArray(loadout.leagues.six.regions)) {
      loadout.leagues.six.regions = legacyRegion ? [legacyRegion] : [];
    }

    // For each item, reload the most current data using the item ID to ensure we're not using stale data.
    if (loadout.equipment) {
      for (const [k, v] of Object.entries(loadout.equipment)) {
        if (v === null) continue;
        let item: EquipmentPiece | undefined;
        if (Object.hasOwn(v, "id")) {
          item = availableEquipment.find((eq) => eq.id === v.id);
          if (item) {
            // include the hidden itemVars inputs that are not present on the availableEquipment store
            if (Object.hasOwn(v, "itemVars")) {
              item = { ...item, itemVars: v.itemVars };
            }
          } else {
            console.warn(
              `[parseLoadoutsFromImportedData] No item found for item ID ${v.id}`,
            );
          }
        }
        // The following line will remove the item entirely if it seems to no longer exist.
        loadout.equipment[k as keyof typeof loadout.equipment] = item || null;
      }
    }

    // load the current spell, if applicable
    if (loadout.spell?.name) {
      loadout.spell = spellByName(loadout.spell.name);
    }

    return { name: `Loadout ${i + 1}`, ...loadout };
  });

class GlobalState implements State {
  serializationVersion = IMPORT_VERSION;

  monster: Monster = generateDefaultMonster();

  comparisonMonsterSlots: ComparisonMonsterSlot[] = [];

  loadouts: Player[] = [generateEmptyPlayer()];

  selectedLoadout = 0;

  ui: UI = {
    showPreferencesModal: false,
    showShareModal: false,
    username: "",
    isDefensiveReductionsExpanded: false,
    leagues: {
      six: {
        pactsSearchQuery: "",
      },
    },
  };

  prefs: Preferences = {
    manualMode: false,
    rememberUsername: true,
    showEnemyComparisonResults: false,
  };

  calc: Calculator = {
    loadouts: [
      {
        npcDefRoll: 0,
        maxHit: 0,
        maxAttackRoll: 0,
        npcMaxHit: 0,
        npcMaxAttackRoll: 0,
        npcDps: 0,
        npcAccuracy: 0,
        playerDefRoll: 0,
        accuracy: 0,
        dps: 0,
        ttk: 0,
      },
    ],
  };

  private calcWorker!: CalcWorker;

  availableMonsters = getMonsters();

  private _debug: boolean = false;

  private storageUpdater?: IReactionDisposer;

  leagues: {
    six: {
      hoveredNodeId: string | null;
    };
  } = {
    six: {
      hoveredNodeId: null,
    },
  };

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });

    const recomputeBoosts = () => {
      // Re-compute the player's boost values.
      const boosts: Partial<PlayerSkills> = {
        atk: 0,
        def: 0,
        magic: 0,
        prayer: 0,
        ranged: 0,
        str: 0,
        mining: 0,
        herblore: 0,
      };

      for (const p of this.player.buffs.potions) {
        const result = PotionMap[p].calculateFn(this.player.skills);
        for (const k of Object.keys(result)) {
          const r = result[k as keyof typeof result] as number;
          if (r > boosts[k as keyof typeof boosts]!) {
            // If this skill's boost is higher than what it already is, then change it
            boosts[k as keyof typeof boosts] = result[
              k as keyof typeof result
            ] as number;
          }
        }
      }

      const leagueEffects = this.player.leagues.six.effects;
      const leagueDef = leagueEffects.talent_defence_boost ?? 0;
      if (leagueDef > 0 && leagueDef > (boosts.def ?? 0)) {
        boosts.def = leagueDef;
      }

      const leagueMagicBoost = Math.min(
        this.player.leagues.six.regenerateMagicBonus ?? 0,
        10,
      );
      boosts.magic = Math.max(boosts.magic ?? 0, leagueMagicBoost);

      this.updatePlayer({ boosts });
    };

    const potionTriggers: ((r: IReactionPublic) => unknown)[] = [
      () => toJS(this.player.skills),
      () => toJS(this.player.buffs.potions),
      () => toJS(this.player.leagues.six),
    ];
    potionTriggers.map((t) =>
      reaction(t, recomputeBoosts, { fireImmediately: false }),
    );

    // for toa monster + shadow handling
    const equipmentTriggers: ((r: IReactionPublic) => unknown)[] = [
      () => toJS(this.monster),
    ];
    equipmentTriggers.map((t) =>
      reaction(t, () => {
        if (!this.prefs.manualMode) {
          this.recalculateEquipmentBonusesFromGearAll();
        }
      }),
    );
  }

  set debug(debug: boolean) {
    this._debug = debug;
  }

  get debug(): boolean {
    return this._debug;
  }

  /**
   * Get the importable version of the current UI state
   */
  get asImportableData(): ImportableData {
    return {
      serializationVersion: IMPORT_VERSION,
      loadouts: toJS(this.loadouts),
      monster: toJS(this.monster),
      comparisonMonsterSlots: toJS(this.comparisonMonsterSlots),
      selectedLoadout: this.selectedLoadout,
    };
  }

  /**
   * Get the currently selected player (loadout)
   */
  get player() {
    return this.loadouts[this.selectedLoadout];
  }

  /**
   * Returns the data for the currently equipped items
   */
  get equipmentData() {
    return this.player.equipment;
  }

  /**
   * Get the user's current issues based on their calculated loadouts
   */
  get userIssues() {
    let is: UserIssue[] = [];

    // Determine the current global/UI-related issues
    // ex. is.push({ type: UserIssueType.MONSTER_UNIQUE_EFFECTS, message: 'This monster has unique effects that are not yet accounted for. Results may be inaccurate.' });
    // Add in the issues returned from the calculator
    for (const l of Object.values(this.calc.loadouts)) {
      if (l.userIssues) is = [...is, ...l.userIssues];
    }
    return is;
  }

  /**
   * Get the available combat styles for the currently equipped weapon
   * @see https://oldschool.runescape.wiki/w/Combat_Options
   */
  get availableCombatStyles() {
    const cat =
      this.player.equipment.weapon?.category || EquipmentCategory.NONE;
    return getCombatStylesForCategory(cat);
  }

  /**
   * Whether the currently selected monster has non-standard mechanics or behaviour.
   * In this case, we should hide UI elements relating to reverse DPS/damage taken metrics.
   */
  get isNonStandardMonster() {
    return !["slash", "crush", "stab", "magic", "ranged"].includes(
      this.monster.style || "",
    );
  }

  /**
   * Initialises the autorun function for updating dps-calc-state when something changes.
   * This should only ever be called once.
   */
  startStorageUpdater() {
    if (this.storageUpdater) {
      return;
    }
    this.storageUpdater = autorun(() => {
      // Save their application state to browser storage
      localforage
        .setItem("dps-calc-state", toJS(this.asImportableData))
        .catch(() => {});
    });
  }

  setCalcWorker(worker: CalcWorker) {
    if (this.calcWorker === worker) {
      return;
    }

    if (this.calcWorker) {
      this.calcWorker.shutdown();
    }
    worker.initWorker();
    this.calcWorker = worker;
  }

  updateEquipmentBonuses(loadoutIx?: number) {
    loadoutIx = loadoutIx !== undefined ? loadoutIx : this.selectedLoadout;

    this.loadouts[loadoutIx] = merge(
      this.loadouts[loadoutIx],
      calculateEquipmentBonusesFromGear(this.loadouts[loadoutIx], this.monster),
    );
  }

  recalculateEquipmentBonusesFromGearAll() {
    this.loadouts.forEach((_, i) => this.updateEquipmentBonuses(i));
  }

  updateUIState(ui: PartialDeep<UI>) {
    this.ui = Object.assign(this.ui, ui);
  }

  updateCalcResults(calc: PartialDeep<Calculator>) {
    this.calc = merge(this.calc, calc);
  }

  async loadShortlink(linkId: string) {
    let data: ImportableData;

    await toast.promise(
      async () => {
        data = await fetchShortlinkData(linkId);

        /**
         * For future reference: if we ever change the schema of the loadouts or the monster object,
         * then some of the JSON data we store for shortlinks will be incorrect. We can handle those instances here, as
         * a sort of "on-demand migration".
         *
         * Also: the reason we're merging the objects below is that we're trying our hardest not to cause the app to
         * error if the JSON data is bad. To achieve that, we do a deep merge of the loadouts and monster objects so that
         * the existing data still remains.
         */

        this.updateImportedData(data);
      },
      {
        pending: "Loading data from shared link...",
        success: "Loaded data from shared link!",
        error: "Failed to load shared link data. Please try again.",
      },
      {
        toastId: "shortlink",
      },
    );
  }

  updateImportedData(data: ImportableData) {
    /* eslint-disable no-fallthrough */
    switch (data.serializationVersion) {
      case 1:
        data.monster.inputs.phase = data.monster.inputs.tormentedDemonPhase;

      case 2: // reserved: used during leagues 5
      case 3: // reserved: used during leagues 5
      case 4: // reserved: used during leagues 5
      case 5:
        data.loadouts.forEach((l) => {
          /* eslint-disable @typescript-eslint/dot-notation */
          /* eslint-disable @typescript-eslint/no-explicit-any */
          if ((l as any)["leagues"]) {
            delete (l as any)["leagues"];
          }
          /* eslint-enable @typescript-eslint/dot-notation */
          /* eslint-enable @typescript-eslint/no-explicit-any */
        });

      case 6:
        // partyAvgMiningLevel becomes partySumMiningLevel
        if (isDefined(data.monster.inputs.partyAvgMiningLevel)) {
          data.monster.inputs.partySumMiningLevel =
            data.monster.inputs.partyAvgMiningLevel *
            data.monster.inputs.partySize;
          delete data.monster.inputs.partyAvgMiningLevel;
        }

      case 7:
        if (!isDefined(data.monster.immunities)) {
          data.monster.immunities = {
            burn: null,
          };
        }

      case 8:
        // Definition of distanceToEnemy changed from 'tiles between' to
        // 'distance' to match weapon range.
        data.loadouts.forEach((l) => {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          const six = (l as any)?.leagues?.six;
          if (six) {
            six.distanceToEnemy = Math.min(10, six.distanceToEnemy + 1);
          }
          /* eslint-enable @typescript-eslint/no-explicit-any */
        });

      case 9:
        data.loadouts.forEach((l) => {
          const replacements = {
            1000100: 33247,
            1000101: 33245,
            1000102: 33253,
            1000103: 33255,
            1000104: 33243,
            1000105: 33249,
            1000106: 33251,
          };
          if (
            l.equipment?.weapon?.id &&
            `${l.equipment.weapon.id}` in replacements
          ) {
            l.equipment.weapon.id =
              replacements[l.equipment.weapon.id as keyof typeof replacements];
          }
        });

      default:
    }
    /* eslint-enable no-fallthrough */
    console.debug("IMPORT | ", data);

    if (data.monster) {
      const newMonster = resolveImportedMonster(data.monster);

      // If the passed monster def reductions are different to the defaults, expand the UI section.
      for (const [k, v] of Object.entries(
        data.monster.inputs?.defenceReductions,
      )) {
        if (
          v !== undefined &&
          v !==
            INITIAL_MONSTER_INPUTS.defenceReductions[
              k as keyof typeof INITIAL_MONSTER_INPUTS.defenceReductions
            ]
        ) {
          this.updateUIState({ isDefensiveReductionsExpanded: true });
          break;
        }
      }

      // only use the shortlink for user-input fields, trust cdn for others in case they change
      this.updateMonster({
        ...newMonster,
        inputs: data.monster.inputs,
      });
    }

    this.comparisonMonsterSlots = (data.comparisonMonsterSlots || []).map(
      (slot) => {
        if (!slot.monster) {
          return slot;
        }

        return {
          ...slot,
          monster: {
            ...resolveImportedMonster(slot.monster),
            inputs: slot.monster.inputs,
          } as Monster,
        };
      },
    );

    // Expand some minified fields with their full metadata
    const loadouts = parseLoadoutsFromImportedData(data);

    // manually recompute equipment in case their metadata has changed since the shortlink was created
    loadouts.forEach((p, ix) => {
      if (this.loadouts[ix] === undefined)
        this.loadouts.push(generateEmptyPlayer());
      this.updatePlayer(p, ix);
    });
    this.recalculateEquipmentBonusesFromGearAll();
    this.recalculateLeaguesEffects();

    this.selectedLoadout = data.selectedLoadout || 0;
  }

  loadPreferences() {
    localforage
      .getItem("dps-calc-prefs")
      .then((v) => {
        this.updatePreferences(v as PartialDeep<Preferences>);
      })
      .catch((e) => {
        console.error(e);
        // TODO maybe some handling here
      });
  }

  async fetchCurrentPlayerSkills() {
    const { username } = this.ui;

    try {
      const res = await toast.promise(
        fetchPlayerSkills(username),
        {
          pending: "Fetching player skills...",
          success: `Successfully fetched player skills for ${username}!`,
          error: "Error fetching player skills",
        },
        {
          toastId: "skills-fetch",
        },
      );

      if (res) this.updatePlayer({ skills: res });
    } catch (e) {
      console.error(e);
    }
  }

  updatePreferences(pref: PartialDeep<Preferences>) {
    // Update local state store
    this.prefs = Object.assign(this.prefs, pref);

    if (pref && Object.prototype.hasOwnProperty.call(pref, "manualMode")) {
      // Reset player bonuses to their worn equipment
      this.recalculateEquipmentBonusesFromGearAll();
    }

    // Save to browser storage
    localforage.setItem("dps-calc-prefs", toJS(this.prefs)).catch((e) => {
      console.error(e);
      // TODO something that isn't this
      // eslint-disable-next-line no-alert
      alert(
        "Could not persist preferences to browser. Make sure our site has permission to do this.",
      );
    });
  }

  /**
   * Toggle a potion, with logic to remove from or add to the potions array depending on if it is already in there.
   * @param potion
   */
  togglePlayerPotion(potion: Potion) {
    const isToggled = this.player.buffs.potions.includes(potion);
    if (isToggled) {
      this.player.buffs.potions = this.player.buffs.potions.filter(
        (p) => p !== potion,
      );
    } else {
      this.player.buffs.potions = [...this.player.buffs.potions, potion];
    }
  }

  /**
   * Toggle a prayer, with logic to remove from or add to the prayers array depending on if it is already in there.
   * @param prayer
   */
  togglePlayerPrayer(prayer: Prayer) {
    const isToggled = this.player.prayers.includes(prayer);
    if (isToggled) {
      // If we're toggling off an existing prayer, just filter it out from the array
      this.player.prayers = this.player.prayers.filter((p) => p !== prayer);
    } else {
      // If we're toggling on a new prayer, let's do some checks to ensure that some prayers cannot be enabled alongside it
      let newPrayers = [...this.player.prayers];

      // If this is a defensive prayer, disable all other defensive prayers
      if (DEFENSIVE_PRAYERS.includes(prayer))
        newPrayers = newPrayers.filter((p) => !DEFENSIVE_PRAYERS.includes(p));

      // If this is an overhead prayer, disable all other overhead prayers
      if (OVERHEAD_PRAYERS.includes(prayer))
        newPrayers = newPrayers.filter((p) => !OVERHEAD_PRAYERS.includes(p));

      // If this is an offensive prayer...
      if (OFFENSIVE_PRAYERS.includes(prayer)) {
        newPrayers = newPrayers.filter((p) => {
          // If this is a "brain" prayer, it can only be paired with arm prayers
          if (BRAIN_PRAYERS.includes(prayer))
            return !OFFENSIVE_PRAYERS.includes(p) || ARM_PRAYERS.includes(p);
          // If this is an "arm" prayer, it can only be paired with brain prayers
          if (ARM_PRAYERS.includes(prayer))
            return !OFFENSIVE_PRAYERS.includes(p) || BRAIN_PRAYERS.includes(p);
          // Otherwise, there are no offensive prayers it can be paired with, disable them all
          return !OFFENSIVE_PRAYERS.includes(p);
        });
      }

      this.player.prayers = [...newPrayers, prayer];
    }
  }

  /**
   * Toggle a monster attribute.
   * @param attr
   */
  toggleMonsterAttribute(attr: MonsterAttribute) {
    const isToggled = this.monster.attributes.includes(attr);
    if (isToggled) {
      this.monster.attributes = this.monster.attributes.filter(
        (a) => a !== attr,
      );
    } else {
      this.monster.attributes = [...this.monster.attributes, attr];
    }
  }

  /**
   * Update the player state.
   * @param player
   * @param loadoutIx Which loadout to update. Defaults to the current selected loadout.
   */
  updatePlayer(player: PartialDeep<Player>, loadoutIx?: number) {
    loadoutIx = loadoutIx !== undefined ? loadoutIx : this.selectedLoadout;

    const currentShield = this.loadouts[loadoutIx].equipment.shield;
    const newShield = player.equipment?.shield;

    const currentWeapon = this.loadouts[loadoutIx].equipment.weapon;

    // Special handling for if a shield is equipped, and we're using a two-handed weapon
    if (
      player.equipment?.shield &&
      newShield !== undefined &&
      currentWeapon?.isTwoHanded
    ) {
      player = { ...player, equipment: { ...player.equipment, weapon: null } };
    }
    // ...and vice-versa
    if (
      player.equipment?.weapon &&
      player.equipment?.weapon.isTwoHanded &&
      currentShield?.name !== ""
    ) {
      player = { ...player, equipment: { ...player.equipment, shield: null } };
    }

    const eq = player.equipment;
    if (eq && (Object.hasOwn(eq, "weapon") || Object.hasOwn(eq, "shield"))) {
      const newWeapon = player.equipment?.weapon;

      if (newWeapon !== undefined) {
        const oldWeaponCat = currentWeapon?.category || EquipmentCategory.NONE;
        const newWeaponCat = newWeapon?.category || EquipmentCategory.NONE;
        if (
          newWeaponCat !== undefined &&
          newWeaponCat !== oldWeaponCat &&
          !player.style
        ) {
          // If the weapon slot category was changed, we should reset the player's selected combat style to the first one that exists.
          const styles = getCombatStylesForCategory(newWeaponCat);
          const rapid = styles.find((e) => e.stance === "Rapid");
          if (rapid !== undefined) {
            player.style = rapid;
          } else {
            // Would perhaps be worth it to make a similar thing for looking up
            // aggressive?
            player.style = styles[0];
          }
        }
      }
    }

    this.loadouts[loadoutIx] = merge(this.loadouts[loadoutIx], player);
    if (!this.prefs.manualMode) {
      this.updateEquipmentBonuses(loadoutIx);
    }
  }

  /**
   * Update the monster state.
   * @param monster
   */
  updateMonster(monster: PartialDeep<Monster>) {
    // If monster attributes were passed to this function, clear the existing ones
    if (monster.attributes !== undefined) this.monster.attributes = [];

    // If the monster ID was changed, reset all the inputs.
    if (
      monster.id !== undefined &&
      monster.id !== this.monster.id &&
      !Object.hasOwn(monster, "inputs")
    ) {
      monster = {
        ...monster,
        inputs: INITIAL_MONSTER_INPUTS,
      };
    }

    this.monster = merge(this.monster, monster, (obj, src) => {
      // This check is to ensure that empty arrays always override existing arrays, even if they have values.
      if (Array.isArray(src) && src.length === 0) {
        return src;
      }
      return undefined;
    });
  }

  addComparisonMonsterSlot() {
    if (this.comparisonMonsterSlots.length >= 2) {
      return;
    }

    const nextId =
      this.comparisonMonsterSlots.reduce(
        (highestId, slot) => Math.max(highestId, slot.id),
        0,
      ) + 1;
    this.comparisonMonsterSlots = [
      ...this.comparisonMonsterSlots,
      {
        id: nextId,
        monster: null,
      },
    ];
  }

  removeComparisonMonsterSlot(slotId: number) {
    this.comparisonMonsterSlots = this.comparisonMonsterSlots.filter(
      (slot) => slot.id !== slotId,
    );
  }

  setComparisonMonsterSlots(slots: ComparisonMonsterSlot[]) {
    this.comparisonMonsterSlots = slots;
  }

  updateComparisonMonsterSlot(slotId: number, monster: Monster | null) {
    this.comparisonMonsterSlots = this.comparisonMonsterSlots.map((slot) => {
      if (slot.id !== slotId) {
        return slot;
      }

      return {
        ...slot,
        monster,
      };
    });
  }

  /**
   * Clear an equipment slot, removing the item that was inside of it.
   * @param slot
   */
  clearEquipmentSlot(slot: keyof PlayerEquipment) {
    this.updatePlayer({
      equipment: {
        [slot]: null,
      },
    });
  }

  setSelectedLoadout(ix: number) {
    this.selectedLoadout = ix;
  }

  toggleLeagues6Region(region: LeagueRegion, loadoutIx?: number) {
    const index = loadoutIx ?? this.selectedLoadout;
    const currentRegions = this.loadouts[index].leagues.six.regions;

    if (currentRegions.includes(region)) {
      this.loadouts[index].leagues.six.regions = currentRegions.filter(
        (currentRegion) => currentRegion !== region,
      );
      return;
    }

    if (currentRegions.length >= 3) {
      return;
    }

    this.loadouts[index].leagues.six.regions = [...currentRegions, region];
  }

  reorderLoadouts(fromIndex: number, toIndex: number) {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= this.loadouts.length ||
      toIndex >= this.loadouts.length
    ) {
      return;
    }

    const reorderedLoadouts = [...this.loadouts];
    const [movedLoadout] = reorderedLoadouts.splice(fromIndex, 1);
    reorderedLoadouts.splice(toIndex, 0, movedLoadout);
    this.loadouts = reorderedLoadouts;

    const reorderedCalcLoadouts = [...this.calc.loadouts];
    const [movedCalcLoadout] = reorderedCalcLoadouts.splice(fromIndex, 1);
    reorderedCalcLoadouts.splice(toIndex, 0, movedCalcLoadout);
    this.calc.loadouts = reorderedCalcLoadouts;

    if (this.selectedLoadout === fromIndex) {
      this.selectedLoadout = toIndex;
    } else if (
      fromIndex < this.selectedLoadout &&
      toIndex >= this.selectedLoadout
    ) {
      this.selectedLoadout -= 1;
    } else if (
      fromIndex > this.selectedLoadout &&
      toIndex <= this.selectedLoadout
    ) {
      this.selectedLoadout += 1;
    }
  }

  deleteLoadout(ix: number) {
    if (this.loadouts.length === 1) {
      // If there is only one loadout, clear it instead of deleting it
      this.loadouts[0] = generateEmptyPlayer();
      return;
    }

    this.loadouts = this.loadouts.filter((p, i) => i !== ix);
    // If the selected loadout index is equal to or over the index we just remove, shift it down by one, else add one
    if (this.selectedLoadout >= ix && ix !== 0) {
      this.selectedLoadout -= 1;
    }
  }

  renameLoadout(ix: number, name: string) {
    const loadout = this.loadouts[ix];

    const trimmedName = name.trim();
    if (loadout) {
      if (trimmedName) {
        loadout.name = trimmedName;
      } else {
        loadout.name = `Loadout ${ix + 1}`;
      }
    }
  }

  get canCreateLoadout() {
    return this.loadouts.length < NUMBER_OF_LOADOUTS;
  }

  createLoadout(selected?: boolean, cloneIndex?: number) {
    // Do not allow creating a loadout if we're over the limit
    if (!this.canCreateLoadout) return;

    const newLoadout =
      cloneIndex !== undefined
        ? toJS(this.loadouts[cloneIndex])
        : generateEmptyPlayer();
    newLoadout.name = `Loadout ${this.loadouts.length + 1}`;

    this.loadouts.push(newLoadout);
    if (selected) this.selectedLoadout = this.loadouts.length - 1;
  }

  async doWorkerRecompute() {
    if (!this.calcWorker?.isReady()) {
      console.debug(
        "[GlobalState] doWorkerRecompute called but worker is not ready, ignoring for now.",
      );
      return;
    }

    // clear existing loadout data
    const calculatedLoadouts: CalculatedLoadout[] = [];
    this.loadouts.forEach(() => calculatedLoadouts.push(EMPTY_CALC_LOADOUT));
    this.calc.loadouts = calculatedLoadouts;

    const data: ComputeBasicRequest["data"] = {
      loadouts: toJS(this.loadouts),
      monster: toJS(this.monster),
      calcOpts: {
        detailedOutput: this.debug,
        disableMonsterScaling: this.monster.id === -1,
      },
    };
    const resp = await this.calcWorker.do({
      type: WorkerRequestType.COMPUTE_BASIC,
      data,
    });

    this.updateCalcResults({ loadouts: resp.payload });
  }

  get reachableNodeIds() {
    const reachable = new Set<string>();
    for (const selectedId of this.player.leagues.six.selectedNodeIds) {
      const node = dbrowDefinitions[selectedId];
      if (node) {
        for (const linkedId of node.linked_nodes) {
          if (!this.player.leagues.six.selectedNodeIds.has(linkedId)) {
            reachable.add(linkedId);
          }
        }
      }
    }
    return reachable;
  }

  toggleLeagues6BlindbagWeapon(eq: EquipmentPiece) {
    if (this.player.leagues.six.blindbagWeapons.find((w) => w.id === eq.id)) {
      this.player.leagues.six.blindbagWeapons =
        this.player.leagues.six.blindbagWeapons.filter((w) => w.id !== eq.id);
    } else {
      this.player.leagues.six.blindbagWeapons.push(eq);
    }
  }

  setHoveredNode(id: string | null) {
    this.leagues.six.hoveredNodeId = id;
  }

  pruneStrandedNodes() {
    if (this.player.leagues.six.selectedNodeIds.size === 1) {
      return;
    }

    const visited = new Set<string>([rootNode.id]);
    const queue: string[] = [rootNode.id];

    let head = 0;
    while (head < queue.length) {
      const currentId = queue[head];
      head += 1;
      const node = dbrowDefinitions[currentId];
      if (node) {
        for (const linkedId of node.linked_nodes) {
          if (
            this.player.leagues.six.selectedNodeIds.has(linkedId) &&
            !visited.has(linkedId)
          ) {
            visited.add(linkedId);
            queue.push(linkedId);
          }
        }
      }
    }

    this.player.leagues.six.selectedNodeIds = visited;
  }

  toggleNodeSelection(id: string, allowMissingDependencies: boolean) {
    if (id === rootNode.id) {
      this.player.leagues.six.selectedNodeIds.clear();
      this.player.leagues.six.selectedNodeIds.add(rootNode.id);
      this.recalculateLeaguesEffects();
      return;
    }

    if (this.player.leagues.six.selectedNodeIds.has(id)) {
      this.player.leagues.six.selectedNodeIds.delete(id);
      if (!allowMissingDependencies) {
        this.pruneStrandedNodes();
      }
    } else if (this.reachableNodeIds.has(id) || allowMissingDependencies) {
      this.player.leagues.six.selectedNodeIds.add(id);
    } else {
      this.pathToSelection(id);
    }

    this.recalculateLeaguesEffects();
  }

  isNodeSelected(id: string) {
    return this.player.leagues.six.selectedNodeIds.has(id);
  }

  pathToSelection(id: string) {
    const nodesToSelect = this.getNodesToSelect(id);
    for (const nodeId of nodesToSelect) {
      this.player.leagues.six.selectedNodeIds.add(nodeId);
    }
  }

  getNodesToSelect(id: string): Set<string> {
    const nodesToSelect = new Set<string>();
    if (this.player.leagues.six.selectedNodeIds.has(id)) {
      return nodesToSelect;
    }

    const queue: string[] = [id];
    const parent = new Map<string, string | null>();
    parent.set(id, null);

    let foundTarget: string | null = null;
    let head = 0;

    const isTarget = (nodeId: string): boolean =>
      this.player.leagues.six.selectedNodeIds.has(nodeId);

    while (head < queue.length) {
      const currentId = queue[head];
      head += 1;
      if (isTarget(currentId)) {
        foundTarget = currentId;
        break;
      }

      const node = dbrowDefinitions[currentId];
      if (node) {
        for (const linkedId of node.linked_nodes) {
          if (!parent.has(linkedId)) {
            parent.set(linkedId, currentId);
            queue.push(linkedId);
          }
        }
      }
    }

    if (foundTarget) {
      let curr: string | null = foundTarget;
      while (curr !== null) {
        if (!this.player.leagues.six.selectedNodeIds.has(curr)) {
          nodesToSelect.add(curr);
        }
        curr = parent.get(curr) || null;
      }
    }

    return nodesToSelect;
  }

  get nodesToSelectIfHoveredSelected(): Set<string> {
    if (!this.leagues.six.hoveredNodeId) {
      return new Set();
    }
    return this.getNodesToSelect(this.leagues.six.hoveredNodeId);
  }

  recalculateLeaguesEffects() {
    const state = this.player.leagues.six;
    state.effects = {};

    const selectedNodeIds = state.selectedNodeIds;
    const DAMAGE_PACT_EFFECTS: LeaguesEffect[] = [
      'talent_percentage_melee_damage',
      'talent_percentage_ranged_damage',
      'talent_percentage_magic_damage',
    ];
    selectedNodeIds.forEach((id) => {
      const def = dbrowDefinitions[id];
      const prior = state.effects[def.effect.name] ?? 0;
      const addend = def.effect.value === '[Constant: true]' ? 1 : def.effect.value;
      state.effects[def.effect.name] = prior + addend;

      // Each +1% damage pact also grants +10% accuracy in all combat styles
      if (DAMAGE_PACT_EFFECTS.includes(def.effect.name)) {
        state.effects.talent_all_style_accuracy = (state.effects.talent_all_style_accuracy ?? 0) + 10;
      }
    });

    console.debug(
      '[GlobalState] recalculateLeaguesEffects',
      toJS(state.effects),
    );

    if (!this.prefs.manualMode) {
      this.recalculateEquipmentBonusesFromGearAll();
    }
  }

  get currentEffects(): Map<
    string,
    {
      skillTreeNodeId: string;
      values: (number | '[Constant: true]')[];
    }
  > {
    const state = this.player.leagues.six;
    const effects = new Map<
      string,
      {
        skillTreeNodeId: string;
        values: (number | '[Constant: true]')[];
      }
    >();
    const DAMAGE_PACT_EFFECTS: LeaguesEffect[] = [
      'talent_percentage_melee_damage',
      'talent_percentage_ranged_damage',
      'talent_percentage_magic_damage',
    ];
    let damagePactCount = 0;
    for (const id of state.selectedNodeIds) {
      const node = dbrowDefinitions[id];
      if (node) {
        const existingEffect = effects.get(node.effect.name);
        if (existingEffect) {
          if (
            dbrowDefinitions[existingEffect.skillTreeNodeId]?.name.length <
            node.name.length
          ) {
            existingEffect.skillTreeNodeId = id;
          }
          existingEffect.values.push(node.effect.value);
        } else {
          effects.set(node.effect.name, {
            skillTreeNodeId: id,
            values: [node.effect.value],
          });
        }
        if (DAMAGE_PACT_EFFECTS.includes(node.effect.name)) {
          damagePactCount += 1;
        }
      }
    }
    // Each damage pact also grants +10% accuracy in all combat styles
    if (damagePactCount > 0) {
      const accEntry = effects.get('talent_all_style_accuracy');
      if (accEntry) {
        for (let i = 0; i < damagePactCount; i++) {
          accEntry.values.push(10);
        }
      } else {
        // Find any accuracy node for icon/display, or use the first available node
        const accNodeId = Object.keys(dbrowDefinitions).find(
          (k) => dbrowDefinitions[k].effect.name === 'talent_all_style_accuracy',
        );
        if (accNodeId) {
          effects.set('talent_all_style_accuracy', {
            skillTreeNodeId: accNodeId,
            values: Array(damagePactCount).fill(10),
          });
        }
      }
    }
    return effects;
  }

  get nodesMatchingSearch(): Set<string> {
    if (!this.ui.leagues.six.pactsSearchQuery) {
      return new Set();
    }
    return new Set(
      Object.keys(dbrowDefinitions).filter((id) =>
        dbrowDefinitions[id].name
          ?.toLowerCase()
          .includes(this.ui.leagues.six.pactsSearchQuery.toLowerCase()),
      ),
    );
  }
}

const StoreContext = createContext<GlobalState>(new GlobalState());

const StoreProvider: React.FC<{
  store: GlobalState;
  children: React.ReactNode;
}> = ({ store, children }) => (
  <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
);

const useStore = () => useContext(StoreContext);

export { GlobalState, StoreProvider, useStore };
