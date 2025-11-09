import { beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

if (typeof globalThis.atob === 'undefined') {
  globalThis.atob = (input: string): string => Buffer.from(input, 'base64').toString('binary');
}

if (typeof globalThis.BroadcastChannel === 'undefined') {
  class MockBroadcastChannel {
    name: string;
    onmessage: ((event: MessageEvent) => void) | null = null;

    constructor(name: string) {
      this.name = name;
    }

    postMessage(data: unknown) {
      this.onmessage?.({ data } as MessageEvent);
    }

    close() {
      /* no-op */
    }
  }

  globalThis.BroadcastChannel = MockBroadcastChannel as unknown as typeof BroadcastChannel;
}

beforeEach(() => {
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
  }
});
