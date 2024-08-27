import React, { useState, useEffect, useCallback, useRef } from 'react';
import Block from './block';

const COLORS = ['red', 'green', 'blue'];
const SHAPES = [
    [[1, 1], [1, 1]], // Square
    [[1, 1, 1, 1]], // Line
    [[1, 1, 1], [0, 1, 0]], // T-shape
    [[1, 1, 0], [0, 1, 1]], // Z-shape
    [[0, 1, 1], [1, 1, 0]], // S-shape
    [[1, 1, 1], [1, 0, 0]], // L-shape
    [[1, 1, 1], [0, 0, 1]], // J-shape
];

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 20;

const GameBoard = () => {
    const [blocks, setBlocks] = useState([]);
    const [currentShape, setCurrentShape] = useState(null);
    const [gameOver, setGameOver] = useState(false);
    const [draggedBlock, setDraggedBlock] = useState(null);
    const boardRef = useRef(null);

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
        if (gameOver) return;
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
                rotateShape();
                break;
            default:
                break;
        }
    }, [moveShape, rotateShape, gameOver]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        const gameLoop = setInterval(() => {
            if (!gameOver && currentShape) {
                moveShapeDown();
            }
        }, 1000);

        return () => clearInterval(gameLoop);
    }, [currentShape, gameOver]);

    const canMoveTo = (newX, newY, shape) => {
        return shape.every((row, dy) =>
            row.every((cell, dx) =>
                cell === 0 || (
                    newX + dx >= 0 &&
                    newX + dx < BOARD_WIDTH &&
                    newY + dy < BOARD_HEIGHT &&
                    !blocks.some(block =>
                        block.x === newX + dx && block.y === newY + dy
                    )
                )
            )
        );
    };

    const spawnNewShape = () => {
        const shapeIndex = Math.floor(Math.random() * SHAPES.length);
        const shape = SHAPES[shapeIndex].map(row =>
            row.map(cell => cell ? COLORS[Math.floor(Math.random() * COLORS.length)] : 0)
        );
        const newShape = { shape, x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shape[0].length / 2), y: 0 };
        if (canMoveTo(newShape.x, newShape.y, newShape.shape)) {
            setCurrentShape(newShape);
        } else {
            setGameOver(true);
        }
    };

    const moveShapeDown = () => {
        if (currentShape && canMoveTo(currentShape.x, currentShape.y + 1, currentShape.shape)) {
            setCurrentShape(prev => ({ ...prev, y: prev.y + 1 }));
        } else {
            placeShape();
        }
    };

    const placeShape = () => {
        if (!currentShape) return;
        
        setBlocks(prevBlocks => [
            ...prevBlocks,
            ...currentShape.shape.flatMap((row, y) =>
                row.map((color, x) => color ? {
                    color,
                    x: currentShape.x + x,
                    y: currentShape.y + y,
                } : null)
            ).filter(block => block !== null)
        ]);

        checkForMatches();
        spawnNewShape();
    };

    const checkForMatches = () => {
        // Implement logic to check for matching colors and score points
    };

    const handleMouseDown = (e) => {
        if (!currentShape || gameOver) return;
        
        const rect = boardRef.current.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / BLOCK_SIZE);
        const y = Math.floor((e.clientY - rect.top) / BLOCK_SIZE);
        
        const blockY = y - currentShape.y;
        const blockX = x - currentShape.x;

        if (blockY >= 0 && blockY < currentShape.shape.length &&
            blockX >= 0 && blockX < currentShape.shape[0].length &&
            currentShape.shape[blockY][blockX] !== 0) {
            setDraggedBlock({ x: blockX, y: blockY, color: currentShape.shape[blockY][blockX] });
        }
    };

    const handleMouseMove = (e) => {
        if (draggedBlock) {
            const rect = boardRef.current.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / BLOCK_SIZE) - currentShape.x;
            const y = Math.floor((e.clientY - rect.top) / BLOCK_SIZE) - currentShape.y;
            
            setDraggedBlock(prev => ({ ...prev, x, y }));
        }
    };

    const handleMouseUp = () => {
        if (draggedBlock && currentShape) {
            const newShape = currentShape.shape.map(row => [...row]);
            const { x, y, color } = draggedBlock;

            // Ensure the dragged block's original position is cleared
            newShape[draggedBlock.y][draggedBlock.x] = 0;

            // Check if the new position is within bounds and not occupied
            if (y >= 0 && y < newShape.length && x >= 0 && x < newShape[0].length && newShape[y][x] === 0) {
                // Check if the new position is connected to another block
                let isValidMove = false;
                for (let dy = Math.max(0, y - 1); dy <= Math.min(newShape.length - 1, y + 1); dy++) {
                    for (let dx = Math.max(0, x - 1); dx <= Math.min(newShape[0].length - 1, x + 1); dx++) {
                        if ((dy !== y || dx !== x) && newShape[dy][dx] !== 0) {
                            isValidMove = true;
                            break;
                        }
                    }
                    if (isValidMove) break;
                }

                if (isValidMove) {
                    newShape[y][x] = color;
                    setCurrentShape(prev => ({ ...prev, shape: newShape }));
                } else {
                    // Revert the change if the new position is invalid
                    newShape[draggedBlock.y][draggedBlock.x] = color;
                }
            } else {
                // Revert the change if the new position is out of bounds or occupied
                newShape[draggedBlock.y][draggedBlock.x] = color;
            }
        }
        setDraggedBlock(null);
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
                    isDragging={draggedBlock && draggedBlock.x === x && draggedBlock.y === y}
                />
            ) : null)
        ).filter(block => block !== null);
    };

    useEffect(() => {
        if (!currentShape) {
            spawnNewShape();
        }
    }, [currentShape]);

    return (
        <div
            ref={boardRef}
            className="game-board"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {blocks.map((block, index) => (
                <Block key={index} {...block} />
            ))}
            {renderCurrentShape()}
        </div>
    );
};

export default GameBoard;
