import app from "./app";
import config from "./config";
import { initDB } from "./db";

const port = config.port;

const main = async () => {
  try {
    await initDB();

    app.listen(port, () => {
      console.log(`DevPulse Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

main();