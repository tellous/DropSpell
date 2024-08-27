import React, { useState } from 'react';
import GameBoard from './components/gameboard';
import ScoreBoard from './components/scoreboard';

const App = () => {
    const [gameStarted, setGameStarted] = useState(false);
    const [score, setScore] = useState(0);

    const startGame = () => {
        setGameStarted(true);
        setScore(0);
    };

    return (
        <div className="game-container">
            <ScoreBoard score={score} />
            {!gameStarted && <button onClick={startGame}>START</button>}
            {gameStarted && <GameBoard onScoreUpdate={setScore} />}
        </div>
    );
};

export default App;
