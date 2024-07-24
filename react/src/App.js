import React from 'react';
import { useState } from 'react';
import './App.css';
import Game from './game/Game';
import Editor from './editor/Editor';

function App() {
  const [isGameActive, setIsGameActive] = useState(false);
  const [isEditorActive, setIsEditorActive] = useState(false);

  return (
    <div className="app">
      {isGameActive ? (
        <Game />
      ) : isEditorActive ? (
        <Editor />
      ) : (
        <header className="header">
          <h1>dodgedash.io</h1>
          <nav className="nav">
            <button onClick={() => setIsGameActive(true)}>Play</button>
            <button onClick={() => setIsEditorActive(true)}>Editor</button>
          </nav>
        </header>
      )}
    </div>
  );
}

export default App; 