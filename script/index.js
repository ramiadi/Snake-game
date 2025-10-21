let board;
let boardheight = 600;
let boardwidth = 600;
let context;

let gameOver = false;
let score = 0;
let effectsEnabled = true; // toggle for visual effects

// helper: draw rounded rectangle (from MDN pattern)
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof radius === "number") {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
    const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
    for (let side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius.br,
    y + height
  );
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function updateScore() {
  const el = document.getElementById("score");
  if (el) el.textContent = `Score: ${Math.max(0, snake.segments.length - 1)}`;
}

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
    // head orientation for smooth rotation
    this.headAngle = 0; // radians
    this.targetAngle = 0; // radians
    // blinking
    this.blinkTimer = 0;
    this.blinkInterval = 2000 + Math.random() * 3000; // ms
    this.blinkDuration = 140; // ms
    this.isBlinking = false;
  }

  drawSnake() {
    // nicer rounded segments with glow when effects enabled
    this.segments.forEach((segment, idx) => {
      const x = segment.x + 1;
      const y = segment.y + 1;
      const w = this.snakeWidth - 2;
      const h = this.snakeHeight - 2;

      // gradient head color
      if (idx === 0) {
        const headGrad = context.createLinearGradient(x, y, x + w, y + h);
        headGrad.addColorStop(0, "#60a5fa");
        headGrad.addColorStop(1, "#1e3a8a");
        context.fillStyle = headGrad;
      } else {
        context.fillStyle = "#2563eb";
      }

      if (effectsEnabled) {
        context.shadowColor = "rgba(96,165,250,0.5)";
        context.shadowBlur = 12;
      } else {
        context.shadowBlur = 0;
      }

      roundRect(context, x, y, w, h, 8, true, false);
      // draw eyes/nose for the head
      if (idx === 0) {
        // Determine eye positions based on direction
        const eyeRadius = Math.max(2, Math.floor(w * 0.08));
        let exOffset = Math.floor(w * 0.18);
        let eyOffset = Math.floor(h * 0.22);

        // default eye positions (facing right)
        let leftEye = { x: x + w - exOffset - eyeRadius, y: y + eyOffset };
        let rightEye = { x: x + w - exOffset - eyeRadius, y: y + h - eyOffset };
        let nose = { x: x + w - 6, y: y + h / 2 };

        if (this.direction === "Left") {
          leftEye = { x: x + exOffset + eyeRadius, y: y + eyOffset };
          rightEye = { x: x + exOffset + eyeRadius, y: y + h - eyOffset };
          nose = { x: x + 6, y: y + h / 2 };
        } else if (this.direction === "Up") {
          leftEye = { x: x + exOffset, y: y + eyOffset };
          rightEye = { x: x + w - exOffset, y: y + eyOffset };
          nose = { x: x + w / 2, y: y + 6 };
        } else if (this.direction === "Down") {
          leftEye = { x: x + exOffset, y: y + h - eyOffset };
          rightEye = { x: x + w - exOffset, y: y + h - eyOffset };
          nose = { x: x + w / 2, y: y + h - 6 };
        }

        // draw eye whites
        context.save();
        context.fillStyle = "#fff";
        context.beginPath();
        context.arc(leftEye.x, leftEye.y, eyeRadius, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.arc(rightEye.x, rightEye.y, eyeRadius, 0, Math.PI * 2);
        context.fill();

        // pupils
        context.fillStyle = "#111827";
        const pupilR = Math.max(1, Math.floor(eyeRadius * 0.55));
        context.beginPath();
        context.arc(leftEye.x, leftEye.y, pupilR, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.arc(rightEye.x, rightEye.y, pupilR, 0, Math.PI * 2);
        context.fill();

        // small nose indicator (triangle)
        context.fillStyle = "#f97316";
        context.beginPath();
        if (this.direction === "Left") {
          context.moveTo(nose.x - 4, nose.y);
          context.lineTo(nose.x + 4, nose.y - 3);
          context.lineTo(nose.x + 4, nose.y + 3);
        } else if (this.direction === "Right" || !this.direction) {
          context.moveTo(nose.x + 4, nose.y);
          context.lineTo(nose.x - 4, nose.y - 3);
          context.lineTo(nose.x - 4, nose.y + 3);
        } else if (this.direction === "Up") {
          context.moveTo(nose.x, nose.y - 4);
          context.lineTo(nose.x - 3, nose.y + 4);
          context.lineTo(nose.x + 3, nose.y + 4);
        } else if (this.direction === "Down") {
          context.moveTo(nose.x, nose.y + 4);
          context.lineTo(nose.x - 3, nose.y - 4);
          context.lineTo(nose.x + 3, nose.y - 4);
        }
        context.closePath();
        context.fill();

        // subtle eye highlight when effects enabled
        if (effectsEnabled) {
          context.fillStyle = "rgba(255,255,255,0.6)";
          context.beginPath();
          context.arc(
            leftEye.x - 1,
            leftEye.y - 1,
            Math.max(1, Math.floor(eyeRadius * 0.3)),
            0,
            Math.PI * 2
          );
          context.fill();
          context.beginPath();
          context.arc(
            rightEye.x - 1,
            rightEye.y - 1,
            Math.max(1, Math.floor(eyeRadius * 0.3)),
            0,
            Math.PI * 2
          );
          context.fill();
        }

        context.restore();
      }
      context.shadowBlur = 0;
    });
  }

  setDirection(e) {
    if (e.code == "ArrowLeft" || e.code == "KeyA") {
      this.direction = "Left";
      this.targetAngle = Math.PI; // 180deg
    } else if (e.code == "ArrowRight" || e.code == "KeyD") {
      this.direction = "Right";
      this.targetAngle = 0; // 0deg
    } else if (e.code == "ArrowUp" || e.code == "KeyW") {
      this.direction = "Up";
      this.targetAngle = -Math.PI / 2; // -90deg (upwards)
    } else if (e.code == "ArrowDown" || e.code == "KeyS") {
      this.direction = "Down";
      this.targetAngle = Math.PI / 2; // 90deg (downwards)
    }
  }

  // update head orientation and blinking; dt in milliseconds
  updateHead(dt) {
    // rotate headAngle toward targetAngle smoothly
    const TWO_PI = Math.PI * 2;
    let diff = (this.targetAngle - this.headAngle) % TWO_PI;
    if (diff > Math.PI) diff -= TWO_PI;
    if (diff < -Math.PI) diff += TWO_PI;
    const rotateSpeed = 0.006; // radians per ms
    const maxStep = rotateSpeed * dt;
    if (Math.abs(diff) <= maxStep) {
      this.headAngle = this.targetAngle;
    } else {
      this.headAngle += Math.sign(diff) * maxStep;
    }

    // blinking logic
    this.blinkTimer += dt;
    if (this.isBlinking) {
      if (this.blinkTimer >= this.blinkDuration) {
        this.isBlinking = false;
        this.blinkTimer = 0;
        this.blinkInterval = 2000 + Math.random() * 3000;
      }
    } else {
      if (this.blinkTimer >= this.blinkInterval) {
        this.isBlinking = true;
        this.blinkTimer = 0;
      }
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
    updateScore();
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
    // draw a circle with a pulsing effect and then the image on top
    const cx = this.foodX + this.foodWidth / 2;
    const cy = this.foodY + this.foodHeight / 2;
    const r = this.foodWidth / 2 - 4;

    if (effectsEnabled) {
      const t = performance.now() / 300;
      const pulse = 1 + Math.sin(t) * 0.08;
      context.save();
      context.globalAlpha = 0.9;
      context.beginPath();
      context.fillStyle = "rgba(255,80,80,0.12)";
      context.arc(cx, cy, r * pulse + 6, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    // draw apple image with slight inset
    const pad = 6;
    context.drawImage(
      this.foodImage,
      this.foodX + pad,
      this.foodY + pad,
      this.foodWidth - pad * 2,
      this.foodHeight - pad * 2
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
    // subtle checkerboard grid
    context.fillStyle = "#071f1f";
    context.fillRect(0, 0, boardwidth, boardheight);

    const bs = this.blockSize;
    for (let y = 0; y < boardheight; y += bs) {
      for (let x = 0; x < boardwidth; x += bs) {
        if ((x / bs + y / bs) % 2 === 0) {
          context.fillStyle = "rgba(255,255,255,0.02)";
          context.fillRect(x, y, bs, bs);
        }
      }
    }

    // optional grid lines (subtle)
    context.strokeStyle = "rgba(255,255,255,0.04)";
    context.lineWidth = 1;
    for (let i = 0; i <= boardwidth; i += bs) {
      context.beginPath();
      context.moveTo(i + 0.5, 0);
      context.lineTo(i + 0.5, boardheight);
      context.stroke();
    }
    for (let i = 0; i <= boardheight; i += bs) {
      context.beginPath();
      context.moveTo(0, i + 0.5);
      context.lineTo(boardwidth, i + 0.5);
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
  // set up high-DPI canvas scaling
  const dpr = window.devicePixelRatio || 1;
  board.width = boardwidth * dpr;
  board.height = boardheight * dpr;
  board.style.width = boardwidth + "px";
  board.style.height = boardheight + "px";
  context = board.getContext("2d");
  context.setTransform(dpr, 0, 0, dpr, 0, 0);

  // hook up HUD
  const effectsToggle = document.getElementById("effectsToggle");
  effectsToggle.addEventListener("change", (e) => {
    effectsEnabled = e.target.checked;
  });

  updateScore();

  // responsive scaling so the canvas always fits the viewport (avoids being cut off)
  function resizeCanvas() {
    const hud = document.querySelector(".hud");
    const gap = 24; // safe margin
    const hudHeight = hud ? hud.getBoundingClientRect().height : 0;

    const availableWidth = Math.max(
      200,
      Math.min(boardwidth, window.innerWidth - gap)
    );
    const availableHeight = Math.max(200, window.innerHeight - hudHeight - gap);

    const scale = Math.min(
      availableWidth / boardwidth,
      availableHeight / boardheight,
      1
    );

    const dispW = Math.floor(boardwidth * scale);
    const dispH = Math.floor(boardheight * scale);

    board.style.width = dispW + "px";
    board.style.height = dispH + "px";
  }

  // run once and on resize
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

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

  // in-canvas score display removed

  requestAnimationFrame(update);
}

// Add a key listener to reset the game when the user presses "R"
document.addEventListener("keydown", (e) => {
  if (e.code === "KeyR" && gameOver) {
    snake.resetGame();
  }
});
