import React, { useState } from 'react';

export default function Login({ api, onAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  async function submit(e, mode) {
    if (e && e.preventDefault) e.preventDefault();
    setErr('');
    if (!username || !password) {
      setErr('fill');
      return;
    }
    const url = mode === 'login' ? '/login' : '/register';
    try {
      const res = await fetch(`${api}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.token) onAuth(data.token, data.username);
      else setErr('fail');
    } catch (e) {
      setErr('fail');
    }
  }

  return (
    <form className="login" onSubmit={(e) => submit(e, 'login')}>
      <div className="label">Login or Register</div>
      <input className="input" value={username} onChange={e => setUsername(e.target.value)} placeholder="username" />
      <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password" />
      {err && <div className="error">{err}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" type="button" onClick={(e) => submit(e, 'login')}>Login</button>
        <button className="btn" type="button" onClick={(e) => submit(e, 'register')}>Register</button>
      </div>
    </form>
  );
}
