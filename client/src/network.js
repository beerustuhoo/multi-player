import { io } from "socket.io-client";

export class Network {
    constructor(game) {
        this.game = game;
        this.socket = io();
        this.bindEvents();
    }

    bindEvents() {
        this.socket.on('connect', () => {
            console.log('Connected to server with ID:', this.socket.id);
        });

        this.socket.on('playerJoined', (player) => {
            console.log('Player joined:', player);
        });

        this.socket.on('currentPlayers', (players) => {
            console.log('Received current players:', players);
        });

        this.socket.on('stateUpdate', (state) => {
            this.game.onStateUpdate(state);
        });

        this.socket.on('gameStart', () => {
            console.log('Game Started!');
            if (this.game.onGameStart) this.game.onGameStart();
        });

        this.socket.on('gameEnd', (data) => {
            console.log('Game Ended:', data);
            if (this.game.onGameEnd) this.game.onGameEnd(data);
        });

        this.socket.on('gamePaused', (isPaused) => {
            if (this.game.onGamePaused) this.game.onGamePaused(isPaused);
        });

        this.socket.on('playerHit', (data) => {
            if (this.game.onPlayerHit) this.game.onPlayerHit(data);
        });

        this.socket.on('playerKO', (data) => {
            if (this.game.onPlayerKO) this.game.onPlayerKO(data);
        });
    }

    joinGame(username) {
        this.socket.emit('joinGame', username);
    }

    sendInput(inputState) {
        this.socket.emit('input', inputState);
    }

    togglePause() {
        this.socket.emit('togglePause');
    }
}
