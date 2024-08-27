import React from 'react';

const MobileControls = ({ onMove, onRotate, onHold, onInstantDrop }) => {
  return (
    <div className="mobile-controls">
      <button className="mobile-btn left" onClick={() => onMove(-1, 0)}>←</button>
      <button className="mobile-btn right" onClick={() => onMove(1, 0)}>→</button>
      <button className="mobile-btn down" onClick={onInstantDrop}>↓</button>
      <button className="mobile-btn rotate" onClick={onRotate}>↻</button>
      <button className="mobile-btn hold" onClick={onHold}>Hold</button>
    </div>
  );
};

export default MobileControls;