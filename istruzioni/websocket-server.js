// server.js
// Implementazione di un server WebSocket con Node.js e la libreria 'ws'

const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

// Creiamo un'app Express
const app = express();
const PORT = process.env.PORT || 3000;

// Serviamo i file statici dalla cartella 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Creiamo un server HTTP
const server = http.createServer(app);

// Creiamo un server WebSocket collegato al server HTTP
const wss = new WebSocket.Server({ server });

// Teniamo traccia delle connessioni e dello stato dei pulsanti
const connections = new Map();
let user1Pressed = false;
let user2Pressed = false;

// Gestiamo le connessioni WebSocket
wss.on('connection', (ws) => {
    // Generiamo un ID unico per la connessione
    const connectionId = Math.random().toString(36).substring(2, 10);
    
    // Teniamo traccia della connessione
    connections.set(ws, { id: connectionId, role: null });
    
    console.log(`Nuova connessione: ${connectionId}`);
    
    // Inviamo l'ID connessione al cliente
    ws.send(JSON.stringify({
        type: 'connectionId',
        id: connectionId
    }));
    
    // Inviamo lo stato attuale dei pulsanti
    ws.send(JSON.stringify({
        type: 'state',
        user1Pressed,
        user2Pressed
    }));
    
    // Gestiamo i messaggi dai client
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log(`Messaggio ricevuto da ${connectionId}:`, data);
            
            if (data.type === 'setRole') {
                // Aggiorniamo il ruolo dell'utente
                connections.get(ws).role = data.role;
                console.log(`Utente ${connectionId} ha selezionato il ruolo: ${data.role}`);
            } 
            else if (data.type === 'buttonPress') {
                if (data.user === 'user1') {
                    user1Pressed = true;
                } else if (data.user === 'user2') {
                    user2Pressed = true;
                }
                
                // Inviamo un aggiornamento a tutti i client connessi
                broadcast({
                    type: 'buttonPress',
                    user: data.user
                });
            }
        } catch (e) {
            console.error('Errore nella gestione del messaggio:', e);
        }
    });
    
    // Gestiamo la disconnessione del client
    ws.on('close', () => {
        const clientInfo = connections.get(ws);
        console.log(`Connessione chiusa: ${clientInfo.id}`);
        connections.delete(ws);
    });
});

// Funzione per inviare messaggi a tutti i client connessi
function broadcast(message) {
    const messageStr = JSON.stringify(message);
    connections.forEach((client, ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(messageStr);
        }
    });
}

// Avviamo il server
server.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
});
