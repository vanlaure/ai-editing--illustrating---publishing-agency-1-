import React, { forwardRef } from 'react';
import { Editor as TipTapEditor } from '@tiptap/core';
import { EditorContent } from '@tiptap/react';

interface EditorProps {
  editor: TipTapEditor | null;
}

export const Editor = forwardRef<HTMLDivElement, EditorProps>(({ editor }, ref) => {
  return (
    // This wrapper div is used for the printing ref and ID
    <div id="printable-area" ref={ref} className="h-full">
      <EditorContent editor={editor} />
    </div>
  );
});
