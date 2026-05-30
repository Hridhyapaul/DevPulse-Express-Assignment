import pool from "../../db";
import type { IIssue } from "./issue.interface";

const createIssueIntoDB = async (
  payload: IIssue,
  user: any
) => {

  const { title, description, type } = payload;

  const result = await pool.query(
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
    [
      title,
      description,
      type,
      user.id
    ]
  );

  return result.rows[0];
};

export const issueService = {
  createIssueIntoDB,
};