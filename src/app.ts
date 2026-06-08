import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import notFound from "./errors/notFound";
import globalErrorHandler from "./errors/globalErrorhandler";
import router from "./app/routes";
import { stripeWebhooks } from "./app/modules/stripe/stripe.webhook";

const app: Application = express();

app.post("/api/v1/subscription/webhook", express.raw({ type: "application/json" }), stripeWebhooks.handleStripeWebhook);

const corsOptions = {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.use("/api/v1", router);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
