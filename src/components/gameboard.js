import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Block from './block';
import AIPlayer from './ai-player';
import MobileControls from './MobileControls';

export const COLORS = ['red', 'green', 'blue'];
export const SHAPES = [
    [[1, 1], [1, 1]], // Square
    [[1, 1, 1, 1]], // Line
    [[1, 1, 1], [0, 1, 0]], // T-shape
    [[1, 1, 0], [0, 1, 1]], // Z-shape
    [[0, 1, 1], [1, 1, 0]], // S-shape
    [[1, 1, 1], [1, 0, 0]], // L-shape
    [[1, 1, 1], [0, 0, 1]], // J-shape
];

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const BLOCK_SIZE = 20;

const GameBoard = ({ testFullBoard = null }) => {
    const generateShape = () => {
        const shapeIndex = Math.floor(Math.random() * SHAPES.length);
        return SHAPES[shapeIndex].map(row =>
            row.map(cell => cell ? COLORS[Math.floor(Math.random() * COLORS.length)] : 0)
        );
    };

    const [nextShapes, setNextShapes] = useState(() => [generateShape()]);
    const [blocks, setBlocks] = useState([]);
    const [currentShape, setCurrentShape] = useState(null);
    const [gameOver, setGameOver] = useState(false);
    const [draggedBlock, setDraggedBlock] = useState(null);
    const [score, setScore] = useState(0);
    const [linesCompleted, setLinesCompleted] = useState(0);
    const boardRef = useRef(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [bottomBlocks, setBottomBlocks] = useState([]);
    const [hoverBlock, setHoverBlock] = useState(null);
    const [isDraggingDisabled, setIsDraggingDisabled] = useState(false);
    const [heldShape, setHeldShape] = useState(null);
    const [canHold, setCanHold] = useState(true);
    const [gameStarted, setGameStarted] = useState(false);
    const [aiPlayer, setAIPlayer] = useState(null);

    const getGameState = useCallback(() => ({
        bottomBlocks,
        currentShape,
        nextShapes,
        score,
        linesCompleted,
    }), [bottomBlocks, currentShape, nextShapes, score, linesCompleted]);

    const gameFunctions = useMemo(() => ({
        moveShape: (dx, dy) => {
            console.log('GameBoard: Moving shape by', dx, dy);
            if (currentShape && canMoveTo(currentShape.x + dx, currentShape.y + dy, currentShape.shape)) {
                setCurrentShape(prev => {
                    console.log('GameBoard: New shape position:', prev.x + dx, prev.y + dy);
                    return { ...prev, x: prev.x + dx, y: prev.y + dy };
                });
                return true;
            } else {
                console.log('GameBoard: Cannot move shape');
                return false;
            }
        },
        rotateShape: () => {
            console.log('GameBoard: Rotating shape');
            if (currentShape) {
                const rotated = currentShape.shape[0].map((_, index) =>
                    currentShape.shape.map(row => row[index]).reverse()
                );
                if (canMoveTo(currentShape.x, currentShape.y, rotated)) {
                    setCurrentShape(prev => ({ ...prev, shape: rotated }));
                    console.log('GameBoard: Shape rotated');
                } else {
                    console.log('GameBoard: Cannot rotate shape');
                }
            }
        },
        placeShape: () => {
            if (currentShape) {
                // Add the current shape to the bottom blocks
                setBottomBlocks(prev => [
                    ...prev,
                    ...currentShape.shape.flatMap((row, y) =>
                        row.map((cell, x) =>
                            cell ? { x: currentShape.x + x, y: currentShape.y + y, color: cell } : null
                        ).filter(Boolean)
                    )
                ]);
                // Clear the current shape
                setCurrentShape(null);
                // Spawn a new shape
                spawnNewShape();
            }
        },
        moveBlock: (block, newX, newY) => {
            setBottomBlocks(prevBlocks =>
                prevBlocks.map(b =>
                    b === block ? { ...b, x: newX, y: newY } : b
                )
            );
        },
    }), [currentShape, canMoveTo, spawnNewShape]);

    const toggleAI = useCallback(() => {
        setAIPlayer((prevAIPlayer) => {
            if (prevAIPlayer) {
                console.log('Disabling AI');
                return null;
            } else {
                console.log('Enabling AI');
                return new AIPlayer(getGameState, gameFunctions);
            }
        });
    }, [getGameState, gameFunctions]);

    const initializeGame = useCallback(() => {
        setBottomBlocks([]);
        setScore(0);
        setLinesCompleted(0);
        setGameOver(false);
        setNextShapes([generateShape()]);
        setCurrentShape(null);
        setHeldShape(null);
        setCanHold(true);
        setGameStarted(true);
    }, []);

    const spawnNewShape = useCallback(() => {
        setNextShapes(prevShapes => {
            const newShape = prevShapes.length > 0 ? prevShapes[0] : generateShape();
            const nextShape = generateShape();

            const newCurrentShape = {
                shape: newShape,
                x: Math.floor(BOARD_WIDTH / 2) - Math.floor(newShape[0].length / 2),
                y: 0
            };

            console.log('Attempting to spawn new shape:', newCurrentShape);
            console.log('Current bottom blocks:', bottomBlocks);

            if (canMoveTo(newCurrentShape.x, newCurrentShape.y, newCurrentShape.shape)) {
                console.log('New shape can be placed');
                setCurrentShape(newCurrentShape);
                setCanHold(true);
                return [nextShape];
            } else {
                console.log('Game Over: Cannot spawn new shape');
                handleGameOver();
                return prevShapes;
            }
        });
    }, [canMoveTo, handleGameOver, bottomBlocks]);

    useEffect(() => {
        if (!gameStarted || gameOver) return;

        const gameLoop = setInterval(() => {
            if (currentShape) {
                // AI move (if AI is enabled)
                if (aiPlayer) {
                    console.log('GameBoard: Calling AI makeMove');
                    aiPlayer.makeMove();
                }

                // Regular downward movement
                if (canMoveTo(currentShape.x, currentShape.y + 1, currentShape.shape)) {
                    moveShapeDown();
                } else {
                    placeShape();
                }
            } else {
                spawnNewShape();
            }
        }, 1000); // Adjust this value to change the game speed

        return () => clearInterval(gameLoop);
    }, [gameStarted, gameOver, currentShape, canMoveTo, moveShapeDown, placeShape, spawnNewShape, aiPlayer]);

    const canMoveTo = useCallback((x, y, shape) => {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    if (
                        newX < 0 || newX >= BOARD_WIDTH ||
                        newY >= BOARD_HEIGHT ||
                        (newY >= 0 && bottomBlocks.some(block => block.x === newX && block.y === newY)) ||
                        (newY < 0 && bottomBlocks.some(block => block.x === newX && block.y === 0))
                    ) {
                        console.log(`Cannot move to: x=${newX}, y=${newY}`);
                        return false;
                    }
                }
            }
        }
        return true;
    }, [bottomBlocks]);

    const moveShape = useCallback((dx, dy) => {
        if (currentShape && canMoveTo(currentShape.x + dx, currentShape.y + dy, currentShape.shape)) {
            setCurrentShape(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        }
    }, [currentShape]);

    const rotateShape = useCallback(() => {
        if (currentShape) {
            const rotated = currentShape.shape[0].map((_, index) =>
                currentShape.shape.map(row => row[index]).reverse()
            );
            if (canMoveTo(currentShape.x, currentShape.y, rotated)) {
                setCurrentShape(prev => ({ ...prev, shape: rotated }));
            }
        }
    }, [currentShape]);

    const handleKeyDown = useCallback((e) => {
        if (gameOver || !gameStarted) return;
        switch (e.key) {
            case 'ArrowLeft':
                moveShape(-1, 0);
                break;
            case 'ArrowRight':
                moveShape(1, 0);
                break;
            case 'ArrowDown':
                moveShape(0, 1);
                break;
            case 'ArrowUp':
                instantDrop();
                break;
            case 'Shift':
                rotateShape();
                break;
            case ' ':
                holdShape();
                break;
            default:
                break;
        }
    }, [moveShape, rotateShape, instantDrop, gameOver, gameStarted, holdShape]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const holdShape = () => {
        if (!canHold) return;

        if (heldShape) {
            const temp = currentShape.shape;
            setCurrentShape({
                shape: heldShape,
                x: Math.floor(BOARD_WIDTH / 2) - Math.floor(heldShape[0].length / 2),
                y: 0
            });
            setHeldShape(temp);
        } else {
            setHeldShape(currentShape.shape);
            spawnNewShape();
        }
        setCanHold(false);
    };

    const moveShapeDown = () => {
        if (currentShape) {
            setCurrentShape(prevShape => ({
                ...prevShape,
                y: prevShape.y + 1
            }));
        }
    };

    const placeShape = useCallback(() => {
        setCurrentShape(currentShape => {
            if (!currentShape) return null;

            const newBlocks = currentShape.shape.flatMap((row, y) =>
                row.map((color, x) => color ? {
                    color,
                    x: currentShape.x + x,
                    y: currentShape.y + y,
                } : null)
            ).filter(block => block !== null);

            console.log('Placing shape:', newBlocks);

            setBottomBlocks(prevBottomBlocks => {
                const updatedBlocks = [...prevBottomBlocks, ...newBlocks];
                console.log('Updated bottom blocks:', updatedBlocks);
                return updatedBlocks.sort((a, b) => b.y - a.y);
            });

            // Check for matches after the shape is placed
            setTimeout(checkForMatches, 0);

            return null; // Clear the current shape
        });
    }, [checkForMatches]);

    const checkForMatches = useCallback(() => {
        let matchFound = false;
        let matchedRows = [];

        setBottomBlocks(prevBlocks => {
            let newBottomBlocks = [...prevBlocks];

            // Check for horizontal matches (full row of the same color)
            for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
                const rowBlocks = newBottomBlocks.filter(block => block.y === y);
                if (rowBlocks.length === BOARD_WIDTH && rowBlocks.every(block => block.color === rowBlocks[0].color)) {
                    matchFound = true;
                    matchedRows.push(y);
                }
            }

            if (matchFound) {
                setIsDraggingDisabled(true);
                setTimeout(() => animateMatchAndDrop(matchedRows, newBottomBlocks), 0);
            }

            return newBottomBlocks;
        });
    }, [animateMatchAndDrop]);

    const animateMatchAndDrop = useCallback((matchedRows, blocks) => {
        // Step 1: Turn matched rows white
        setBottomBlocks(blocks.map(block =>
            matchedRows.includes(block.y) ? { ...block, color: 'white' } : block
        ));

        // Step 2: Remove matched rows and prepare blocks for dropping
        setTimeout(() => {
            setBottomBlocks(prevBlocks => {
                const blocksToKeep = prevBlocks.filter(block => !matchedRows.includes(block.y));
                const blocksToMove = blocksToKeep.filter(block => block.y < Math.min(...matchedRows));
                const staticBlocks = blocksToKeep.filter(block => block.y > Math.max(...matchedRows));

                const droppedBlocks = blocksToMove.map(block => ({
                    ...block,
                    y: block.y + matchedRows.filter(row => row > block.y).length
                }));

                const newBlocks = [...staticBlocks, ...droppedBlocks];

                // Update score and lines completed
                setScore(prevScore => {
                    const baseScore = matchedRows.length * BOARD_WIDTH * 10;
                    const bonus = matchedRows.length > 1 ? Math.pow(2, matchedRows.length - 1) * 100 : 0;
                    return prevScore + baseScore + bonus;
                });
                setLinesCompleted(prevLines => prevLines + matchedRows.length);

                // Re-enable dragging and check for new matches
                setIsDraggingDisabled(false);
                setTimeout(() => checkForMatches(), 0);

                return newBlocks;
            });
        }, 500); // Adjust timing as needed
    }, [checkForMatches]);

    const handleMouseDown = (e) => {
        if (gameOver || !gameStarted || isDraggingDisabled) return;

        const rect = boardRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const x = Math.floor(mouseX / BLOCK_SIZE);
        const y = Math.floor(mouseY / BLOCK_SIZE);

        const clickedBlock = bottomBlocks.find(block => block.x === x && block.y === y);
        if (clickedBlock) {
            setDraggedBlock({ ...clickedBlock, originalX: clickedBlock.x, originalY: clickedBlock.y });
        }
    };

    const handleMouseMove = (e) => {
        if (!draggedBlock) return;

        const rect = boardRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const x = Math.floor(mouseX / BLOCK_SIZE);
        const y = Math.floor(mouseY / BLOCK_SIZE);

        setDraggedBlock(prev => ({ ...prev, x, y }));
        setMousePosition({ x: mouseX, y: mouseY });

        const hoverTarget = bottomBlocks.find(block =>
            block.x === x && block.y === y &&
            (block.x !== draggedBlock.originalX || block.y !== draggedBlock.originalY)
        );
        setHoverBlock(hoverTarget);
    };

    const handleMouseUp = () => {
        if (!isDraggingDisabled && draggedBlock && hoverBlock) {
            setBottomBlocks(prevBlocks => {
                const updatedBlocks = prevBlocks.map(block => {
                    if (block.x === draggedBlock.originalX && block.y === draggedBlock.originalY) {
                        return { ...block, color: hoverBlock.color };
                    }
                    if (block.x === hoverBlock.x && block.y === hoverBlock.y) {
                        return { ...block, color: draggedBlock.color };
                    }
                    return block;
                });
                return updatedBlocks;
            });

            // Check for matches after updating the blocks
            setTimeout(() => checkForMatches(), 0);
        }
        setDraggedBlock(null);
        setHoverBlock(null);
    };

    const renderCurrentShape = () => {
        if (!currentShape) return null;
        return currentShape.shape.flatMap((row, y) =>
            row.map((color, x) => color ? (
                <Block
                    key={`current-${x}-${y}`}
                    color={color}
                    x={currentShape.x + x}
                    y={currentShape.y + y}
                    isDraggable={false}
                    blockSize={BLOCK_SIZE}
                />
            ) : null)
        ).filter(block => block !== null);
    };

    const renderBottomBlocks = () => {
        return bottomBlocks.map((block, index) => (
            <Block
                key={`bottom-${index}`}
                {...block}
                isTransparent={draggedBlock && block.x === draggedBlock.originalX && block.y === draggedBlock.originalY}
                isWiggling={block === hoverBlock}
                isDraggable={true}
                blockSize={BLOCK_SIZE}
            />
        ));
    };

    const renderDraggedBlockCopy = () => {
        if (!draggedBlock) return null;
        const boardRect = boardRef.current.getBoundingClientRect();
        return (
            <Block
                key="dragged-copy"
                color={draggedBlock.color}
                x={(mousePosition.x - boardRect.left) / BLOCK_SIZE - 0.5}
                y={(mousePosition.y - boardRect.top) / BLOCK_SIZE - 0.5}
                isMouseAttached={true}
                isDraggable={false}
                blockSize={BLOCK_SIZE}
            />
        );
    };

    const renderPreviewShape = (shape) => {
        if (!shape) return null;
        const shapeWidth = shape[0].length;
        const shapeHeight = shape.length;
        const containerSize = 80; // Size of the container in pixels
        const blockSize = Math.min(containerSize / Math.max(shapeWidth, shapeHeight), 20); // Use smaller of 20px or size that fits container

        // Calculate offsets to center the shape
        const offsetX = (containerSize - shapeWidth * blockSize) / 2;
        const offsetY = (containerSize - shapeHeight * blockSize) / 2;

        return shape.flatMap((row, y) =>
            row.map((color, x) => color ? (
                <div
                    key={`preview-${x}-${y}`}
                    style={{
                        position: 'absolute',
                        left: `${offsetX + x * blockSize}px`,
                        top: `${offsetY + y * blockSize}px`,
                        width: `${blockSize}px`,
                        height: `${blockSize}px`,
                        backgroundColor: color,
                        border: '1px solid rgba(0, 0, 0, 0.2)',
                        boxSizing: 'border-box',
                    }}
                />
            ) : null)
        );
    };

    const renderHeldShape = () => {
        if (!heldShape) return null;
        const shapeWidth = heldShape[0].length;
        const shapeHeight = heldShape.length;
        const containerSize = 80; // Size of the container in pixels
        const blockSize = Math.min(containerSize / Math.max(shapeWidth, shapeHeight), 20); // Use smaller of 20px or size that fits container

        // Calculate offsets to center the shape
        const offsetX = (containerSize - shapeWidth * blockSize) / 2;
        const offsetY = (containerSize - shapeHeight * blockSize) / 2;

        return heldShape.flatMap((row, y) =>
            row.map((color, x) => color ? (
                <div
                    key={`held-${x}-${y}`}
                    style={{
                        position: 'absolute',
                        left: `${offsetX + x * blockSize}px`,
                        top: `${offsetY + y * blockSize}px`,
                        width: `${blockSize}px`,
                        height: `${blockSize}px`,
                        backgroundColor: color,
                        border: '1px solid rgba(0, 0, 0, 0.2)',
                        boxSizing: 'border-box',
                    }}
                />
            ) : null)
        );
    };

    const handleGameOver = useCallback(() => {
        console.log('Game Over triggered');
        setGameOver(true);
        setCurrentShape(null);
        setGameStarted(false);
        // You might want to add any other game over logic here
    }, []);

    useEffect(() => {
        console.log('Game over state changed:', gameOver);
    }, [gameOver]);

    useEffect(() => {
        if (testFullBoard) {
            setBottomBlocks(testFullBoard);
            setGameOver(true);
        }
    }, [testFullBoard]);

    // Add this new function for instant drop
    const instantDrop = useCallback(() => {
        if (currentShape) {
            let newY = currentShape.y;
            while (canMoveTo(currentShape.x, newY + 1, currentShape.shape)) {
                newY++;
            }
            setCurrentShape(prev => ({ ...prev, y: newY }));
            // Use setTimeout to ensure state update before placing
            setTimeout(() => placeShape(), 0);
        }
    }, [currentShape, canMoveTo, placeShape]);

    return (
        <div className="game-content">
            <div className="game-board-container">
                <div className="side-container left-container">
                    <div className="held-shape-container">
                        <h3>Held Piece</h3>
                        <div className="held-shape">
                            {renderHeldShape()}
                        </div>
                    </div>
                    <div className="score-container">
                        <div>SCORE: {score}</div>
                        <div>LINES: {linesCompleted}</div>
                    </div>
                </div>
                <div
                    data-testid="game-board"
                    ref={boardRef}
                    className="game-board"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {renderBottomBlocks()}
                    {renderCurrentShape()}
                    {renderDraggedBlockCopy()}
                    {gameOver && <div className="game-over">Game Over</div>}
                    {!gameStarted && (
                        <div className="start-button-container">
                            <button className="start-button" onClick={initializeGame}>
                                Start Game
                            </button>
                        </div>
                    )}
                </div>
                <div className="side-container right-container">
                    <div className="next-shapes-container">
                        <h3>Next Piece</h3>
                        <div className="next-shapes">
                            {gameStarted ? (
                                nextShapes && nextShapes.length > 0 && renderPreviewShape(nextShapes[0])
                            ) : (
                                <span></span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <MobileControls
                onMove={(dx, dy) => gameFunctions.moveShape(dx, dy)}
                onRotate={gameFunctions.rotateShape}
                onHold={holdShape}
                onInstantDrop={instantDrop}
            />
        </div>
    );
};

export default GameBoard;
