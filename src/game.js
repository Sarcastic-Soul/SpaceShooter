import { GAME_SETTINGS } from './config.js';
import { Player } from './entities/player.js';
import { Projectile } from './entities/projectile.js';
import { Enemy } from './entities/enemy.js';
import { Particle } from './entities/particle.js';

export class Game {
    constructor(canvas, scoreElement, startModal, endModal, startButton, restartButton) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scoreElement = scoreElement;
        this.startModal = startModal;
        this.endModal = endModal;
        this.startButton = startButton;
        this.restartButton = restartButton;

        this.score = 0;
        this.animationId = null;
        this.enemySpawnInterval = null;

        this.player = null;
        this.projectiles = new Set();
        this.enemies = new Set();
        this.particles = new Set();

        this.boundAnimate = this.animate.bind(this);
        this.boundHandleClick = this.handleClick.bind(this); // Fixed this line

        this.initializeEventListeners();
        this.resizeCanvas();
    }

    initializeEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('click', this.boundHandleClick);
        this.startButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.startGame());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    startGame() {
        this.startModal.style.display = 'none';
        this.endModal.style.display = 'none';
        this.init();
        this.animate();
        this.spawnEnemies();

        // Display current high score
        const highScoreElement = this.startModal.querySelector('#high-score');
        const currentHighScore = localStorage.getItem('highScore') || 0;
        if (highScoreElement) {
            highScoreElement.textContent = currentHighScore;
        }
    }

    init() {
        this.score = 0;
        this.scoreElement.textContent = '0';
        this.projectiles.clear();
        this.enemies.clear();
        this.particles.clear();
        this.player = new Player(
            this.canvas.width / 2,
            this.canvas.height / 2,
            GAME_SETTINGS.PLAYER_RADIUS,
            'white'
        );
    }

    endGame() {
        cancelAnimationFrame(this.animationId);
        clearInterval(this.enemySpawnInterval);
        this.endModal.style.display = 'flex';

        const finalScore = this.endModal.querySelector('.modal-score');
        finalScore.textContent = this.score;

        // Update and display high score
        const highScoreElement = this.endModal.querySelector('#high-score');
        const currentHighScore = parseInt(localStorage.getItem('highScore')) || 0;

        if (this.score > currentHighScore) {
            localStorage.setItem('highScore', this.score);
            highScoreElement.textContent = this.score;
        } else {
            highScoreElement.textContent = currentHighScore;
        }
    }

    spawnEnemies() {
        this.enemySpawnInterval = setInterval(() => {
            const radius = Math.random() * (GAME_SETTINGS.ENEMY_MAX_RADIUS - GAME_SETTINGS.ENEMY_MIN_RADIUS)
                + GAME_SETTINGS.ENEMY_MIN_RADIUS;
            const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
            const spawnPoint = this.getRandomSpawnPoint(radius);

            const angle = Math.atan2(
                this.canvas.height / 2 - spawnPoint.y,
                this.canvas.width / 2 - spawnPoint.x
            );

            const velocity = {
                x: Math.cos(angle) * GAME_SETTINGS.ENEMY_SPEED,
                y: Math.sin(angle) * GAME_SETTINGS.ENEMY_SPEED
            };

            this.enemies.add(new Enemy(spawnPoint.x, spawnPoint.y, radius, color, velocity));
        }, GAME_SETTINGS.ENEMY_SPAWN_INTERVAL);
    }

    getRandomSpawnPoint(radius) {
        const edge = Math.floor(Math.random() * 4);
        const spawnPoint = { x: 0, y: 0 };

        switch (edge) {
            case 0: // Top
                spawnPoint.x = Math.random() * this.canvas.width;
                spawnPoint.y = 0 - radius;
                break;
            case 1: // Right
                spawnPoint.x = this.canvas.width + radius;
                spawnPoint.y = Math.random() * this.canvas.height;
                break;
            case 2: // Bottom
                spawnPoint.x = Math.random() * this.canvas.width;
                spawnPoint.y = this.canvas.height + radius;
                break;
            case 3: // Left
                spawnPoint.x = 0 - radius;
                spawnPoint.y = Math.random() * this.canvas.height;
                break;
        }

        return spawnPoint;
    }

    handleClick(event) {
        event.preventDefault();

        if (this.startModal.style.display === 'flex' || this.endModal.style.display === 'flex') {
            return; // Don't shoot when modal is visible
        }

        const angle = Math.atan2(
            event.clientY - this.canvas.height / 2,
            event.clientX - this.canvas.width / 2
        );

        const velocity = {
            x: Math.cos(angle) * GAME_SETTINGS.PROJECTILE_SPEED,
            y: Math.sin(angle) * GAME_SETTINGS.PROJECTILE_SPEED
        };

        this.projectiles.add(
            new Projectile(
                this.canvas.width / 2,
                this.canvas.height / 2,
                GAME_SETTINGS.PROJECTILE_RADIUS,
                'white',
                velocity
            )
        );
    }

    animate() {
        this.animationId = requestAnimationFrame(this.boundAnimate);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.player.draw(this.ctx);
        this.updateProjectiles();
        this.updateEnemies();
        this.updateParticles();
    }

    updateProjectiles() {
        for (const projectile of this.projectiles) {
            projectile.update(this.ctx);

            // Remove off-screen projectiles
            if (this.isOffScreen(projectile)) {
                this.projectiles.delete(projectile);
            }
        }
    }

    updateEnemies() {
        for (const enemy of this.enemies) {
            enemy.update(this.ctx);

            // Check collision with player
            if (this.checkCollision(enemy, this.player)) {
                this.endGame();
                return;
            }

            // Check collision with projectiles
            for (const projectile of this.projectiles) {
                if (this.checkCollision(enemy, projectile)) {
                    this.handleEnemyHit(enemy, projectile);
                }
            }
        }
    }

    updateParticles() {
        for (const particle of this.particles) {
            particle.update(this.ctx);
            if (particle.alpha <= 0) {
                this.particles.delete(particle);
            }
        }
    }

    createExplosion(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const velocity = {
                x: (Math.random() - 0.5) * 4,
                y: (Math.random() - 0.5) * 4
            };
            this.particles.add(new Particle(x, y, Math.random() * 2, color, velocity));
        }
    }

    handleEnemyHit(enemy, projectile) {
        this.createExplosion(projectile.x, projectile.y, enemy.color, GAME_SETTINGS.PARTICLE_COUNT);
        this.projectiles.delete(projectile);

        if (enemy.radius - 10 > GAME_SETTINGS.ENEMY_MIN_RADIUS) {
            this.score += 10;
            gsap.to(enemy, {
                radius: enemy.radius - 10
            });
        } else {
            this.score += 20;
            this.enemies.delete(enemy);
        }

        this.scoreElement.textContent = this.score;
    }

    checkCollision(obj1, obj2) {
        const dist = Math.hypot(obj1.x - obj2.x, obj1.y - obj2.y);
        return dist - obj1.radius - obj2.radius < 1;
    }

    isOffScreen(obj) {
        return (
            obj.x + obj.radius < 0 ||
            obj.x - obj.radius > this.canvas.width ||
            obj.y + obj.radius < 0 ||
            obj.y - obj.radius > this.canvas.height
        );
    }
}