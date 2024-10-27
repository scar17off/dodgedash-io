import React from "react";
import "./HeroPanel.css";
import protocol from "../protocol.json";

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

  const xpProgress = (localPlayer.xp / localPlayer.xpToNextLevel) * 100;

  return (
    <div className="hero-info-panel">
      <div className="info-panel">
        <h2>{heroData.name}</h2>
        <div className="hero-avatar" style={{'--xp-progress': `${xpProgress}%`}}>
          <span className="hero-level">{localPlayer.level}</span>
        </div>
        <p>{localPlayer.name}</p>
      </div>
      <div className="upgrades">
        <Upgrade name="Speed" value={localPlayer.speed} />
        <Upgrade name="Energy" value={`${Math.round(localPlayer.energy)}/${localPlayer.maxEnergy}`} />
        <Upgrade name="Regen" value={localPlayer.energyRegen} />
        {localPlayer.abilities && localPlayer.abilities.map((ability, index) => (
          <Upgrade key={index} name={ability.name} id={index} level={ability.upgradeLevel} isAbility isUnlocked={ability.unlocked} />
        ))}
      </div>
    </div>
  );
};

const UpgradeBar = ({ curr, min, max, step, onChange }) => {
  return (
    <input
      type="range"
      className="custom-range"
      min={min}
      max={max}
      step={step}
      value={curr}
      onChange={onChange}
      disabled
    />
  );
};

const Upgrade = ({ name, value, isAbility = false, level = 0, isUnlocked = true }) => {
  const svgMap = {
    IceWall,
    ColdImmunity,
    Magnetize
  };

  const abilityStyle = {
    opacity: isUnlocked ? 1 : 0.5
  };

  return (
    <div className={`upgrade ${!isAbility ? "non-ability-upgrade" : ""}`}>
      {!isAbility && <h3>{name}</h3>}
      {isAbility ? (
        <>
          {isUnlocked && <UpgradeBar curr={level} min={0} max={5} step={1} />}
          <div className="ability-upgrade" style={abilityStyle}>
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
