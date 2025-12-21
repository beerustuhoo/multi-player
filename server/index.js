import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameRoom } from './GameRoom.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
    }
});

const PORT = process.env.PORT || 3000;

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));

    app.get(/(.*)/, (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

// Simple room management (single room for now)
const defaultRoomId = 'default-room';
const gameRoom = new GameRoom(defaultRoomId, io);

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('joinGame', (username) => {
        console.log(`Player ${socket.id} joining as ${username}`);
        gameRoom.addPlayer(socket, username);
    });

    socket.on('input', (inputs) => {
        gameRoom.handleInput(socket.id, inputs);
    });

    socket.on('togglePause', () => {
        gameRoom.togglePause(socket.id);
    });

    socket.on('requestStartGame', () => {
        gameRoom.requestStartGame(socket.id);
    });


    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        gameRoom.removePlayer(socket.id);
    });
});

httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
