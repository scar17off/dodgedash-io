import React from 'react';
import './HeroSelect.css';
const { heroType } = require("../protocol.json");

const HeroSelect = ({ nickname, onHeroSelect }) => {
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
              backgroundColor: `rgba(${parseInt(hero.color.slice(1, 3), 16)}, ${parseInt(hero.color.slice(3, 5), 16)}, ${parseInt(hero.color.slice(5, 7), 16)}, 0.2)`,
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