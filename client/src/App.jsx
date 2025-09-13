import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Chat from './components/Chat';
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const WS = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
export default function App() {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  useEffect(()=>{
    const t = sessionStorage.getItem('banterbox_token');
    const u = sessionStorage.getItem('banterbox_username');
    if (t && u) { setToken(t); setUsername(u); }
  },[]);
  function onAuth(t, u) {
    setToken(t);
    setUsername(u);
    sessionStorage.setItem('banterbox_token', t);
    sessionStorage.setItem('banterbox_username', u);
  }
  return (
    <div className="app-root">
      <div className="container">
        <h1 className="title">Banterbox</h1>
        {!token ? <Login api={API} onAuth={onAuth} /> : <Chat api={API} wsUrl={WS} token={token} username={username} />}
      </div>
    </div>
  );
}
