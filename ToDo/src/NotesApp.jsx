import React, { useState, useRef } from 'react';
import { db, id } from './db';
import NoteEditor from './NoteEditor';

function NotesApp({ user }) {
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Query notes owned by this user, ordered by most recent first
  const { isLoading, error, data } = db.useQuery({
    notes: {
      $: {
        where: { creatorId: user.id },
        order: { serverCreatedAt: 'desc' },
      },
    },
  });

  const notes = data?.notes || [];
  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  const createNote = () => {
    const noteId = id();
    db.transact(
      db.tx.notes[noteId].update({
        title: 'Untitled Note',
        body: '',
        creatorId: user.id,
        updatedAt: Date.now(),
      })
    );
    setSelectedNoteId(noteId);
  };

  const deleteNote = (noteId) => {
    db.transact(db.tx.notes[noteId].delete());
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } flex flex-col border-r border-gray-200 bg-white transition-all duration-200 overflow-hidden`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">My Notes</h1>
          <button
            onClick={createNote}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            + New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-gray-400 text-sm">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="p-4 text-gray-400 text-sm text-center mt-8">
              No notes yet. Create one!
            </div>
          ) : (
            <div className="py-1">
              {notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`group flex items-center justify-between px-4 py-3 cursor-pointer border-b border-gray-50 ${
                    selectedNoteId === note.id
                      ? 'bg-blue-50 border-l-2 border-l-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {note.title || 'Untitled Note'}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {note.body
                        ? note.body.substring(0, 60) + (note.body.length > 60 ? '...' : '')
                        : 'Empty note'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(note.id);
                    }}
                    className="ml-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
                    title="Delete note"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User info at bottom */}
        <div className="border-t border-gray-200 p-3 flex items-center justify-between">
          <span className="text-xs text-gray-500 truncate">{user.email}</span>
          <button
            onClick={() => db.auth.signOut()}
            className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center p-3 border-b border-gray-200 bg-white">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mr-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          {selectedNote && (
            <span className="text-sm text-gray-500 truncate">
              {selectedNote.title || 'Untitled Note'}
            </span>
          )}
        </div>

        {/* Editor area */}
        <div className="flex-1 overflow-y-auto">
          {selectedNote ? (
            <NoteEditor note={selectedNote} user={user} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <p className="text-lg">Select a note or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotesApp;
