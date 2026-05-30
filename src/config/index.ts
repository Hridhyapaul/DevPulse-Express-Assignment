import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

export default {
  port: process.env.PORT,
  connectionString: process.env.CONNECTION_STRING,
//   secretKey: process.env.JWT_SECRET_KEY,
};