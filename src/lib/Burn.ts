const MAX_BURN_STACKS = 5;
const HITS_PER_STACK = 10;
const INACTIVE = -1;
const EMPTY_COUNTS: number[] = Array(HITS_PER_STACK).fill(0);
const BURN_INTERVAL = 4;
const CONVERGENCE_TOL = 1e-10;
const MAX_ITER = 20_000;

interface BurnState {
  phase: number;
  counts: number[];
}

interface StateStep {
  noProcIndex: number;
  procIndex: number;
}

interface BurnStateSpace {
  states: BurnState[];
  steps: StateStep[];
}

const totalStacks = (counts: number[]): number => counts.reduce((acc, count) => acc + count, 0);

const addStack = (counts: number[]): number[] => {
  const next = counts.slice();
  next[HITS_PER_STACK - 1] += 1;
  return next;
};

const applyBurnTick = (counts: number[]): number[] => [...counts.slice(1), 0];

const inactiveState = (): BurnState => ({ phase: INACTIVE, counts: EMPTY_COUNTS });

const stateToInt = (phase: number, counts: number[]): number => {
  let key = phase + 1;
  for (let i = 0; i < HITS_PER_STACK; i++) {
    key = (key * 6) + counts[i];
  }
  return key;
};

const burnsSinceLast = (phase: number, attackSpeed: number): number => {
  const nextBurnOffset = phase === 0 ? 0 : BURN_INTERVAL - phase;
  if (nextBurnOffset >= attackSpeed) {
    return 0;
  }

  return Math.floor((attackSpeed - 1 - nextBurnOffset) / BURN_INTERVAL) + 1;
};

const applyBurnsSinceLast = (counts: number[], phase: number, attackSpeed: number): BurnState => {
  let current = counts;
  const burnCount = burnsSinceLast(phase, attackSpeed);

  for (let tick = 0; tick < burnCount; tick++) {
    current = applyBurnTick(current);
    if (totalStacks(current) === 0) {
      return inactiveState();
    }
  }

  return { phase: (phase + attackSpeed) % BURN_INTERVAL, counts: current };
};

const nextState = (state: BurnState, procOccurs: boolean, attackSpeed: number): BurnState => {
  if (state.phase === INACTIVE) {
    if (!procOccurs) {
      return inactiveState();
    }

    return applyBurnsSinceLast(addStack(EMPTY_COUNTS), 0, attackSpeed);
  }

  let counts = state.counts;
  if (procOccurs && totalStacks(counts) < MAX_BURN_STACKS) {
    counts = addStack(counts);
  }

  return applyBurnsSinceLast(counts, state.phase, attackSpeed);
};

const buildStateSpace = (attackSpeed: number): BurnStateSpace => {
  const states: BurnState[] = [];
  const steps: StateStep[] = [];
  const stateToIndex = new Map<number, number>();

  const getOrAddStateIndex = (state: BurnState): number => {
    const key = stateToInt(state.phase, state.counts);
    let index = stateToIndex.get(key);

    if (index === undefined) {
      index = states.length;
      stateToIndex.set(key, index);
      states.push(state);
      steps.push({ noProcIndex: 0, procIndex: 0 });
    }

    return index;
  };

  getOrAddStateIndex(inactiveState());

  for (let i = 0; i < states.length; i++) {
    const state = states[i];
    const noProcState = nextState(state, false, attackSpeed);
    const procState = nextState(state, true, attackSpeed);

    steps[i] = {
      noProcIndex: getOrAddStateIndex(noProcState),
      procIndex: getOrAddStateIndex(procState),
    };
  }

  return { states, steps };
};

const steadyStateBurnDist = (
  stateSpace: BurnStateSpace,
  procChance: number,
  tol = CONVERGENCE_TOL,
  maxIter = MAX_ITER,
): Float64Array => {
  const { steps } = stateSpace;
  let dist = new Float64Array(steps.length);
  dist[0] = 1;

  for (let iter = 1; iter <= maxIter; iter++) {
    const next = new Float64Array(steps.length);

    for (let i = 0; i < steps.length; i++) {
      const prob = dist[i];
      if (prob === 0) {
        continue;
      }

      const { noProcIndex, procIndex } = steps[i];
      if (noProcIndex === procIndex) {
        next[noProcIndex] += prob;
        continue;
      }

      next[noProcIndex] += prob * (1 - procChance);
      next[procIndex] += prob * procChance;
    }

    let diff = 0;
    for (let i = 0; i < next.length; i++) {
      next[i] = (0.5 * next[i]) + (0.5 * dist[i]);
      diff += Math.abs(next[i] - dist[i]);
    }

    dist = next;
    if (diff < tol) {
      return dist;
    }
  }

  return dist;
};

const getExpectedBurn = (
  hitChance: number,
  attackSpeed: number,
  burnChance: number,
  tol = CONVERGENCE_TOL,
  maxIter = MAX_ITER,
): number => {
  const procChance = hitChance * burnChance;
  const stateSpace = buildStateSpace(attackSpeed);
  const steadyStateDist = steadyStateBurnDist(stateSpace, procChance, tol, maxIter);

  let capProb = 0;
  for (let i = 0; i < stateSpace.states.length; i++) {
    if (totalStacks(stateSpace.states[i].counts) === MAX_BURN_STACKS) {
      capProb += steadyStateDist[i];
    }
  }

  return HITS_PER_STACK * procChance * (1 - capProb);
};

export default getExpectedBurn;
