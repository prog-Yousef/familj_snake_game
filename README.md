# Snake Game (React)


A simple Snake game built with React and Tailwind CSS.

## Features

- Classic Snake gameplay
- Score and High Score tracking (persisted in local storage)
- Power-ups:
    - Speed Boost
    - Score Multiplier
    - Shield
- Sound effects (can be muted)
- Keyboard controls (Arrow keys or WASD)
- Touch controls (Swipe)
- Responsive design with on-screen D-pad for mobile
- Pause and Reset functionality




## Getting Started

### Prerequisites



- Node.js and npm (or yarn) installed on your system.

### Installation and Running

1.  **Clone the repository (or download the files):**
    ```bash
    # If you have git
    # git clone <repository-url>
    # cd <repository-directory>
    ```
    If you've downloaded the files, make sure they are in a project directory.

2.  **Navigate to the project directory:**
    ```bash
    cd path/to/your/snake_gmae 
    ```

3.  **Install dependencies:**
    Using npm:
    ```bash
    npm install
    ```
    Or using yarn:
    ```bash
    yarn install
    ```

4.  **Start the development server:**
    Using npm:
    ```bash
    npm start
    ```
    Or using yarn:
    ```bash
    yarn start
    ```
    This will usually open the game in your default web browser at `http://localhost:3000`.

## How to Play

-   **Desktop:**
    -   Use **Arrow Keys** or **WASD** keys to control the snake's direction.
    -   Press **Spacebar** to pause/resume the game.
-   **Mobile/Touch Devices:**
    -   **Swipe** on the game board to change the snake's direction.
    -   Use the **on-screen D-pad** to control the snake.
    -   Tap the **Pause/Play button** in the center of the D-pad (or the main Pause button) to pause/resume.

## Game Elements

-   **Snake:** Control the snake to eat food and grow longer.
-   **Food:**
    -   🍎 **Red (Normal):** Standard food, gives 1 point (times current multiplier).
    -   🍀 **Green (Speed Boost):** Temporarily increases snake speed, gives 2 points (times current multiplier).
    -   ⭐ **Yellow (Score Multiplier):** Temporarily doubles your score gain, gives 3 points (times current multiplier).
    -   🛡️ **Blue (Shield):** Protects from one collision (wall or self), gives 1 point (times current multiplier).
-   **Score:** Your current score in the game.
-   **High Score:** The highest score achieved, saved locally.
-   **Game Speed:** Increases gradually every 5 points scored.

## Controls

-   **Pause/Resume:** Spacebar / On-screen button.
-   **Reset:** Reset button.
-   **Mute/Unmute:** Sound icon button.

## Project Structure

```
/public
  index.html      # Main HTML page
/src
  App.js          # Main application component
  SnakeGame.js    # The core Snake game logic and UI
  index.css       # Tailwind CSS and global styles
  index.js        # React entry point
package.json
tailwind.config.js
postcss.config.js
README.md
```

Enjoy the game! here https://familj-snake-game-nnp7.vercel.app/
