import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScriptConversionView } from '../components/ScriptConversionView';
import type { NarrationScript } from '../types';

vi.mock('uuid', () => {
  let counter = 0;
  return {
    v4: () => `mock-uuid-${++counter}`,
  };
});

describe('ScriptConversionView', () => {
  beforeEach(() => {
    window.alert = vi.fn();
  });

  it('converts manuscript text into a new script when form is submitted', async () => {
    const scripts: NarrationScript[] = [];
    let rerender: ((ui: React.ReactElement) => void) | null = null;
    const onScriptCreate = vi.fn((script: NarrationScript) => {
      scripts.push(script);
      rerender?.(
        <ScriptConversionView
          scripts={[...scripts]}
          onScriptCreate={onScriptCreate}
          onScriptUpdate={vi.fn()}
          onScriptDelete={vi.fn()}
        />,
      );
    });
    const user = userEvent.setup();

    const { rerender: testingLibraryRerender } = render(
      <ScriptConversionView
        scripts={[]}
        onScriptCreate={onScriptCreate}
        onScriptUpdate={vi.fn()}
        onScriptDelete={vi.fn()}
      />,
    );
    rerender = testingLibraryRerender;

    await user.type(screen.getByPlaceholderText(/Chapter 1 - The Beginning/i), 'Pilot Script');
    await user.type(
      screen.getByPlaceholderText(/Paste your manuscript text here/i),
      'She whispered softly to the night.\n\nThey laughed under the neon sky.',
    );

    await user.click(screen.getByRole('button', { name: /Convert to Narration Script/i }));

    await waitFor(() => expect(onScriptCreate).toHaveBeenCalledTimes(1));

    const createdScript = onScriptCreate.mock.calls[0][0] as NarrationScript;
    expect(createdScript.title).toBe('Pilot Script');
    expect(createdScript.scenes).toHaveLength(2);
    expect(createdScript.scenes[0].emotionalBeat).toBe('quiet');
    expect(createdScript.scenes[1].emotionalBeat).toBe('joyful');
    expect(createdScript.scenes.every((scene) => scene.toneCues.length === 0)).toBe(true);
  });

  it('adds pronunciation entries in edit mode', async () => {
    const mockScript: NarrationScript = {
      id: 'script-1',
      manuscriptId: 'manuscript-1',
      title: 'Existing Script',
      scenes: [
        {
          id: 'scene-1',
          sceneNumber: 1,
          emotionalBeat: 'neutral',
          content: 'Hello world',
          toneCues: [],
          breathMarks: [],
        },
      ],
      pronunciationDictionary: [],
      characterVoiceTags: [],
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    };

    const onScriptUpdate = vi.fn();
    const user = userEvent.setup();

    render(
      <ScriptConversionView
        scripts={[mockScript]}
        onScriptCreate={vi.fn()}
        onScriptUpdate={onScriptUpdate}
        onScriptDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByText(/Existing Script/i));
    await user.click(screen.getByRole('button', { name: /Pronunciation/i }));

    await user.type(screen.getByPlaceholderText(/Word \(e\.g\., Aeliana\)/i), 'Aeliana');
    await user.type(screen.getByPlaceholderText(/Phonetic \(e\.g\., ay-lee-AH-nah\)/i), 'ay-lee-AH-nah');
    await user.type(screen.getByPlaceholderText(/IPA \(optional\)/i), 'eɪˈliːənə');

    await user.click(screen.getByRole('button', { name: /Add Entry/i }));

    await waitFor(() =>
      expect(onScriptUpdate).toHaveBeenCalledWith(
        'script-1',
        expect.objectContaining({
          pronunciationDictionary: [
            expect.objectContaining({
              word: 'Aeliana',
              phonetic: 'ay-lee-AH-nah',
              ipa: 'eɪˈliːənə',
            }),
          ],
        }),
      ),
    );
  });
});
