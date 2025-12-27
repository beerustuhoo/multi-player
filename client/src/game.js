import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';
import { Physics } from '../../shared/physics.js';
import { CONSTANTS } from '../../shared/constants.js';
import { Network } from './network.js';
import { AudioManager } from './audio.js';

export class Game {
    constructor() {
        this.arena = document.getElementById('game-arena');
        this.renderer = new Renderer(this.arena);
        this.input = new InputHandler();
        this.network = new Network(this);
        this.audio = new AudioManager();
        this.isRunning = false;

        this.players = [];
        this.localId = null;
    }

    // Event Handlers for UI
    setupUI() {
        // Pause/Resume
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isRunning) {
                this.network.togglePause();
            }
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            this.network.togglePause();
        });

        document.getElementById('game-pause-btn').addEventListener('click', () => {
            this.network.togglePause();
            // Blur the button so Space key (Jump) doesn't re-trigger it
            document.getElementById('game-pause-btn').blur();
        });

        document.getElementById('quit-btn').addEventListener('click', () => {
            window.location.reload();
        });

        const fsBtn = document.getElementById('fullscreen-btn');
        if (fsBtn) {
            fsBtn.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => {
                        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                    });
                } else {
                    document.exitFullscreen();
                }
            });
        }
    }

    start() {
        this.renderer.init();
        this.setupUI();
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop.bind(this));
    }

    join(username) {
        this.network.joinGame(username);
        // Do not start until confirmation
    }

    onJoinSuccess() {
        this.isRunning = true;
        this.start();
    }

    onJoinError(msg) {
        alert(msg); // Simple alert for now, or use a callback to UI
    }

    onStateUpdate(state) {
        this.players = state.players;
        this.powerups = state.powerups;

        if (!this.localId && this.network.socket.id) {
            this.localId = this.network.socket.id;
        }

        const timerEl = document.getElementById('timer');
        if (state.timer !== undefined && timerEl) {
            const minutes = Math.floor(state.timer / 60).toString().padStart(2, '0');
            const seconds = Math.floor(state.timer % 60).toString().padStart(2, '0');
            timerEl.innerText = `${minutes}:${seconds}`;
        }

        // Update Scoreboard
        const scoreboardEl = document.getElementById('scoreboard');
        if (scoreboardEl && this.players) {
            scoreboardEl.innerHTML = '';
            const sortedPlayers = [...this.players].sort((a, b) => b.score - a.score);
            sortedPlayers.forEach(p => {
                const item = document.createElement('div');
                item.className = 'score-item';
                item.style.color = p.color;
                item.innerText = `${p.name}: ${p.score}`;
                scoreboardEl.appendChild(item);
            });
        }
    }



    onGameStart() {
        // Optional: show "GO!" message
        this.audio.playTone(600, 'sine', 0.5);
        // Clear system messages
        const msgArea = document.getElementById('message-area');
        if (msgArea) msgArea.innerText = '';
    }

    onServerMessage(msg) {
        const msgArea = document.getElementById('message-area');
        if (msgArea) {
            msgArea.innerText = msg;
            // Clear after a few seconds
            setTimeout(() => {
                if (msgArea.innerText === msg) {
                    msgArea.innerText = '';
                }
            }, 5000);
        }
    }

    onGameEnd(data) {
        console.log('Game End Data Received:', data);
        this.isRunning = false;
        const endScreen = document.getElementById('end-screen');
        const gameScreen = document.getElementById('game-screen');
        const winnerText = document.getElementById('winner-text');

        gameScreen.classList.add('hidden');
        endScreen.classList.remove('hidden');
        winnerText.innerText = `${data.winner} (${data.reason})`;

        const endScores = document.getElementById('end-scores');
        if (endScores && data.scores) {
            endScores.innerHTML = `
                <div class="score-header">
                    <span>Rank</span>
                    <span>Player</span>
                    <span>Score</span>
                </div>
            `;

            data.scores.forEach((p, index) => {
                const item = document.createElement('div');
                item.className = `score-item rank-${index + 1}`;

                const rank = document.createElement('span');
                rank.className = 'rank';
                rank.innerText = `#${index + 1}`;

                const name = document.createElement('span');
                name.className = 'player-name';
                name.innerText = p.name;
                name.style.color = p.color;

                const score = document.createElement('span');
                score.className = 'player-score';
                score.innerText = p.score;

                item.append(rank, name, score);
                endScores.appendChild(item);
            });
        }
    }

    onGamePaused(isPaused) {
        const pauseMenu = document.getElementById('pause-menu');
        const timerEl = document.getElementById('timer');

        if (isPaused) {
            pauseMenu.classList.remove('hidden');
            if (timerEl) timerEl.innerText += " (PAUSED)";
        } else {
            pauseMenu.classList.add('hidden');
        }
    }

    onPlayerHit({ type }) {
        if (type === 'punch') {
            this.audio.playPunch();
        } else {
            this.audio.playKick();
        }
    }

    onPlayerKO() {
        this.audio.playKO();
    }

    loop(timestamp) {
        if (!this.isRunning) return;
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(dt);
        this.render();
        requestAnimationFrame(this.loop.bind(this));
    }

    update(dt) {
        const inputState = this.input.getState();
        const player = this.players.find(p => p.id === this.localId);

        // Client side sound trigger for jump
        if (player && inputState.jump && player.isGrounded) {
            this.audio.playJump();
        }

        this.network.sendInput(inputState);
    }

    render() {
        this.renderer.renderPlayers(this.players);
        this.renderer.renderPowerups(this.powerups);
    }
}
