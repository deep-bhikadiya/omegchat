import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Talk from './pages/Talk';
import Navbar from './components/Navbar';

export default function App() {
  return (
    <div className="app-root">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/talk" element={<Talk />} />
      </Routes>
    </div>
  );
}
