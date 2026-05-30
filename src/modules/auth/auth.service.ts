import pool from "../../db";
import type { IAuth } from "./auth.interface";
import bcrypt from "bcryptjs";

const registerUserIntoDB = async (payload: IAuth) => {
  const { name, email, password, role } = payload;

  // Check existing user
  const existingUser = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  if (existingUser.rowCount && existingUser.rowCount > 0) {
    throw new Error("User already exists");
  }

  // Validate role
  const allowedRoles = ["contributor", "maintainer"];

  if (role && !allowedRoles.includes(role)) {
    throw new Error(
      "Role must be contributor or maintainer"
    );
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
    [
      name,
      email,
      hashedPassword,
      role || "contributor",
    ]
  );

  delete result.rows[0].password;

  return result.rows[0];
};

export const authService = {
  registerUserIntoDB,
};