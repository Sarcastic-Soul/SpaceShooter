import { Game } from './game.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const canvas = document.querySelector('canvas');
    const scoreElement = document.querySelector('#scoreValue');
    const startModal = document.querySelector('#start-modal');
    const endModal = document.querySelector('#end-modal');
    const startButton = document.querySelector('#startGameBtn');
    const restartButton = document.querySelector('#restartGameBtn');

    // Create game instance
    const game = new Game(canvas, scoreElement, startModal, endModal, startButton,restartButton);

    // Handle window resize
    function handleResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // If game is running, update player position to center
        if (game.player) {
            game.player.x = canvas.width / 2;
            game.player.y = canvas.height / 2;
        }
    }

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Prevent right click menu
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Handle visibility change to pause/resume game
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && game.enemySpawnInterval) {
            clearInterval(game.enemySpawnInterval);
        } else if (!document.hidden && game.animationId && !game.enemySpawnInterval) {
            game.spawnEnemies();
        }
    });

    // Track high score in localStorage
    window.addEventListener('beforeunload', () => {
        const highScore = localStorage.getItem('highScore') || 0;
        if (game.score > highScore) {
            localStorage.setItem('highScore', game.score);
        }
    });
});