import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import notFound from "./errors/notFound";
import globalErrorHandler from "./errors/globalErrorhandler";
import router from "./app/routes";
import { stripeWebhooks } from "./app/modules/stripe/stripe.webhook";
import config from "./app/config";

const app: Application = express();

app.post("/api/v1/subscription/webhook", express.raw({ type: "application/json" }), stripeWebhooks.handleStripeWebhook);

const corsOptions = {
    origin: ["http://localhost:3000", "http://10.10.7.111:3000", "http://localhost:3001", "http://10.10.26.188:3000", "https://vibez.apponislam.top"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public"), { index: false }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req: Request, res: Response) => {
    const indexPath = path.join(__dirname, "../public/index.html");
    fs.readFile(indexPath, "utf8", (err, html) => {
        if (err) {
            return res.status(500).send("Error loading status page");
        }
        const env = config.node_env || "production";
        const port = config.port || "5000";
        const formattedEnv = env.charAt(0).toUpperCase() + env.slice(1).toLowerCase();

        const modifiedHtml = html
            .replace("{{NODE_ENV}}", formattedEnv)
            .replace("{{PORT}}", String(port));

        res.send(modifiedHtml);
    });
});

app.use("/api/v1", router);

app.use(notFound);
app.use(globalErrorHandler);

export default app;

