import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing(){
  const nav = useNavigate();
  return (
    <div className="landing">
      <h1>omeg.chat</h1>
      <p>Random video chat — find someone with one click.</p>
      <button className="btn primary" onClick={() => nav('/talk')}>Start</button>
    </div>
  );
}
