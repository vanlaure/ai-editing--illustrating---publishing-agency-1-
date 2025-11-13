import React from 'react';
import { motion } from 'framer-motion';

interface Collaborator {
  id: string;
  name: string;
  avatarColor?: string;
  cursor?: { from: number; to: number };
  selection?: { from: number; to: number };
}

interface CollaboratorCursorsProps {
  collaborators: Collaborator[];
  editorElement: HTMLElement | null;
}

export const CollaboratorCursors: React.FC<CollaboratorCursorsProps> = ({
  collaborators,
  editorElement,
}) => {
  if (!editorElement) return null;

  const getCursorPosition = (pos: number) => {
    try {
      const editorRect = editorElement.getBoundingClientRect();
      const range = document.createRange();
      const selection = window.getSelection();

      // Find the text node at the given position
      const walker = document.createTreeWalker(
        editorElement,
        NodeFilter.SHOW_TEXT,
        null
      );

      let currentPos = 0;
      let node: Node | null = null;

      while ((node = walker.nextNode())) {
        if (currentPos + node.textContent!.length >= pos) {
          break;
        }
        currentPos += node.textContent!.length;
      }

      if (node) {
        const offset = pos - currentPos;
        range.setStart(node, Math.min(offset, node.textContent!.length));
        range.collapse(true);

        const rect = range.getBoundingClientRect();
        return {
          left: rect.left - editorRect.left,
          top: rect.top - editorRect.top,
        };
      }
    } catch (error) {
      console.warn('Failed to calculate cursor position:', error);
    }

    return null;
  };

  const getSelectionRect = (from: number, to: number) => {
    try {
      const startPos = getCursorPosition(from);
      const endPos = getCursorPosition(to);

      if (startPos && endPos) {
        return {
          left: startPos.left,
          top: Math.min(startPos.top, endPos.top),
          width: Math.abs(endPos.left - startPos.left),
          height: Math.abs(endPos.top - startPos.top) + 20,
        };
      }
    } catch (error) {
      console.warn('Failed to calculate selection rect:', error);
    }

    return null;
  };

  return (
    <>
      {collaborators.map((collaborator) => (
        <React.Fragment key={collaborator.id}>
          {/* Cursor */}
          {collaborator.cursor && (
            <motion.div
              className="absolute pointer-events-none z-50"
              style={{
                left: getCursorPosition(collaborator.cursor.from)?.left || 0,
                top: getCursorPosition(collaborator.cursor.from)?.top || 0,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className="w-0.5 h-5 rounded-sm shadow-lg"
                style={{ backgroundColor: collaborator.avatarColor }}
              />
              <div
                className="absolute -top-6 left-0 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap shadow-lg"
                style={{ backgroundColor: collaborator.avatarColor }}
              >
                {collaborator.name}
              </div>
            </motion.div>
          )}

          {/* Selection highlight */}
          {collaborator.selection && (
            <motion.div
              className="absolute pointer-events-none z-40 rounded opacity-30"
              style={{
                ...getSelectionRect(collaborator.selection.from, collaborator.selection.to),
                backgroundColor: collaborator.avatarColor,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </React.Fragment>
      ))}
    </>
  );
};