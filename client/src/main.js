import { io } from "socket.io-client";
import { Game } from './game.js';

console.log('Client initializing...');

// Basic socket connection test
const socket = io();
const game = new Game();

socket.on('connect', () => {
    console.log('Connected to server with ID:', socket.id);
});

// Preliminary UI logic
const joinScreen = document.getElementById('join-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const gameScreen = document.getElementById('game-screen');
const joinBtn = document.getElementById('join-btn');
const usernameInput = document.getElementById('username-input');

joinBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) {
        console.log('Joining as:', username);
        joinScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        game.join(username);
    }
});

document.getElementById('lobby-return-btn').addEventListener('click', () => {
    window.location.reload(); // Simple reload to go back to title for now
});
