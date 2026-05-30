import express, { type Application, type Request, type Response } from "express";
import { authRouter } from "./modules/auth/auth.route";

const app:Application = express();

// Middleware to parse JSON, text, and URL-encoded data
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "DevPulse Server is running!",
    success: true,
    author: "Hridhya Paul",
  });
});

app.use("/api/auth", authRouter);

export default app;