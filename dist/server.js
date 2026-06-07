
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  

// src/app.ts
import express from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config_default = {
  port: process.env.PORT,
  connectionString: process.env.CONNECTION_STRING,
  secretKey: process.env.JWT_SECRET_KEY,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN
};

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connectionString
});
var initDB = async () => {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'contributor',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(30) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'open',
        reporter_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
};
var db_default = pool;

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
var registerUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const existingUser = await db_default.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  if (existingUser.rowCount && existingUser.rowCount > 0) {
    const error = new Error("User already exists");
    error.statusCode = 400;
    throw error;
  }
  const allowedRoles = ["contributor", "maintainer"];
  if (role && !allowedRoles.includes(role)) {
    const error = new Error("Role must be contributor or maintainer");
    error.statusCode = 400;
    throw error;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await db_default.query(
    `
      INSERT INTO users
      (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [name, email, hashedPassword, role || "contributor"]
  );
  delete result.rows[0].password;
  return result.rows[0];
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await db_default.query(`SELECT * FROM users WHERE email = $1`, [
    email
  ]);
  if (userData.rowCount === 0) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  const user = userData.rows[0];
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error("Invalid password");
    error.statusCode = 401;
    throw error;
  }
  const jwtPayload = {
    id: user.id,
    role: user.role
  };
  const token = jwt.sign(jwtPayload, config_default.secretKey, {
    expiresIn: "1h"
  });
  delete user.password;
  return {
    token,
    user
  };
};
var authService = {
  registerUserIntoDB,
  loginUserIntoDB
};

// src/modules/auth/auth.controller.ts
var signupUser = async (req, res, next) => {
  try {
    const result = await authService.registerUserIntoDB(req.body);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var loginUser = async (req, res, next) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var authController = {
  signupUser,
  loginUser
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.signupUser);
router.post("/login", authController.loginUser);
var authRouter = router;

// src/modules/issue/issue.route.ts
import { Router as Router2 } from "express";

// src/types/index.ts
var user_role = {
  CONTRIBUTOR: "contributor",
  MAINTAINER: "maintainer"
};
var issue_type = {
  BUG: "bug",
  FEATURE_REQUEST: "feature_request"
};
var issue_status = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved"
};

// src/modules/issue/issue.service.ts
var createIssueIntoDB = async (payload, user) => {
  const { title, description, type, status } = payload;
  if (status) {
    const error = new Error(
      "Status should not be provided while creating an issue"
    );
    error.statusCode = 400;
    throw error;
  }
  const allowedTypes = Object.values(issue_type);
  if (!allowedTypes.includes(type)) {
    const error = new Error("Issue type must be bug or feature_request");
    error.statusCode = 400;
    throw error;
  }
  const result = await db_default.query(
    `
      INSERT INTO issues
      (
        title,
        description,
        type,
        reporter_id
      )
      VALUES ($1,$2,$3,$4)
      RETURNING *
    `,
    [title, description, type, user.id]
  );
  return result.rows[0];
};
var getAllIssuesFromDB = async (query) => {
  const { sort = "newest", type, status } = query;
  let issueQuery = `SELECT * FROM issues`;
  const values = [];
  const conditions = [];
  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  if (conditions.length > 0) {
    issueQuery += ` WHERE ${conditions.join(" AND ")}`;
  }
  if (sort === "oldest") {
    issueQuery += ` ORDER BY created_at ASC`;
  } else {
    issueQuery += ` ORDER BY created_at DESC`;
  }
  const issuesResult = await db_default.query(issueQuery, values);
  const issues = issuesResult.rows;
  if (issues.length === 0) {
    const error = new Error("No issues found");
    error.statusCode = 404;
    throw error;
  }
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];
  const usersResult = await db_default.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [reporterIds]
  );
  const users = usersResult.rows;
  const issuesWithReporter = issues.map((issue) => {
    const reporter = users.find((user) => user.id === issue.reporter_id);
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter,
      created_at: issue.created_at,
      updated_at: issue.updated_at
    };
  });
  return issuesWithReporter;
};
var getSingleIssueFromDB = async (issueId) => {
  const issueResult = await db_default.query(`SELECT * FROM issues WHERE id = $1`, [
    issueId
  ]);
  const issue = issueResult.rows[0];
  if (issueResult.rowCount === 0) {
    const error = new Error("Issue not found");
    error.statusCode = 404;
    throw error;
  }
  const reporterResult = await db_default.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id]
  );
  delete issue.reporter_id;
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporterResult.rows[0],
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
};
var updateIssueIntoDB = async (issueId, payload, user) => {
  const issueResult = await db_default.query(`SELECT * FROM issues WHERE id = $1`, [
    issueId
  ]);
  if (issueResult.rowCount === 0) {
    const error = new Error("Issue not found");
    error.statusCode = 404;
    throw error;
  }
  const issue = issueResult.rows[0];
  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      const error = new Error("You can only update your own issue");
      error.statusCode = 403;
      throw error;
    }
    if (issue.status !== issue_status.OPEN) {
      const error = new Error("You can only update open issues");
      error.statusCode = 403;
      throw error;
    }
    if (payload.status) {
      const error = new Error("Contributors are not allowed to update status");
      error.statusCode = 403;
      throw error;
    }
  }
  if (payload.type && !Object.values(issue_type).includes(payload.type)) {
    const error = new Error("Issue type must be bug or feature_request");
    error.statusCode = 400;
    throw error;
  }
  let updateStatus;
  if (user.role === "maintainer") {
    if (payload.status && !Object.values(issue_status).includes(payload.status)) {
      const error = new Error("Invalid status");
      error.statusCode = 400;
      throw error;
    }
    updateStatus = payload.status;
  }
  const result = await db_default.query(
    `
    UPDATE issues
    SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      type = COALESCE($3, type),
      status = COALESCE($4, status),
      updated_at = CURRENT_TIMESTAMP

    WHERE id = $5

    RETURNING *
    `,
    [payload.title, payload.description, payload.type, updateStatus, issueId]
  );
  return result.rows[0];
};
var deleteIssueFromDB = async (issueId) => {
  const result = await db_default.query(
    `DELETE FROM issues WHERE id = $1 RETURNING *`,
    [issueId]
  );
  if (result.rowCount === 0) {
    const error = new Error("Issue not found");
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
};
var issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB
};

// src/modules/issue/issue.controller.ts
var createIssue = async (req, res, next) => {
  try {
    const result = await issueService.createIssueIntoDB(req.body, req.user);
    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllIssues = async (req, res, next) => {
  try {
    const result = await issueService.getAllIssuesFromDB(
      req.query
    );
    res.status(200).json({
      success: true,
      message: "Issues retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleIssue = async (req, res, next) => {
  const { id: issueId } = req.params;
  try {
    const result = await issueService.getSingleIssueFromDB(issueId);
    res.status(200).json({
      success: true,
      message: "Issue retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateIssue = async (req, res, next) => {
  try {
    const { id: issueId } = req.params;
    const result = await issueService.updateIssueIntoDB(
      issueId,
      req.body,
      req.user
    );
    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var deleteIssue = async (req, res, next) => {
  try {
    await issueService.deleteIssueFromDB(req.params.id);
    res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
      data: null
    });
  } catch (error) {
    next(error);
  }
};
var issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...requiredRoles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized Access"
        });
      }
      const decoded = jwt2.verify(
        token,
        config_default.secretKey
      );
      if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden"
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/modules/issue/issue.route.ts
var router2 = Router2();
router2.post("/", auth_default(), issueController.createIssue);
router2.get("/", issueController.getAllIssues);
router2.get("/:id", issueController.getSingleIssue);
router2.patch("/:id", auth_default(), issueController.updateIssue);
router2.delete("/:id", auth_default(user_role.MAINTAINER), issueController.deleteIssue);
var issueRouter = router2;

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.message || "Something went wrong"
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
var app = express();
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.status(200).json({
    message: "DevPulse Server is running!",
    success: true,
    author: "Hridhya Paul"
  });
});
app.use("/api/auth", authRouter);
app.use("/api/issues", issueRouter);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var port = config_default.port;
var main = async () => {
  try {
    await initDB();
    app_default.listen(port, () => {
      console.log(`DevPulse Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};
main();
//# sourceMappingURL=server.js.map