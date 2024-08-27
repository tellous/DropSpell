import React from 'react';
import { useSelector } from 'react-redux';

const ScoreBoard = () => {
    const score = useSelector(state => state.score);

    return (
        <div className="score-board">
            <h1>Score: {score}</h1>
        </div>
    );
};

export default ScoreBoard;
