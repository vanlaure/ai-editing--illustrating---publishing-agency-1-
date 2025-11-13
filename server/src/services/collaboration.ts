import { Server as SocketIOServer } from 'socket.io';
import { Doc, Map as YMap, Text, Array as YArray } from 'yjs';

interface CollaborativeDocument {
  id: string;
  ydoc: Doc;
  participants: Set<string>;
  lastActivity: Date;
}

class CollaborationService {
  private documents = new Map<string, CollaborativeDocument>();
  private io: SocketIOServer | null = null;

  initialize(io: SocketIOServer) {
    this.io = io;

    // Handle Yjs WebSocket connections
    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      socket.on('join-document', (documentId: string, userInfo: any) => {
        this.joinDocument(socket.id, documentId, userInfo);
        socket.join(`document-${documentId}`);
      });

      socket.on('leave-document', (documentId: string) => {
        this.leaveDocument(socket.id, documentId);
        socket.leave(`document-${documentId}`);
      });

      socket.on('cursor-update', (documentId: string, cursorData: any) => {
        socket.to(`document-${documentId}`).emit('cursor-update', {
          userId: socket.id,
          ...cursorData,
        });
      });

      socket.on('selection-update', (documentId: string, selectionData: any) => {
        socket.to(`document-${documentId}`).emit('selection-update', {
          userId: socket.id,
          ...selectionData,
        });
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        this.handleDisconnect(socket.id);
      });
    });
  }

  private joinDocument(userId: string, documentId: string, userInfo: any) {
    let document = this.documents.get(documentId);
    if (!document) {
      // Create new collaborative document
      const ydoc = new Doc();
      const ytext = ydoc.getText('content');
      const ymetadata = ydoc.getMap('metadata');

      // Initialize with default structure
      ymetadata.set('created', new Date().toISOString());
      ymetadata.set('participants', new YArray());

      document = {
        id: documentId,
        ydoc,
        participants: new Set(),
        lastActivity: new Date(),
      };
      this.documents.set(documentId, document);
    }

    document.participants.add(userId);
    document.lastActivity = new Date();

    // Broadcast participant update
    if (this.io) {
      this.io.to(`document-${documentId}`).emit('participant-update', {
        participants: Array.from(document.participants),
      });
    }

    console.log(`User ${userId} joined document ${documentId}. Total participants: ${document.participants.size}`);
  }

  private leaveDocument(userId: string, documentId: string) {
    const document = this.documents.get(documentId);
    if (document) {
      document.participants.delete(userId);
      document.lastActivity = new Date();

      if (this.io) {
        this.io.to(`document-${documentId}`).emit('participant-update', {
          participants: Array.from(document.participants),
        });
      }

      // Clean up empty documents after some time
      if (document.participants.size === 0) {
        setTimeout(() => {
          const doc = this.documents.get(documentId);
          if (doc && doc.participants.size === 0) {
            this.documents.delete(documentId);
            console.log(`Cleaned up empty document ${documentId}`);
          }
        }, 300000); // 5 minutes
      }
    }
  }

  private handleDisconnect(userId: string) {
    // Remove user from all documents they were part of
    for (const [documentId, document] of this.documents.entries()) {
      if (document.participants.has(userId)) {
        this.leaveDocument(userId, documentId);
      }
    }
  }

  getDocument(documentId: string): CollaborativeDocument | undefined {
    return this.documents.get(documentId);
  }

  getActiveDocuments(): string[] {
    return Array.from(this.documents.keys());
  }

  getDocumentStats(documentId: string) {
    const document = this.documents.get(documentId);
    if (!document) return null;

    return {
      participants: document.participants.size,
      lastActivity: document.lastActivity,
      content: document.ydoc.getText('content').toString(),
    };
  }
}

export const collaborationService = new CollaborationService();