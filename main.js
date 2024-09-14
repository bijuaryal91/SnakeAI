// Get the canvas element and its 2D drawing context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const box = 20; // Size of each box in the grid
let snake = [{ x: 9 * box, y: 9 * box }]; // Initial position of the snake
let direction = ''; // Current direction of the snake
let food = spawnFood(); // Spawn the first food item
let score = 0; // Initial score

// Load sound effects for the game
const foodSound = new Audio('./music/food.mp3');
const gameOverSound = new Audio('./music/gameover.mp3');
const moveSound = new Audio('./music/move.mp3');

// Start the game loop
setInterval(game, 100);

// Function to spawn food at a random position not occupied by the snake
function spawnFood() {
    let newFood;
    let validPosition = false;

    while (!validPosition) {
        newFood = {
            x: Math.floor(Math.random() * (canvas.width / box)) * box,
            y: Math.floor(Math.random() * (canvas.height / box)) * box,
        };
        // Check if the new food position overlaps with the snake
        validPosition = !snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    }

    return newFood; // Return the valid food position
}

// Main game function
function game() {
    if (isGameOver()) {
        clearInterval(game); // Stop the game loop
        gameOverSound.play(); // Play game over sound
        alert('Game Over! Your score: ' + score); // Display game over message
        document.location.reload(); // Reload the game
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        drawSnake(); // Draw the snake
        drawFood(); // Draw the food
        moveSnake(); // Move the snake based on the direction
        drawScore(); // Draw the current score
    }
}

// Function to draw the snake on the canvas
function drawSnake() {
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? 'green' : 'lightgreen'; // Different color for the head
        ctx.fillRect(segment.x, segment.y, box, box); // Draw the segment
        ctx.strokeStyle = 'darkgreen'; // Border color
        ctx.strokeRect(segment.x, segment.y, box, box); // Draw the border
    });
}

// Function to draw the food on the canvas
function drawFood() {
    ctx.fillStyle = 'red'; // Color of the food
    ctx.fillRect(food.x, food.y, box, box); // Draw the food
}

// Function to move the snake
function moveSnake() {
    const path = findPath(snake[0], food); // Find the path to the food
    if (path.length > 1) {
        const nextMove = path[1]; // Get the next move
        direction = getDirection(snake[0], nextMove); // Set the direction based on the path
    } else {
        // If no path found, move in a safe direction or follow a fallback pattern
        direction = getSafeDirection(snake[0]) || followPattern();
    }

    const head = { x: snake[0].x, y: snake[0].y }; // Get the current head position
    // Update the head position based on the direction
    if (direction === 'LEFT') head.x -= box;
    if (direction === 'UP') head.y -= box;
    if (direction === 'RIGHT') head.x += box;
    if (direction === 'DOWN') head.y += box;

    // Check if the snake has eaten the food
    if (head.x === food.x && head.y === food.y) {
        score++; // Increase the score
        foodSound.play(); // Play food sound
        food = spawnFood(); // Spawn new food
    } else {
        snake.pop(); // Remove the last segment if food not eaten
    }

    snake.unshift(head); // Add the new head to the snake
}

// Function to draw the score on the canvas
function drawScore() {
    ctx.fillStyle = 'white'; // Color of the score text
    ctx.font = '20px Arial'; // Font style
    ctx.fillText('Score: ' + score, box, box); // Display the score
}

// Function to check if the game is over
function isGameOver() {
    const head = snake[0]; // Get the head position
    // Check if the head is out of bounds or collides with itself
    if (
        head.x < 0 || head.x >= canvas.width ||
        head.y < 0 || head.y >= canvas.height ||
        snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)
    ) {
        return true; // Game is over
    }
    return false; // Game is still ongoing
}

// Function to get the direction based on current and next position
function getDirection(from, to) {
    if (to.x < from.x) return 'LEFT';
    if (to.x > from.x) return 'RIGHT';
    if (to.y < from.y) return 'UP';
    if (to.y > from.y) return 'DOWN';
}

