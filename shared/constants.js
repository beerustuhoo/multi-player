export const CONSTANTS = {
    // Arena Dimensions
    ARENA_WIDTH: 1200,
    ARENA_HEIGHT: 600,

    // Physics
    GRAVITY: 0.8,
    FRICTION: 0.85,
    MOVE_ACCEL: 1.5,
    MAX_SPEED: 10,
    JUMP_FORCE: -18,

    // Player
    PLAYER_WIDTH: 40,
    PLAYER_HEIGHT: 80,
    PLAYER_HP: 100,
    SPAWN_DELAY: 2000,

    // Combat
    PUNCH_DAMAGE: 10,
    PUNCH_COOLDOWN: 250,
    PUNCH_RANGE: 60,

    KICK_DAMAGE: 15,
    KICK_COOLDOWN: 500,
    KICK_RANGE: 90,

    TICK_RATE: 60, // Server tick rate (60 Hz to match client render rate)

    // Power-Ups
    POWERUP_TYPES: {
        SPEED_BOOST: 'speed_boost',
        DAMAGE_BOOST: 'damage_boost'
    },
    POWERUP_DURATION: 10000, // 10 seconds
    POWERUP_SPAWN_INTERVAL_MIN: 15000,
    POWERUP_SPAWN_INTERVAL_MAX: 30000,
    POWERUP_SIZE: 30,
};
