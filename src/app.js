import React from 'react';
import GameBoard from './components/gameboard';

const App = () => {
    return (
        <div>
            <div className="game-container">
                <div className="game-content">
                    <GameBoard />
                </div>
                <div className="instructions">
                    <h2>How to Play:</h2>
                    <div className="instruction-boxes">
                        <div className="instruction-box">🎮 Press START to begin</div>
                        <div className="instruction-box">⬅️➡️ Arrow keys to move</div>
                        <div className="instruction-box">⬆️ Up arrow for instant drop</div>
                        <div className="instruction-box">⬇️ Down arrow to drop faster</div>
                        <div className="instruction-box">⇧ Shift to rotate</div>
                        <div className="instruction-box">🖱️ Click and drag blocks to match colors</div>
                        <div className="instruction-box">🌈 Match colors to clear lines</div>
                        <div className="instruction-box">🏁 Game over at top</div>
                        <div className="instruction-box">🔄 Space to hold/swap piece</div>
                    </div>
                </div>
            </div>
            <footer className="game-footer">
                <p>Forked from <a href="https://github.com/0xunderl0rd/DropSpell">0xunderl0rd/DropSpell</a></p>
                <p>Created with Cursor</p>
                <p>Subscribe to <a href="https://www.patreon.com/AIForHumansShow">AIForHumansShow</a></p>
            </footer>
        </div>
    );
};

export default App;
