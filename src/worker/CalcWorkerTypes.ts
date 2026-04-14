import { Player } from '@/types/Player';
import { Monster } from '@/types/Monster';
import { PlayerVsNPCCalculatedLoadout } from '@/types/State';
import { CalcOpts } from '@/lib/BaseCalc';

/**
 * Requests
 */

export enum WorkerRequestType {
  COMPUTE_BASIC,
  COMPUTE_MULTI_MONSTER_BASIC,
}

export interface WorkerRequest<T extends WorkerRequestType> {
  type: T,
  sequenceId?: number,
}

export interface WorkerCalcOpts {
  detailedOutput?: CalcOpts['detailedOutput'],
  disableMonsterScaling?: CalcOpts['disableMonsterScaling'],
}

export interface ComputeBasicRequest extends WorkerRequest<WorkerRequestType.COMPUTE_BASIC> {
  data: {
    loadouts: Player[],
    monster: Monster,
    calcOpts: WorkerCalcOpts,
  }
}

export interface ComputeMultiMonsterBasicRequest extends WorkerRequest<WorkerRequestType.COMPUTE_MULTI_MONSTER_BASIC> {
  data: {
    loadouts: Player[],
    monsters: Monster[],
    calcOpts: WorkerCalcOpts,
  }
}

export type CalcRequestsUnion =
  ComputeBasicRequest |
  ComputeMultiMonsterBasicRequest;

/**
 * Responses
 */

export interface WorkerResponse<T extends WorkerRequestType> {
  type: T,
  sequenceId: number,
  error?: string,
  payload: unknown,
}

export interface ComputeBasicResponse extends WorkerResponse<WorkerRequestType.COMPUTE_BASIC> {
  payload: PlayerVsNPCCalculatedLoadout[],
}

export interface ComputeMultiMonsterBasicResponse extends WorkerResponse<WorkerRequestType.COMPUTE_MULTI_MONSTER_BASIC> {
  payload: PlayerVsNPCCalculatedLoadout[][],
}

export type CalcResponsesUnion =
  ComputeBasicResponse |
  ComputeMultiMonsterBasicResponse;
export type CalcResponse<T extends WorkerRequestType> = CalcResponsesUnion & { type: T };

export type Handler<T extends WorkerRequestType> = (data: Extract<CalcRequestsUnion, { type: T }>['data'], rawRequest: CalcRequestsUnion) => Promise<CalcResponse<T>['payload']>;
