import React, { useState, useRef } from 'react';
import './HeroSelect.css';
import protocol from '../protocol.json';

// Import SVG icons
import IceWall from "../svg/IceWall.svg";
import ColdImmunity from "../svg/ColdImmunity.svg";
import Magnetize from "../svg/Magnetize.svg";

const HeroSelect = ({ nickname, onHeroSelect }) => {
  const { heroType } = protocol;
  const [hoveredHero, setHoveredHero] = useState(null);
  const [popupPosition, setPopupPosition] = useState('top');
  const cardRef = useRef(null);

  const abilityIcons = {
    "Ice Wall": IceWall,
    "Cold Immunity": ColdImmunity,
    "Magnetize": Magnetize
  };

  const hexToRgba = (hex, alpha = 1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const handleMouseEnter = (hero, event) => {
    const card = event.currentTarget;
    const cardRect = card.getBoundingClientRect();
    const spaceAbove = cardRect.top;
    const spaceBelow = window.innerHeight - cardRect.bottom;
    
    // If there's more space below than above, show popup at bottom
    setPopupPosition(spaceAbove > spaceBelow ? 'top' : 'bottom');
    setHoveredHero(hero);
  };

  return (
    <div className="hero-select">
      <h2>Select Your Hero</h2>
      <div className="hero-grid">
        {heroType.map((hero) => (
          <div
            key={hero.id}
            className="hero-card"
            ref={cardRef}
            onClick={() => onHeroSelect(hero.name)}
            onMouseEnter={(e) => handleMouseEnter(hero, e)}
            onMouseLeave={() => setHoveredHero(null)}
            style={{
              borderColor: hero.color,
              backgroundColor: hexToRgba(hero.color, 0.2),
              color: hero.color
            }}
          >
            <div className="hero-name">{hero.name}</div>
            <div className="hero-abilities">
              <div className="ability-icon">
                {abilityIcons[hero.abilities[0]?.name] && (
                  <img 
                    src={abilityIcons[hero.abilities[0].name]} 
                    alt={hero.abilities[0].name}
                    className="ability-image"
                  />
                )}
              </div>
              <div 
                className="hero-circle" 
                style={{ backgroundColor: hero.color }}
              />
              <div className="ability-icon">
                {abilityIcons[hero.abilities[1]?.name] && (
                  <img 
                    src={abilityIcons[hero.abilities[1].name]} 
                    alt={hero.abilities[1].name}
                    className="ability-image"
                  />
                )}
              </div>
            </div>
            {hoveredHero === hero && (
              <div className={`hero-details-popup popup-${popupPosition}`}>
                <div className="hero-description">{hero.description}</div>
                <div className="abilities-details">
                  {hero.abilities.map((ability, index) => (
                    <div key={index} className="ability-detail">
                      <h3>{ability.name}</h3>
                      <p>{ability.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroSelect;