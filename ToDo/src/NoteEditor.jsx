import React, { useState, useRef, useEffect } from 'react';
import { db, id } from './db';

function NoteEditor({ note, user }) {
  const [title, setTitle] = useState(note.title || '');
  const [body, setBody] = useState(note.body || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const saveTimerRef = useRef(null);

  // Query all files uploaded under this note's path prefix
  const pathPrefix = `${user.id}/${note.id}/`;
  const { data: filesData } = db.useQuery({
    $files: {
      $: {
        where: { path: { $like: `${pathPrefix}%` } },
        order: { serverCreatedAt: 'asc' },
      },
    },
  });

  const images = filesData?.$files || [];

  // Sync state when switching notes
  useEffect(() => {
    setTitle(note.title || '');
    setBody(note.body || '');
  }, [note.id]);

  // Auto-save with debounce
  const saveNote = (newTitle, newBody) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      db.transact(
        db.tx.notes[note.id].update({
          title: newTitle,
          body: newBody,
          updatedAt: Date.now(),
        })
      );
    }, 400);
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    saveNote(val, body);
  };

  const handleBodyChange = (e) => {
    const val = e.target.value;
    setBody(val);
    saveNote(title, val);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const ext = file.name.split('.').pop() || 'bin';
        const filePath = `${user.id}/${note.id}/${id()}.${ext}`;
        await db.storage.uploadFile(filePath, file, {
          contentType: file.type,
        });
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteImage = async (file) => {
    try {
      await db.storage.delete(file.path);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={handleTitleChange}
        placeholder="Note title..."
        className="w-full text-2xl font-bold text-gray-900 placeholder-gray-300 border-none outline-none bg-transparent mb-4"
      />

      {/* Body */}
      <textarea
        value={body}
        onChange={handleBodyChange}
        placeholder="Start writing..."
        className="w-full min-h-[300px] text-gray-700 placeholder-gray-300 border-none outline-none bg-transparent resize-none leading-relaxed"
      />

      {/* Attachments section */}
      <div className="mt-6 border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-600">
            Attachments {images.length > 0 && `(${images.length})`}
          </h3>
          <button
            onClick={handleUploadClick}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                Add Image
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Image grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((file) => (
              <div
                key={file.id}
                className="group relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
              >
                {file.url ? (
                  <img
                    src={file.url}
                    alt={file.path.split('/').pop()}
                    className="w-full h-36 object-cover"
                  />
                ) : (
                  <div className="w-full h-36 flex items-center justify-center text-gray-400">
                    <span className="text-xs">Loading...</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-xs text-white truncate">
                    {file.path.split('/').pop().replace(/^[^_]+_/, '')}
                  </p>
                </div>
                <button
                  onClick={() => deleteImage(file)}
                  className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-all shadow-sm"
                  title="Remove image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NoteEditor;
