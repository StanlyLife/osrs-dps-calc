/* eslint-disable no-restricted-globals */
import {
  CalcRequestsUnion,
  CalcResponse,
  Handler,
  WorkerRequestType,
} from '@/worker/CalcWorkerTypes';
import { PlayerVsNPCCalculatedLoadout } from '@/types/State';
import PlayerVsNPCCalc from '@/lib/PlayerVsNPCCalc';
import { WORKER_JSON_REPLACER, WORKER_JSON_REVIVER } from '@/utils';

const computePvMValues: Handler<WorkerRequestType.COMPUTE_BASIC> = async (data) => {
  const { loadouts, monster, calcOpts } = data;
  const res: PlayerVsNPCCalculatedLoadout[] = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const [i, p] of loadouts.entries()) {
    const loadoutName = (i + 1).toString();

    const calc = new PlayerVsNPCCalc(p, monster, {
      loadoutName,
      detailedOutput: calcOpts.detailedOutput,
      disableMonsterScaling: calcOpts.disableMonsterScaling,
    });
    const specCalc = calc.getSpecCalc();

    res.push({
      npcDefRoll: calc.getNPCDefenceRoll(),
      maxHit: calc.getDistribution().getMax(),
      expectedHit: calc.getDistribution().getExpectedDamage(),
      maxAttackRoll: calc.getMaxAttackRoll(),
      accuracy: calc.getDisplayHitChance(),
      dps: calc.getDps(),
      ttk: calc.getTtk(),
      details: calc.details,
      userIssues: calc.userIssues,

      specAccuracy: specCalc?.getDisplayHitChance(),
      specMaxHit: specCalc?.getMax(),
      specExpected: specCalc?.getExpectedDamage(),
      specMomentDps: specCalc?.getDps(),
      specFullDps: specCalc?.getSpecDps(),
      specDetails: specCalc?.details,
    });
  }

  return res;
};

const computeMultiMonsterPvMValues: Handler<WorkerRequestType.COMPUTE_MULTI_MONSTER_BASIC> = async (data) => {
  const { loadouts, monsters, calcOpts } = data;

  return Promise.all(monsters.map((monster) => computePvMValues({
    loadouts,
    monster,
    calcOpts: {
      ...calcOpts,
      disableMonsterScaling: monster.id === -1,
    },
  }, {
    type: WorkerRequestType.COMPUTE_BASIC,
  } as CalcRequestsUnion)));
};

self.onmessage = async (evt: MessageEvent<string>) => {
  const req = JSON.parse(evt.data, WORKER_JSON_REVIVER) as CalcRequestsUnion;
  const { type, sequenceId, data } = req;

  const res = {
    type,
    sequenceId: sequenceId!,
  } as CalcResponse<typeof type>;

  // Interpret the incoming request, and action it accordingly
  try {
    switch (type) {
      case WorkerRequestType.COMPUTE_BASIC: {
        res.payload = await computePvMValues(data, req);
        break;
      }

      case WorkerRequestType.COMPUTE_MULTI_MONSTER_BASIC: {
        res.payload = await computeMultiMonsterPvMValues(data, req);
        break;
      }

      default:
        res.error = `Unsupported request type ${type}`;
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error(e);
      res.error = e.message;
    } else {
      res.error = `Unknown error type: ${e}`;
    }
  }

  // Send message back to the master
  self.postMessage(JSON.stringify(res, WORKER_JSON_REPLACER));
};

export {};
