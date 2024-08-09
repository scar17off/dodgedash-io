import React, { useState, useEffect } from 'react';

const Leaderboard = ({ gameState }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (gameState.players) {
      const sortedPlayers = [...gameState.players, gameState.localPlayer]
        .sort((a, b) => b.score - a.score);
      setPlayers(sortedPlayers);
    }
  }, [gameState]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const groupedPlayers = players.reduce((acc, player) => {
    if (!acc[player.regionName]) {
      acc[player.regionName] = [];
    }
    acc[player.regionName].push(player);
    return acc;
  }, {});

  return (
    <div style={{
      position: 'absolute',
      top: '5px',
      right: '5px',
      width: '300px',
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: '5px',
      overflow: 'hidden'
    }}>
      <div 
        onClick={toggleExpand}
        style={{
          padding: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <h3 style={{ margin: 0, color: 'white' }}>Leaderboard {isExpanded ? '▼' : '▲'}</h3>
      </div>
      {isExpanded && (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {Object.entries(groupedPlayers).map(([regionName, regionPlayers]) => (
            <div key={regionName} style={{ margin: '10px' }}>
              <h4 style={{ color: 'white', borderBottom: '1px solid white' }}>{regionName}</h4>
              {regionPlayers.map((player, index) => (
                <div key={player.id} style={{ display: 'flex', alignItems: 'center', margin: '5px 0' }}>
                  <div 
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: player.color,
                      marginRight: '10px'
                    }}
                  />
                  <span style={{ color: 'white' }}>
                    {player.name} - Area {player.areaNumber + 1}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;