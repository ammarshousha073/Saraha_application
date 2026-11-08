
import express from "express";

import { PORT } from "./config.js";
import { bootstrapDB } from "./DB/conniction.db.js";

import {
    globalErrorHandling,
    corsMiddleware,
    helmetMiddleware,
    morganMiddleware
} from "./middleware/index.js";

import {
    authcontroller,
    messagecontroller,
    usercontroller
} from "./modules/index.js";


const app = express();

app.use(morganMiddleware);

app.use(helmetMiddleware);

app.options("/{*dummy}", corsMiddleware);
app.use(corsMiddleware);

app.use(express.json());

app.use("/assets", express.static("./assets"));


app.all("/", (req, res) => {
    res.status(200).send({
        message: "WELCOME"
    });
});


app.use("/auth", authcontroller);
app.use("/message", messagecontroller);
app.use("/user", usercontroller);


app.all("/{*dummy}", (req, res) => {
    res.status(404).send({
        message: "INVALID APPLICATION ROUTING"
    });
});


app.use(globalErrorHandling);


bootstrapDB(app, PORT);
