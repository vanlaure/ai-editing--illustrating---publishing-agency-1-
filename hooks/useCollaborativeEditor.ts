import { useEffect, useRef, useState } from 'react';
import { useEditor } from '@tiptap/react';
import { Doc, Text } from 'yjs';
import { io, Socket } from 'socket.io-client';

interface Collaborator {
  id: string;
  name: string;
  avatarColor?: string;
  cursor?: { from: number; to: number };
  selection?: { from: number; to: number };
}

interface UseCollaborativeEditorOptions {
  documentId: string;
  userId: string;
  userName: string;
  initialContent?: string;
}

export const useCollaborativeEditor = ({
  documentId,
  userId,
  userName,
  initialContent = '',
}: UseCollaborativeEditorOptions) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const ydocRef = useRef<Doc | null>(null);

  // Initialize Yjs document
  useEffect(() => {
    if (!ydocRef.current) {
      ydocRef.current = new Doc();
    }
    return () => {
      if (ydocRef.current) {
        ydocRef.current.destroy();
        ydocRef.current = null;
      }
    };
  }, []);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socket = io(process.env.NODE_ENV === 'production'
      ? window.location.origin.replace(/^http/, 'ws')
      : 'ws://localhost:4000'
    );

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to collaboration server');
      setIsConnected(true);

      // Join the document room
      socket.emit('join-document', documentId, {
        id: userId,
        name: userName,
        avatarColor: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from collaboration server');
      setIsConnected(false);
    });

    socket.on('participant-update', (data: { participants: string[] }) => {
      // Update collaborators list
      setCollaborators(prev =>
        prev.filter(c => data.participants.includes(c.id))
      );
    });

    socket.on('cursor-update', (data: { userId: string; from: number; to: number }) => {
      setCollaborators(prev =>
        prev.map(c =>
          c.id === data.userId
            ? { ...c, cursor: { from: data.from, to: data.to } }
            : c
        )
      );
    });

    socket.on('selection-update', (data: { userId: string; from: number; to: number }) => {
      setCollaborators(prev =>
        prev.map(c =>
          c.id === data.userId
            ? { ...c, selection: { from: data.from, to: data.to } }
            : c
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [documentId, userId, userName]);

  // Create TipTap editor with Yjs integration
  const editor = useEditor({
    extensions: [
      // Add your existing extensions here
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      // Broadcast cursor position
      const { from, to } = editor.state.selection;

      if (socketRef.current && isConnected) {
        socketRef.current.emit('cursor-update', documentId, { from, to });
      }
    },
    onSelectionUpdate: ({ editor }) => {
      // Broadcast selection
      const { from, to } = editor.state.selection;

      if (socketRef.current && isConnected) {
        socketRef.current.emit('selection-update', documentId, { from, to });
      }
    },
  });

  // Handle document loading
  useEffect(() => {
    if (editor && isConnected) {
      setIsLoading(false);

      // Load initial content from Yjs document
      const ytext = ydocRef.current?.getText('content');
      if (ytext && ytext.toString()) {
        editor.commands.setContent(ytext.toString());
      }
    }
  }, [editor, isConnected]);

  const updateCursor = (from: number, to: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('cursor-update', documentId, { from, to });
    }
  };

  const updateSelection = (from: number, to: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('selection-update', documentId, { from, to });
    }
  };

  return {
    editor,
    collaborators,
    isConnected,
    isLoading,
    updateCursor,
    updateSelection,
  };
};