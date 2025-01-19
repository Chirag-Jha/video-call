// server.js
import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);
const allusers = {};

const __dirname = dirname(fileURLToPath(import.meta.url));


app.use(express.static("public"));

app.get("/", (req, res) => {
    console.log("GET Request / "); 
    res.sendFile(join(__dirname, "/app/index.html"));
});

// Handle socket.io connections
io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("join-user", (username) => {
        console.log(`${username} joined the connection.`);
        allusers[username] = { username, id: socket.id };
        io.emit("joined", allusers);
    });

    socket.on("offer", ({ from, to, offer }) => {
        if (allusers[to]) {
            io.to(allusers[to].id).emit("offer", { from, to, offer });
        }
    });

    socket.on("answer", ({ from, to, answer }) => {
        if (allusers[from]) {
            io.to(allusers[from].id).emit("answer", { from, to, answer });
        }
    });

    socket.on("end-call", ({ from, to }) => {
        if (allusers[to]) {
            io.to(allusers[to].id).emit("end-call", { from, to });
        }
    });

    socket.on("call-ended", (caller) => {
        const [from, to] = caller;
        if (allusers[from] && allusers[to]) {
            io.to(allusers[from].id).emit("call-ended", caller);
            io.to(allusers[to].id).emit("call-ended", caller);
        }
    });

    socket.on("icecandidate", ({ to, candidate }) => {
        if (allusers[to]) {
            io.to(allusers[to].id).emit("icecandidate", candidate);
        }
    });
});

server.listen(9000, () => {
    console.log("Server is running on port 9000");
});
