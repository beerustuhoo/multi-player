import { Physics } from '../shared/physics.js';
import { CONSTANTS } from '../shared/constants.js';

export class GameRoom {
    constructor(roomId, io) {
        this.roomId = roomId;
        this.io = io;
        this.players = new Map(); // id -> player object
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = Date.now();
        this.timer = 180; // 3 minutes in seconds
    }

    addPlayer(socket, name) {
        const player = {
            id: socket.id,
            name: name || `Player ${socket.id.substr(0, 4)}`,
            x: Math.random() * (CONSTANTS.ARENA_WIDTH - 100) + 50,
            y: 100,
            vx: 0,
            vy: 0,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
            facing: 'right',
            hp: CONSTANTS.PLAYER_HP,
            score: 0,
            isGrounded: false,
            punchCooldown: 0,
            kickCooldown: 0,
            lastUpdate: Date.now(),
            action: null,
            actionTimer: 0,
            inputs: { left: false, right: false, jump: false, attack1: false, attack2: false }
        };

        this.players.set(socket.id, player);
        socket.join(this.roomId);

        this.io.to(this.roomId).emit('playerJoined', player);
        socket.emit('currentPlayers', Array.from(this.players.values()));

        if (this.players.size >= 2 && !this.isRunning) {
            this.startGame();
        }
    }

    removePlayer(socketId) {
        this.players.delete(socketId);
        this.io.to(this.roomId).emit('playerLeft', socketId);

        if (this.players.size < 2 && this.isRunning) {
            this.endGame('Not enough players');
        }
    }

    handleInput(socketId, inputs) {
        const player = this.players.get(socketId);
        if (player) {
            player.inputs = inputs;
        }
    }

    togglePause() {
        if (!this.isRunning) return;
        this.isPaused = !this.isPaused;
        this.io.to(this.roomId).emit('gamePaused', this.isPaused);
    }

    startGame() {
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = Date.now();
        this.lastTimerUpdate = Date.now();
        this.io.to(this.roomId).emit('gameStart');

        this.intervalId = setInterval(() => {
            this.update();
        }, 1000 / CONSTANTS.TICK_RATE);
    }

    endGame(reason) {
        this.isRunning = false;
        clearInterval(this.intervalId);
        this.io.to(this.roomId).emit('gameEnd', { reason });
    }

    update() {
        if (this.isPaused) {
            this.lastTime = Date.now();
            this.lastTimerUpdate = Date.now();
            return;
        }

        const now = Date.now();
        this.lastTime = now;

        // Timer
        if (this.isRunning && this.timer > 0) {
            const delta = (now - (this.lastTimerUpdate || now)) / 1000;
            this.timer -= delta;
            this.lastTimerUpdate = now;

            if (this.timer <= 0) {
                this.timer = 0;
                this.endGame('Time Limit Reached');
            }
        } else {
            this.lastTimerUpdate = now;
        }

        for (const player of this.players.values()) {
            if (player.hp <= 0) continue;

            // Cooldowns
            if (player.punchCooldown > 0) player.punchCooldown -= (1000 / CONSTANTS.TICK_RATE);
            if (player.kickCooldown > 0) player.kickCooldown -= (1000 / CONSTANTS.TICK_RATE);

            // Apply Inputs
            if (player.inputs.left) {
                player.vx -= CONSTANTS.MOVE_ACCEL;
                player.facing = 'left';
            }
            if (player.inputs.right) {
                player.vx += CONSTANTS.MOVE_ACCEL;
                player.facing = 'right';
            }
            if (player.inputs.jump && player.isGrounded) {
                player.vy = CONSTANTS.JUMP_FORCE;
                player.isGrounded = false;
            }

            // Attacks
            if (player.inputs.attack1 && player.punchCooldown <= 0) {
                this.performAttack(player, 'punch');
            } else if (player.inputs.attack2 && player.kickCooldown <= 0) {
                this.performAttack(player, 'kick');
            }

            // Physics
            Physics.applyGravity(player);
            Physics.applyFriction(player);

            if (Math.abs(player.vx) > CONSTANTS.MAX_SPEED) {
                player.vx = Math.sign(player.vx) * CONSTANTS.MAX_SPEED;
            }

            Physics.moveEntity(player);
            Physics.constrainToArena(player);

            // Action Timer
            if (player.actionTimer > 0) {
                player.actionTimer -= (1000 / CONSTANTS.TICK_RATE) / 1000;
                if (player.actionTimer <= 0) {
                    player.actionTimer = 0;
                    player.action = null;
                }
            }
        }

        this.io.to(this.roomId).emit('stateUpdate', {
            players: Array.from(this.players.values()),
            time: now,
            timer: this.timer
        });
    }

    performAttack(attacker, type) {
        const isPunch = type === 'punch';
        const range = isPunch ? CONSTANTS.PUNCH_RANGE : CONSTANTS.KICK_RANGE;
        const damage = isPunch ? CONSTANTS.PUNCH_DAMAGE : CONSTANTS.KICK_DAMAGE;
        const cooldown = isPunch ? CONSTANTS.PUNCH_COOLDOWN : CONSTANTS.KICK_COOLDOWN;

        attacker[isPunch ? 'punchCooldown' : 'kickCooldown'] = cooldown;
        attacker.action = type;
        attacker.actionTimer = 0.2; // 200ms animation duration

        const attackX = attacker.facing === 'right' ? attacker.x + CONSTANTS.PLAYER_WIDTH : attacker.x - range;
        const attackRect = {
            x: attackX,
            y: attacker.y,
            width: range,
            height: CONSTANTS.PLAYER_HEIGHT
        };

        for (const target of this.players.values()) {
            if (target.id === attacker.id || target.hp <= 0) continue;

            const targetRect = {
                x: target.x,
                y: target.y,
                width: CONSTANTS.PLAYER_WIDTH,
                height: CONSTANTS.PLAYER_HEIGHT
            };

            if (Physics.checkCollision(attackRect, targetRect)) {
                this.applyDamage(target, attacker, damage, isPunch ? 'punch' : 'kick');
            }
        }
    }

    applyDamage(victim, attacker, amount, type) {
        victim.hp -= amount;
        this.io.to(this.roomId).emit('playerHit', { victimId: victim.id, type });

        if (victim.hp <= 0) {
            victim.hp = 0;
            attacker.score += 1;
            setTimeout(() => this.respawnPlayer(victim), CONSTANTS.SPAWN_DELAY);
            this.io.to(this.roomId).emit('playerKO', { victimId: victim.id, attackerId: attacker.id });
        }
    }

    respawnPlayer(player) {
        player.hp = CONSTANTS.PLAYER_HP;
        player.x = Math.random() * (CONSTANTS.ARENA_WIDTH - 100) + 50;
        player.y = 100;
        player.vx = 0;
        player.vy = 0;
        player.action = null;
        player.actionTimer = 0;
    }
}
