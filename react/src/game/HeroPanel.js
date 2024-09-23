import "./HeroPanel.css";
import protocol from "../protocol.json";
import React from "react";

import IceWall from "../svg/IceWall.svg";
import ColdImmunity from "../svg/ColdImmunity.svg";
import Magnetize from "../svg/Magnetize.svg";

const HeroPanel = ({ localPlayer }) => {
  if (!localPlayer) {
    return <div className="hero-info-panel">Loading...</div>;
  }
  const heroData = protocol.heroType.find(h => h.name === localPlayer.heroType);
  if (!heroData) {
    console.error(`Hero type ${localPlayer.heroType} not found in protocol`);
    return <div className="hero-info-panel">Error: Hero data not found</div>;
  }
  return (
    <div className="hero-info-panel">
      <div className="info-panel">
        <h2>{heroData.name}</h2>
        <div className="hero-avatar">
          <span className="hero-level">{localPlayer.level}</span>
        </div>
        <p>{localPlayer.name}</p>
      </div>
      <div className="upgrades">
        <Upgrade name="Speed" value={localPlayer.speed} />
        <Upgrade name="Energy" value={`${Math.round(localPlayer.energy)}/${localPlayer.maxEnergy}`} />
        <Upgrade name="Regen" value={localPlayer.energyRegen} />
        {heroData.abilities && heroData.abilities.map((ability, index) => (
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
    ColdImmunity,
    Magnetize
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