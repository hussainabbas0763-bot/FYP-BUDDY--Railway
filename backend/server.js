import express from "express"
import 'dotenv/config'
import { createServer } from 'http'
import { Server } from 'socket.io'
import connectDB from "./database/db.js"
import userRoute from "./routes/userRoute.js"
import groupFormationRoute from "./routes/groupFormationRoutes.js"
import supervisorRequestRoute from "./routes/supervisorRequestRoutes.js"
import taskRoutes from "./routes/taskRoutes.js"
import milestoneRoutes from "./routes/milestoneRoutes.js"
import gradingRoutes from "./routes/gradingRoutes.js"
import thesisRoutes from "./routes/thesisRoutes.js"
import sampleDocumentRoutes from "./routes/sampleDocumentRoutes.js"
import announcementRoutes from "./routes/announcementRoutes.js"
import deletionRoutes from "./routes/deletionRoutes.js"
import chatRoutes from "./routes/chatRoutes.js"
import chatbotRoutes from "./routes/chatbotRoutes.js"
import { registerChatGateway } from "./socket/chatGateway.js"
import cors from 'cors'
import path from "path"



const app = express()
const server = createServer(app)

const PORT = process.env.PORT || 3000
const Frontend_Url = process.env.FRONTEND_URL;

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: [Frontend_Url],
        credentials: true
    }
});

// Register chat gateway
registerChatGateway(io);

app.use(express.json())
app.use(cors({
    origin: [Frontend_Url],
    credentials: true
}));

app.use('/user', userRoute)
app.use('/group', groupFormationRoute)
app.use('/supervisor', supervisorRequestRoute)
app.use('/task', taskRoutes)
app.use('/milestone', milestoneRoutes)
app.use('/grading', gradingRoutes)
app.use('/thesis', thesisRoutes)
app.use('/sample-documents', sampleDocumentRoutes)
app.use('/announcements', announcementRoutes)
app.use('/deletion', deletionRoutes)
app.use('/chat', chatRoutes)
app.use('/chatbot', chatbotRoutes)

//short api to keep render alive
app.get("/ping", (req, res) => {
    res.status(200).send("OK");
  });

const __dirname = path.resolve();

// Serve static files from frontend build - MUST come after API routes
app.use(express.static(path.join(__dirname, "/frontend/dist")));

    // app.get("*", (req, res) => {
    //     res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"))
    // });

server.listen(PORT, () => {
    connectDB()
    console.log(`Server is listening at port ${PORT}`);
})