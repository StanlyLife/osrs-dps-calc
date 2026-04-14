import React from 'react';
import { observable, runInAction } from 'mobx';
import { TextDecoder, TextEncoder } from 'util';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import EnemyComparisonResults from '@/app/components/results/EnemyComparisonResults';

globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
const { renderToString } = require('react-dom/server');

const mockCalc = {
  isReady: jest.fn(() => true),
  do: jest.fn(async () => ({
    payload: [{
      maxHit: 11,
      expectedHit: 5.3,
      dps: 2.22,
      accuracy: 0.9544,
      specExpected: undefined,
      userIssues: [],
    }],
  })),
};

const mockStore = {
  loadouts: observable.array([{ name: 'Loadout 1' }]),
  selectedLoadout: 0,
  setSelectedLoadout: jest.fn(),
};

jest.mock('@/state', () => ({
  useStore: () => mockStore,
}));

jest.mock('@/worker/CalcWorker', () => ({
  useIndependentCalc: () => mockCalc,
}));

describe('EnemyComparisonResults', () => {
  const comparisonMonsters = [{
    id: 14779,
    name: 'Gemstone Crab',
    version: '',
  }];

  beforeEach(() => {
    mockCalc.isReady.mockReturnValue(true);
    mockCalc.do.mockClear();
    runInAction(() => {
      mockStore.loadouts.replace([{ name: 'Loadout 1' }]);
    });
  });

  it('renders without invalid element errors', () => {
    expect(() => renderToString(<EnemyComparisonResults comparisonMonsters={comparisonMonsters} />)).not.toThrow();
  });

  it('mounts on the client and resolves the initial worker update', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<EnemyComparisonResults comparisonMonsters={comparisonMonsters} />);
      await Promise.resolve();
    });

    expect(mockCalc.do).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
  });

  it('recomputes when the existing loadout array contents change', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<EnemyComparisonResults comparisonMonsters={comparisonMonsters} />);
      await Promise.resolve();
    });

    await act(async () => {
      runInAction(() => {
        mockStore.loadouts.push({ name: 'Loadout 2' });
      });
      await Promise.resolve();
    });

    expect(mockCalc.do).toHaveBeenCalledTimes(2);
    expect(mockCalc.do.mock.calls[1][0].data.loadouts).toHaveLength(2);

    await act(async () => {
      runInAction(() => {
        mockStore.loadouts.pop();
      });
      root.unmount();
    });
  });
});
