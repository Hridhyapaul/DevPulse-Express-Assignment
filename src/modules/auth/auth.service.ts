import pool from "../../db";
import type { IAuth } from "./auth.interface";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../../config";

const registerUserIntoDB = async (payload: IAuth) => {
  const { name, email, password, role } = payload;

  // Check existing user
  const existingUser = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email],
  );

  if (existingUser.rowCount && existingUser.rowCount > 0) {
    throw new Error("User already exists");
  }

  // Validate role
  const allowedRoles = ["contributor", "maintainer"];

  if (role && !allowedRoles.includes(role)) {
    throw new Error("Role must be contributor or maintainer");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user
  const result = await pool.query(
    `
      INSERT INTO users
      (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [name, email, hashedPassword, role || "contributor"],
  );

  delete result.rows[0].password;

  return result.rows[0];
};

const loginUserIntoDB = async (payload: {
  email: string;
  password: string;
}) => {
  const { email, password } = payload;

  //   Check User Exist
  const userData = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);

  if (userData.rowCount === 0) {
    throw new Error("User not found");
  }

  const user = userData.rows[0];

  //   Compare Password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
  };

  // Generate Token

  const token = jwt.sign(
    jwtPayload,
    config.secretKey as string,
    {
      expiresIn: "1h",
    }
  );

  delete user.password;

  return {
    token,
    user,
  };
};

export const authService = {
  registerUserIntoDB,
  loginUserIntoDB,
};
