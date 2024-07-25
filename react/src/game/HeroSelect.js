import React from 'react';
import './HeroSelect.css';
import heroData from '../protocol.json';

const HeroSelect = ({ nickname, onHeroSelect }) => {
  const { heroType } = heroData;

  const hexToRgba = (hex, alpha = 1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div className="hero-select">
      <h2>Select Your Hero</h2>
      <div className="hero-grid">
        {heroType.map((hero) => (
          <div 
            key={hero.id} 
            className="hero-card" 
            onClick={() => onHeroSelect(hero.name)} 
            style={{ 
              borderColor: hero.color,
              backgroundColor: hexToRgba(hero.color, 0.2),
              color: hero.color
            }}
          >
            <div className="hero-name">{hero.name}</div>
            <div className="hero-abilities">
              <div className="ability-icon" title={hero.ability1Description}>
                {/* SVG for ability 1 */}
              </div>
              <div className="hero-circle" style={{ backgroundColor: hero.color }}></div>
              <div className="ability-icon" title={hero.ability2Description}>
                {/* SVG for ability 2 */}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroSelect;