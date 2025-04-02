let board;
let boardheight = 600;
let boardwidth = 600;
let context;

let gameOver = false;
let score = 0;

class Snake {
  constructor(snakeX, snakeY, snakeHeight, snakeWidth) {
    this.snakeX = snakeX;
    this.snakeY = snakeY;
    this.snakeHeight = snakeHeight;
    this.snakeWidth = snakeWidth;
    this.direction = null;
    this.lastMoveTime = 0; // Tracks the last time the snake moved
    this.moveInterval = 200; // Time in milliseconds between movements
    this.segments = [{ x: snakeX, y: snakeY }]; // Array to store the snake's segments
  }

  drawSnake() {
    context.fillStyle = "darkblue";
    this.segments.forEach((segment) => {
      context.fillRect(segment.x, segment.y, this.snakeWidth, this.snakeHeight);
    });
  }

  setDirection(e) {
    if (e.code == "ArrowLeft" || e.code == "KeyA") {
      this.direction = "Left";
    } else if (e.code == "ArrowRight" || e.code == "KeyD") {
      this.direction = "Right";
    } else if (e.code == "ArrowUp" || e.code == "KeyW") {
      this.direction = "Up";
    } else if (e.code == "ArrowDown" || e.code == "KeyS") {
      this.direction = "Down";
    }
  }

  updateDirection(timestamp) {
    // Move the snake only if enough time has passed
    if (timestamp - this.lastMoveTime > this.moveInterval) {
      let newHead = { x: this.snakeX, y: this.snakeY };

      if (this.direction === "Left") {
        newHead.x -= grid.blockSize;
      } else if (this.direction === "Right") {
        newHead.x += grid.blockSize;
      } else if (this.direction === "Up") {
        newHead.y -= grid.blockSize;
      } else if (this.direction === "Down") {
        newHead.y += grid.blockSize;
      }

      // Update snakeX and snakeY to the new head position
      this.snakeX = newHead.x;
      this.snakeY = newHead.y;

      // Add the new head to the segments
      this.segments.unshift(newHead);

      // Remove the last segment to maintain the size
      this.segments.pop();

      this.lastMoveTime = timestamp; // Update the last move time
    }
  }

  grow() {
    const tail = this.segments[this.segments.length - 1];
    const secondLast = this.segments[this.segments.length - 2] || tail;

    // Determine the direction of the tail to add the new segment correctly
    let newSegment = { x: tail.x, y: tail.y };
    if (tail.x < secondLast.x) {
      newSegment.x -= grid.blockSize; // Extend left
    } else if (tail.x > secondLast.x) {
      newSegment.x += grid.blockSize; // Extend right
    } else if (tail.y < secondLast.y) {
      newSegment.y -= grid.blockSize; // Extend up
    } else if (tail.y > secondLast.y) {
      newSegment.y += grid.blockSize; // Extend down
    }

    // Ensure the new segment does not overlap with any existing segment
    while (
      this.segments.some(
        (segment) => segment.x === newSegment.x && segment.y === newSegment.y
      )
    ) {
      newSegment.x += grid.blockSize; // Adjust position to avoid overlap
    }

    this.segments.push(newSegment); // Add the new segment to the tail
  }

  outOfBounds() {
    if (
      this.snakeX < 0 ||
      this.snakeX >= boardwidth ||
      this.snakeY < 0 ||
      this.snakeY >= boardheight
    ) {
      gameOver = true;

      return true; // Indicate that the snake is out of bounds
    }
    return false; // Indicate that the snake is within bounds
  }

  resetSnakePosition() {
    this.snakeX = 50;
    this.snakeY = 50;
    this.direction = null;
    this.lastMoveTime = 0; // Reset the last move time
    this.moveInterval = 200; // Reset the move interval
    this.segments = [{ x: this.snakeX, y: this.snakeY }]; // Reset the segments
    gameOver = false; // Reset game over state
  }

  resetGame() {
    this.resetSnakePosition();
    context.clearRect(0, 0, boardwidth, boardheight);

    this.drawSnake();

    gameOver = false;
    requestAnimationFrame(update);
  }

  // Check if the snake has eaten itself
  checkSelfCollision() {
    // Start checking from the second segment to avoid comparing the head with itself
    for (let i = 1; i < this.segments.length; i++) {
      if (
        this.segments[0].x === this.segments[i].x && // Compare head's x with segment's x
        this.segments[0].y === this.segments[i].y // Compare head's y with segment's y
      ) {
        gameOver = true;
        return true;
      }
    }
    return false; // No collision detected
  }
}

class Food {
  constructor(foodX, foodY, foodWidth, foodHeight) {
    this.foodX = foodX;
    this.foodY = foodY;
    this.foodWidth = foodWidth;
    this.foodHeight = foodHeight;
    this.foodImage = new Image();
    this.foodImage.src = "./apple.png";
  }

  drawFood() {
    context.fillStyle = "red";
    context.drawImage(
      this.foodImage,
      this.foodX,
      this.foodY,
      this.foodWidth,
      this.foodHeight
    );
  }

  // Check if the snake has eaten the food
  checkIfEaten() {
    if (
      this.foodX < snake.snakeX + snake.snakeWidth &&
      this.foodX + this.foodWidth > snake.snakeX &&
      this.foodY < snake.snakeY + snake.snakeHeight &&
      this.foodY + this.foodHeight > snake.snakeY
    ) {
      // Generate a new food position
      do {
        this.foodX = Math.floor(Math.random() * (boardwidth / 50)) * 50;
        this.foodY = Math.floor(Math.random() * (boardheight / 50)) * 50;
      } while (
        snake.segments.some(
          (segment) => segment.x === this.foodX && segment.y === this.foodY
        )
      );

      // Grow the snake
      snake.grow();
    }
  }
}

class Grid {
  constructor(gridX, gridY, gridwidth, gridheight, blockSize) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.gridwidth = gridwidth;
    this.gridheight = gridheight;
    this.blockSize = blockSize;
  }

  drawGrid() {
    // Set the background color
    context.fillStyle = "grey"; // Dark background
    context.fillRect(0, 0, boardwidth, boardheight);

    // Set the grid line color
    context.strokeStyle = "white"; // Light grid lines
    context.lineWidth = 1;
    // Draw vertical lines
    for (let i = 0; i <= boardwidth; i += this.blockSize) {
      context.beginPath();
      context.moveTo(i, 0);
      context.lineTo(i, boardheight);
      context.stroke();
      context.fillStyle = "white"; // Reset fill style
    }

    // Draw horizontal lines
    for (let i = 0; i <= boardheight; i += this.blockSize) {
      context.beginPath();
      context.moveTo(0, i);
      context.lineTo(boardwidth, i);
      context.stroke();
    }
  }

  gameOverScreen() {
    context.fillStyle = "white";
    context.font = "30px Arial";
    context.textAlign = "center";
    context.fillText(
      "Game Over! Press 'R' to Restart",
      boardwidth / 2,
      boardheight / 2
    );

    // Draw the snake in grey
    context.fillStyle = "grey";
    context.fillRect(
      snake.snakeX,
      snake.snakeY,
      snake.snakeWidth,
      snake.snakeHeight
    );
  }
}

window.onload = () => {
  board = document.getElementById("board");
  board.width = boardwidth;
  board.height = boardheight;
  context = board.getContext("2d");

  // Add an event listener for keydown
  document.addEventListener("keydown", (e) => {
    snake.setDirection(e);
  });

  requestAnimationFrame(update);
};

// instantiate the classes
let snake = new Snake(50, 50, 50, 50);
let grid = new Grid(0, 0, boardwidth, boardheight, 50);
let food = new Food(100, 100, 50, 50);

function update(timestamp) {
  // Clear the board before redrawing
  context.clearRect(0, 0, boardwidth, boardheight);

  // Draw the grid
  grid.drawGrid();

  // Check if the snake is out of bounds
  if (snake.outOfBounds()) {
    gameOver = true;
    grid.gameOverScreen(); // Show the game-over screen
    return; // Stop the game loop
  }

  // Check if the snake has eaten itself
  if (snake.checkSelfCollision()) {
    gameOver = true;
    grid.gameOverScreen();
    return;
  }

  // Draw snake
  snake.drawSnake();

  // Draw food
  food.drawFood();

  // Check if the snake has eaten the food
  food.checkIfEaten();
  // Draw the food again after checking for collision
  food.drawFood();

  // Update snake position
  snake.updateDirection(timestamp);

  // Draw score background
  context.fillStyle = "rgba(255, 255, 255, 0.8)"; // Semi-transparent white background
  context.fillRect(boardwidth - 150, 10, 140, 40); // Positioned at the top-right corner

  // Draw score text
  context.fillStyle = "black";
  context.font = "20px Arial";
  context.textAlign = "center";
  context.fillText(
    `Score: ${snake.segments.length - 1}`,
    boardwidth - 80, // Centered within the background box
    35
  );

  requestAnimationFrame(update);
}

// Add a key listener to reset the game when the user presses "R"
document.addEventListener("keydown", (e) => {
  if (e.code === "KeyR" && gameOver) {
    snake.resetGame();
  }
});
