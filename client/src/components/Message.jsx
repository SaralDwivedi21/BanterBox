import React from 'react';
export default function Message({ m, mine }) {
  const t = new Date(m.createdAt);
  const time = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div className={"message " + (mine ? 'mine' : '')}>
      <div className="meta">
        <span className="user">{m.username}</span>
        <span className="time">{time}</span>
      </div>
      <div className="content">{m.content}</div>
    </div>
  );
}
