import { GAME_SETTINGS } from '../config.js';

export class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update(ctx) {
        this.velocity.x *= GAME_SETTINGS.PARTICLE_FRICTION;
        this.velocity.y *= GAME_SETTINGS.PARTICLE_FRICTION;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= GAME_SETTINGS.PARTICLE_FADE_SPEED;
        this.draw(ctx);
    }
}