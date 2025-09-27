import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar(){
  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/">
          <img src="assets/omeg-chat.png" alt="logo" className="logo" />
        </Link>
      </div>
      <div className="nav-right">
        <a href="#blog">Blog</a>
        <a href="#about">About</a>
      </div>
    </nav>
  );
}
