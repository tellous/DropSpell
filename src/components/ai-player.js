import { COLORS, BOARD_WIDTH, BOARD_HEIGHT } from './gameboard';

class AIPlayer {
  constructor(getGameState, gameFunctions) {
    this.getGameState = getGameState;
    this.gameFunctions = gameFunctions;
    this.lastMoveTime = 0;
  }

  analyzeGameState() {
    const gameState = this.getGameState();
    if (!gameState || !gameState.bottomBlocks || !gameState.currentShape) {
      return null;
    }
    return {
      boardState: this.getBoardState(gameState.bottomBlocks),
      currentShape: gameState.currentShape,
    };
  }

  getBoardState(bottomBlocks) {
    const board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(null));
    bottomBlocks.forEach(block => {
      board[block.y][block.x] = block.color;
    });
    return board;
  }

  evaluateMove(boardState, move, currentShape) {
    const { rotation, x } = move;
    const rotatedShape = this.rotateShape(currentShape.shape, rotation);
    const y = this.findDropPosition(boardState, rotatedShape, x);
    
    if (y === null) return -Infinity; // Invalid move

    const newBoardState = this.applyMove(boardState, rotatedShape, x, y);
    return this.scoreBoard(newBoardState);
  }

  rotateShape(shape, rotation) {
    let rotatedShape = shape;
    for (let i = 0; i < rotation; i++) {
      rotatedShape = rotatedShape[0].map((_, index) =>
        rotatedShape.map(row => row[index]).reverse()
      );
    }
    return rotatedShape;
  }

  findDropPosition(boardState, shape, x) {
    for (let y = 0; y <= BOARD_HEIGHT - shape.length; y++) {
      if (!this.canPlaceShape(boardState, shape, x, y + 1)) {
        return y;
      }
    }
    return null;
  }

  canPlaceShape(boardState, shape, x, y) {
    if (x < 0 || x + shape[0].length > BOARD_WIDTH || y + shape.length > BOARD_HEIGHT) {
      return false;
    }
    for (let dy = 0; dy < shape.length; dy++) {
      for (let dx = 0; dx < shape[0].length; dx++) {
        if (shape[dy][dx] && boardState[y + dy][x + dx] !== null) {
          return false;
        }
      }
    }
    return true;
  }

  applyMove(boardState, shape, x, y) {
    const newBoardState = boardState.map(row => [...row]);
    for (let dy = 0; dy < shape.length; dy++) {
      for (let dx = 0; dx < shape[0].length; dx++) {
        if (shape[dy][dx]) {
          newBoardState[y + dy][x + dx] = shape[dy][dx];
        }
      }
    }
    return newBoardState;
  }

  scoreBoard(boardState) {
    let score = 0;
    let holes = 0;
    let blockades = 0;

    for (let x = 0; x < BOARD_WIDTH; x++) {
      let blockFound = false;
      for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (boardState[y][x] !== null) {
          blockFound = true;
        } else if (blockFound) {
          holes++;
        }
      }
    }

    for (let y = 0; y < BOARD_HEIGHT; y++) {
      const rowColors = new Set(boardState[y].filter(color => color !== null));
      if (rowColors.size === 1 && boardState[y].every(color => color !== null)) {
        score += 1000; // High score for complete row of same color
      } else if (rowColors.size === 1) {
        score += 100 * boardState[y].filter(color => color !== null).length; // Score for partial row of same color
      }

      // Check for blockades (filled cells above empty cells)
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (boardState[y][x] !== null && y > 0 && boardState[y-1][x] === null) {
          blockades++;
        }
      }
    }

    // Penalize holes and blockades
    score -= holes * 50;
    score -= blockades * 25;

    // Bonus for lower placement
    const highestBlock = boardState.findIndex(row => row.some(cell => cell !== null));
    score += (BOARD_HEIGHT - highestBlock) * 10;

    return score;
  }

  findBestMove() {
    const gameState = this.analyzeGameState();
    if (!gameState) return null;

    const { boardState, currentShape } = gameState;
    let bestMove = null;
    let bestScore = -Infinity;

    for (let rotation = 0; rotation < 4; rotation++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const move = { rotation, x };
        const score = this.evaluateMove(boardState, move, currentShape);
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }

    if (bestMove === null || bestScore <= 0) {
      console.log('AI: No good move found, choosing random move');
      return {
        rotation: Math.floor(Math.random() * 4),
        x: Math.floor(Math.random() * BOARD_WIDTH),
        isRandom: true
      };
    }

    return bestMove;
  }

  rearrangeBottomBlocks() {
    const gameState = this.getGameState();
    if (!gameState || !gameState.bottomBlocks) return;

    const bottomBlocks = [...gameState.bottomBlocks];
    let rearranged = false;

    for (let i = 0; i < bottomBlocks.length; i++) {
      for (let j = i + 1; j < bottomBlocks.length; j++) {
        if (bottomBlocks[i].color === bottomBlocks[j].color && 
            Math.abs(bottomBlocks[i].x - bottomBlocks[j].x) === 1 &&
            bottomBlocks[i].y === bottomBlocks[j].y) {
          // Found two adjacent blocks of the same color
          const emptySpot = this.findEmptySpotNearby(bottomBlocks, bottomBlocks[i].x, bottomBlocks[i].y);
          if (emptySpot) {
            // Move one of the blocks to the empty spot
            this.gameFunctions.moveBlock(bottomBlocks[i], emptySpot.x, emptySpot.y);
            rearranged = true;
            break;
          }
        }
      }
      if (rearranged) break;
    }
  }

  findEmptySpotNearby(bottomBlocks, x, y) {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dx, dy] of directions) {
      const newX = x + dx;
      const newY = y + dy;
      if (newX >= 0 && newX < BOARD_WIDTH && newY >= 0 && newY < BOARD_HEIGHT &&
          !bottomBlocks.some(block => block.x === newX && block.y === newY)) {
        return { x: newX, y: newY };
      }
    }
    return null;
  }

  makeMove() {
    const currentTime = Date.now();
    if (currentTime - this.lastMoveTime < 500) {
      console.log('AI: Skipping move due to cooldown');
      return;
    }

    // Try to rearrange bottom blocks
    this.rearrangeBottomBlocks();

    const move = this.findBestMove();
    console.log('AI: Move found:', move);

    if (move) {
      const currentState = this.getGameState();
      if (currentState && currentState.currentShape) {
        console.log('AI: Executing move:', move);
        console.log('Current shape position:', currentState.currentShape.x, currentState.currentShape.y);
        
        // Rotate the shape
        for (let i = 0; i < move.rotation; i++) {
          console.log('AI: Rotating shape');
          this.gameFunctions.rotateShape();
        }
        
        // Move the shape horizontally
        const dx = move.x - currentState.currentShape.x;
        console.log('AI: Moving shape by', dx);
        this.gameFunctions.moveShape(dx, 0);
        
        // If it's a random move, drop the piece immediately
        if (move.isRandom) {
          console.log('AI: Dropping piece immediately');
          this.dropPiece();
        }
        
        this.lastMoveTime = currentTime;
      } else {
        console.log('AI: No current shape, skipping move');
      }
    } else {
      console.log('AI: No valid move found');
    }
  }

  dropPiece() {
    let canMoveDown = true;
    while (canMoveDown) {
      canMoveDown = this.gameFunctions.moveShape(0, 1);
    }
    // Force the piece to be placed
    this.gameFunctions.placeShape();
  }
}

export default AIPlayer;
