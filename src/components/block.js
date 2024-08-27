import React from 'react';

const Block = ({ color, x, y, size = 20, isDragging }) => {
    const style = {
        backgroundColor: color,
        left: `${x * size}px`,
        top: `${y * size}px`,
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        border: '1px solid black',
        transition: isDragging ? 'none' : 'all 0.1s',
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.7 : 1,
    };

    return <div className="block" style={style}></div>;
};

export default Block;
