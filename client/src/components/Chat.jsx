import React, { useEffect, useRef, useState } from 'react';
import Message from './Message';
export default function Chat({ api, wsUrl, token, username }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const wsRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const listRef = useRef(null);
  useEffect(()=>{
    fetch(`${api}/messages`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()).then(setMessages).catch(()=>{});
    const ws = new WebSocket(`${wsUrl}/ws?token=${token}`);
    wsRef.current = ws;
    ws.addEventListener('message', (ev)=>{
      let m;
      try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.type === 'message') setMessages(prev=>[...prev, m.data]);
      if (m.type === 'typing') setTypingUsers(prev=>({...prev, [m.data.username]: m.data.typing}));
    });
    return ()=>{ ws.close(); };
  },[api, token, wsUrl]);
  useEffect(()=>{ if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; },[messages]);
  function sendMessage() {
    if (!text.trim()) return;
    wsRef.current.send(JSON.stringify({ type: 'message', data: { content: text.trim() } }));
    setText('');
    sendTyping(false);
  }
  function sendTyping(v=true) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'typing', data: { typing: v } }));
  }
  function onChange(e) {
    setText(e.target.value);
    sendTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(()=>sendTyping(false),900);
  }
  return (
    <div className="chat-root">
      <div className="chat-box" ref={listRef}>
        {messages.map(m=> <Message key={m._id||m.createdAt} m={m} mine={m.username===username} />)}
      </div>
      <div className="typing-row">
        {Object.keys(typingUsers).filter(u=>typingUsers[u] && u!==username).map(u=> <div key={u} className="typing">{u} is typing...</div>)}
      </div>
      <div className="composer">
        <input className="input-text" value={text} onChange={onChange} placeholder="Say something..." onKeyDown={e=>{ if (e.key==='Enter') sendMessage(); }} />
        <button className="btn-send" onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
