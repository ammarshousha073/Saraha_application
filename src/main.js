
import { PORT } from './config.js';
import { bootstrapDB } from './DB/conniction.db.js';
import { globalErrorhandling } from './middleware/index.js';
import {
    authcontroller,
    messagecontroller,
    usercontroller
} from './modules/index.js';
import express from 'express';

const app = express();

app.use(express.json());

app.all("/", (req, res) => {
    res.status(200).send({ message: "WELCOME" });
});

app.use("/auth", authcontroller);
app.use("/message", messagecontroller);
app.use("/user", usercontroller);

app.all("{/*dummy}", (req, res) => {
    res.status(404).send({
        message: "INVALID APPLICATION ROUTING"
    });
});

app.use(globalErrorhandling);

bootstrapDB(app, PORT);


