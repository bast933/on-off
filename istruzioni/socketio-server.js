// server.js (versione Socket.io)
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3000;

// Serviamo i file statici
app.use(express.static(path.join(__dirname, 'public')));

// Teniamo traccia dello stato del gioco
let user1Pressed = false;
let user2Pressed = false;
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log(`Nuovo utente connesso: ${socket.id}`);
    
    // Inviamo l'ID di connessione al client
    socket.emit('connectionId', socket.id);
    
    // Inviamo lo stato attuale del gioco
    socket.emit('gameState', {
        user1Pressed,
        user2Pressed
    });
    
    // Gestiamo la selezione del ruolo
    socket.on('setRole', (role) => {
        console.log(`Utente ${socket.id} ha selezionato il ruolo: ${role}`);
        connectedUsers.set(socket.id, role);
    });
    
    // Gestiamo la pressione dei pulsanti
    socket.on('buttonPress', (user) => {
        if (user === 'user1') {
            user1Pressed = true;
        } else if (user === 'user2') {
            user2Pressed = true;
        }
        
        // Notifichiamo tutti i client
        io.emit('buttonPress', user);
    });
    
    // Gestiamo la disconnessione
    socket.on('disconnect', () => {
        console.log(`Utente disconnesso: ${socket.id}`);
        connectedUsers.delete(socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
});