// Function to get a safe direction to move in
function getSafeDirection(head) {
    const directions = [
        { direction: 'LEFT', x: head.x - box, y: head.y },
        { direction: 'UP', x: head.x, y: head.y - box },
        { direction: 'RIGHT', x: head.x + box, y: head.y },
        { direction: 'DOWN', x: head.x, y: head.y + box }
    ];

    // Check each direction for safety
    for (const dir of directions) {
        if (dir.x >= 0 && dir.x < canvas.width && dir.y >= 0 && dir.y < canvas.height &&
            !snake.some(segment => segment.x === dir.x && segment.y === dir.y)) {
            return dir.direction; // Return the first safe direction found
        }
    }
    return null; // No safe direction found
}

// Function to follow a fallback movement pattern if no safe direction is found
function followPattern() {
    const head = snake[0];
    const fallbackPattern = ['LEFT', 'UP', 'RIGHT', 'DOWN']; // Movement pattern to try
    for (const dir of fallbackPattern) {
        const nextPos = getNextPosition(head, dir); // Get the next position
        if (isPositionSafe(nextPos)) {
            return dir; // Return the first valid direction found
        }
    }
    return 'RIGHT'; // Default direction if no safe direction is found
}

// Function to get the next position based on the current position and direction
function getNextPosition(pos, direction) {
    if (direction === 'LEFT') return { x: pos.x - box, y: pos.y };
    if (direction === 'UP') return { x: pos.x, y: pos.y - box };
    if (direction === 'RIGHT') return { x: pos.x + box, y: pos.y };
    if (direction === 'DOWN') return { x: pos.x, y: pos.y + box };
    return pos; // Return the original position if direction is invalid
}

// Function to check if a position is safe (within bounds and not colliding with the snake)
function isPositionSafe(pos) {
    return pos.x >= 0 && pos.x < canvas.width && pos.y >= 0 && pos.y < canvas.height &&
           !snake.some(segment => segment.x === pos.x && segment.y === pos.y);
}

// A* Pathfinding algorithm to find the shortest path to the food
function findPath(start, end) {
    const openList = []; // Nodes to be evaluated
    const closedList = []; // Nodes already evaluated
    openList.push({ pos: start, g: 0, h: heuristic(start, end), f: heuristic(start, end), parent: null });

    while (openList.length > 0) {
        openList.sort((a, b) => a.f - b.f); // Sort open list by f value
        const currentNode = openList.shift(); // Get the node with the lowest f value
        closedList.push(currentNode); // Add current node to closed list

        // If the end position is reached, construct the path
        if (currentNode.pos.x === end.x && currentNode.pos.y === end.y) {
            const path = [];
            let current = currentNode;
            while (current) {
                path.unshift(current.pos); // Add the position to the path
                current = current.parent; // Move to the parent node
            }
            return path; // Return the found path
        }

        const neighbors = getNeighbors(currentNode.pos); // Get neighboring positions
        for (const neighbor of neighbors) {
            // Skip if neighbor is already evaluated
            if (closedList.some(node => node.pos.x === neighbor.x && node.pos.y === neighbor.y)) continue;

            const g = currentNode.g + 1; // Cost from start to neighbor
            const h = heuristic(neighbor, end); // Heuristic cost to end
            const f = g + h; // Total cost
            let existingNode = openList.find(node => node.pos.x === neighbor.x && node.pos.y === neighbor.y);

            // If neighbor is not in open list, add it
            if (!existingNode) {
                openList.push({ pos: neighbor, g, h, f, parent: currentNode });
            } else if (g < existingNode.g) {
                // If the new path to neighbor is better, update it
                existingNode.g = g;
                existingNode.f = f;
                existingNode.parent = currentNode;
            }
        }
    }

    return [start]; // No path found, return start position
}

// Heuristic function for estimating distance (Manhattan distance)
function heuristic(pos, end) {
    return Math.abs(pos.x - end.x) + Math.abs(pos.y - end.y);
}

// Function to get valid neighbors of a position
function getNeighbors(pos) {
    const neighbors = [
        { x: pos.x - box, y: pos.y },
        { x: pos.x + box, y: pos.y },
        { x: pos.x, y: pos.y - box },
        { x: pos.x, y: pos.y + box }
    ];

    // Filter neighbors to return only valid positions
    return neighbors.filter(neighbor =>
        neighbor.x >= 0 && neighbor.x < canvas.width &&
        neighbor.y >= 0 && neighbor.y < canvas.height &&
        !snake.some(segment => segment.x === neighbor.x && segment.y === neighbor.y)
    );
}
