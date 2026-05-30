import express, { type Application, type Request, type Response } from "express";
import { authRouter } from "./modules/auth/auth.route";
import { issueRouter } from "./modules/issue/issue.route";
import globalErrorHandler from "./middleware/globalErrorHandler";

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
app.use("/api/issues", issueRouter);

// Global Error Handling Middleware
app.use(globalErrorHandler);

export default app;