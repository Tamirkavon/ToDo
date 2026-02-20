import React from 'react';
import { db } from './db';
import Login from './Login';
import NotesApp from './NotesApp';

function App() {
  const { isLoading, user, error } = db.useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  if (user) {
    return <NotesApp user={user} />;
  }

  return <Login />;
}

export default App;
