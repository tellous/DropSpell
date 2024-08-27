import React from 'react';

const Block = ({ color, x, y, isTransparent, isWiggling, isDraggable, isMouseAttached, blockSize }) => {
    return (
        <div
            className={`block ${isWiggling ? 'wiggle' : ''}`}
            style={{
                backgroundColor: color,
                left: `${x * blockSize}px`,
                top: `${y * blockSize}px`,
                width: `${blockSize}px`,
                height: `${blockSize}px`,
                opacity: isTransparent ? 0.5 : 1,
                cursor: isDraggable ? 'grab' : 'default',
                position: isMouseAttached ? 'fixed' : 'absolute',
                border: '1px solid rgba(0, 0, 0, 0.2)',
                boxSizing: 'border-box',
            }}
        />
    );
};

export default Block;
