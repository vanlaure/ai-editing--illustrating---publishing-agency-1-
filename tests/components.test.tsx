import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Editor } from '../components/Editor';

// Import jest-dom matchers
import '@testing-library/jest-dom';

// Mock TipTap
vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => ({
    commands: {
      setContent: vi.fn(),
    },
  })),
}));

vi.mock('@tiptap/core', () => ({
  Extension: class {},
}));

describe('Components', () => {
  describe('Editor', () => {
    it('should render editor container', () => {
      const mockEditor = {
        commands: { setContent: vi.fn() },
      };

      render(<Editor editor={mockEditor as any} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });
});

// Mock browser APIs for tests
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(() => null),
    clear: vi.fn(() => null),
  },
  writable: true,
});

// Mock fetch for API tests
global.fetch = vi.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');

// Mock URL.revokeObjectURL
global.URL.revokeObjectURL = vi.fn();