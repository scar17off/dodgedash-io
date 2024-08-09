import React, { useState } from 'react';
import './App.css';
import Game from './game/Game';
import HeroSelect from './game/HeroSelect';

function App() {
  const [gameState, setGameState] = useState('menu');
  const [nickname, setNickname] = useState('');
  const [selectedHero, setSelectedHero] = useState(null);

  const handlePlay = () => {
    if (nickname.trim()) {
      setGameState('heroSelect');
    } else {
      alert('Please enter a nickname');
    }
  };

  const handleHeroSelect = (hero) => {
    setSelectedHero(hero);
    setGameState('game');
  };

  return (
    <div className="app" style={{ textAlign: 'center' }}>
      {gameState === 'game' ? (
        <Game nickname={nickname} hero={selectedHero} />
      ) : gameState === 'heroSelect' ? (
        <HeroSelect nickname={nickname} onHeroSelect={handleHeroSelect} />
      ) : (
        <header className="header">
          <h1>dodgedash.io</h1>
          <input
            type="text"
            placeholder="Enter your nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="nickname-input"
          />
          <nav className="nav">
            <button onClick={handlePlay}>Play</button>
          </nav>
        </header>
      )}
    </div>
  );
}

export default App;