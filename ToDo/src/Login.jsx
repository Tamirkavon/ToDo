import React, { useState, useRef } from 'react';
import { db } from './db';

function Login() {
  const [sentEmail, setSentEmail] = useState('');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
          <p className="mt-2 text-gray-500">Sign in to manage your notes</p>
        </div>
        {!sentEmail ? (
          <EmailStep onSendEmail={setSentEmail} />
        ) : (
          <CodeStep sentEmail={sentEmail} onBack={() => setSentEmail('')} />
        )}
      </div>
    </div>
  );
}

function EmailStep({ onSendEmail }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = inputRef.current.value;
    setLoading(true);
    onSendEmail(email);
    db.auth.sendMagicCode({ email }).catch((err) => {
      alert('Error: ' + (err.body?.message || err.message));
      onSendEmail('');
      setLoading(false);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email address
        </label>
        <input
          ref={inputRef}
          id="email"
          type="email"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="you@example.com"
          required
          autoFocus
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Sending...' : 'Send Magic Code'}
      </button>
    </form>
  );
}

function CodeStep({ sentEmail, onBack }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = inputRef.current.value;
    setLoading(true);
    db.auth.signInWithMagicCode({ email: sentEmail, code }).catch((err) => {
      inputRef.current.value = '';
      setLoading(false);
      alert('Error: ' + (err.body?.message || err.message));
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">
        We sent a code to <strong className="text-gray-900">{sentEmail}</strong>
      </p>
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
          Verification code
        </label>
        <input
          ref={inputRef}
          id="code"
          type="text"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none tracking-widest text-center text-xl"
          placeholder="123456"
          required
          autoFocus
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Verifying...' : 'Verify & Sign In'}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        Use a different email
      </button>
    </form>
  );
}

export default Login;
