import React from 'react';

const MobileControls = ({ onMove, onRotate, onHold, onInstantDrop }) => {
  return (
    <div className="mobile-controls">
      <button className="mobile-btn" onClick={() => onMove(-1, 0)}>←</button>
      <button className="mobile-btn" onClick={() => onMove(1, 0)}>→</button>
      <button className="mobile-btn" onClick={() => onMove(0, 1)}>↓</button>
      <button className="mobile-btn" onClick={onInstantDrop}>⤓</button>
      <button className="mobile-btn" onClick={onRotate}>↻</button>
      <button className="mobile-btn hold" onClick={onHold}>Hold</button>
    </div>
  );
};

export default MobileControls;