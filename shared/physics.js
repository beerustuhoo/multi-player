import { CONSTANTS } from './constants.js';

export class Physics {
    static applyGravity(entity) {
        entity.vy += CONSTANTS.GRAVITY;
    }

    static applyFriction(entity) {
        entity.vx *= CONSTANTS.FRICTION;
    }

    static moveEntity(entity) {
        entity.x += entity.vx;
        entity.y += entity.vy;
    }

    static constrainToArena(entity) {
        // Floor
        if (entity.y + CONSTANTS.PLAYER_HEIGHT > CONSTANTS.ARENA_HEIGHT) {
            entity.y = CONSTANTS.ARENA_HEIGHT - CONSTANTS.PLAYER_HEIGHT;
            entity.vy = 0;
            entity.isGrounded = true;
        } else {
            entity.isGrounded = false;
        }

        // Walls
        if (entity.x < 0) {
            entity.x = 0;
            entity.vx = 0;
        } else if (entity.x + CONSTANTS.PLAYER_WIDTH > CONSTANTS.ARENA_WIDTH) {
            entity.x = CONSTANTS.ARENA_WIDTH - CONSTANTS.PLAYER_WIDTH;
            entity.vx = 0;
        }
    }

    static checkCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }
}
