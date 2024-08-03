import "./HeroPanel.css";
import protocol from "../protocol.json";
import React from "react";

import IceWall from "../svg/IceWall.svg";
import ColdImmunity from "../svg/ColdImmunity.svg";

const HeroPanel = ({ hero }) => {
  const heroData = protocol.heroType.find(h => h.name === hero.name);

  return (
    <div className="hero-info-panel">
      <div className="info-panel">
        <h2>{heroData.name}</h2>
        <div className="hero-avatar">
          <span className="hero-level">{hero.level}</span>
        </div>
        <p>{hero.nickname}</p>
      </div>
      <div className="upgrades">
        <Upgrade name="Speed" value={hero.speed} />
        <Upgrade name="Energy" value={`${hero.energy}/${hero.maxEnergy}`} />
        <Upgrade name="Regen" value={hero.regen} />
        {heroData.abilities.map((ability, index) => (
          <Upgrade key={index} name={ability.name} id={index} isAbility />
        ))}
      </div>
    </div>
  );
};

const UpgradeBar = ({ curr, min, max, step }) => {
  return (
    <input
      type="range"
      className="custom-range"
      min={min}
      max={max}
      step={step}
      value={curr}
      onChange={() => {}}
    />
  );
};

const Upgrade = ({ name, value, isAbility = false }) => {
  const svgMap = {
    IceWall,
    ColdImmunity
  };

  return (
    <div className={`upgrade ${!isAbility ? "non-ability-upgrade" : ""}`}>
      {!isAbility && <h3>{name}</h3>}
      {isAbility ? (
        <>
          <UpgradeBar curr={0} min={1} max={5} step={1} />
          <div className="ability-upgrade">
            <img src={svgMap[name.replace(/\s+/g, '')]} alt={name} />
          </div>
        </>
      ) : (
        <span className="upgrade-value">{value}</span>
      )}
    </div>
  );
};

export default HeroPanel;