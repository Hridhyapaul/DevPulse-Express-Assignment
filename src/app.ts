import express, { type Application, type Request, type Response } from "express";

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

app.post("/", async (req: Request, res: Response) => {
    console.log("Received POST request with body:", req.body);
    res.status(200).json({
      message: "POST request received successfully!",
      success: true,
      data: req.body,
    });
});

export default app;