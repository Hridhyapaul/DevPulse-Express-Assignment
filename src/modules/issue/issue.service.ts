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

const getAllIssuesFromDB = async (query: Record<string, string>) => {
  const { sort = "newest", type, status } = query;

  let issueQuery = `SELECT * FROM issues`;
  const values: string[] = [];
  const conditions: string[] = [];

  // Filter by type
  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }

  // Filter by status
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  if (conditions.length > 0) {
    issueQuery += ` WHERE ${conditions.join(" AND ")}`;
  }

  // Sort
  if (sort === "oldest") {
    issueQuery += ` ORDER BY created_at ASC`;
  } else {
    issueQuery += ` ORDER BY created_at DESC`;
  }

  const issuesResult = await pool.query(issueQuery, values);

  const issues = issuesResult.rows;

  if (issues.length === 0) {
    return [];
  }

  const reporterIds = [
    ...new Set(issues.map((issue) => issue.reporter_id)),
  ];

  const usersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [reporterIds]
  );

  const users = usersResult.rows;

  const issuesWithReporter = issues.map((issue) => {
    const reporter = users.find(
      (user) => user.id === issue.reporter_id
    );

    return {
      ...issue,
      reporter,
    };
  });

  return issuesWithReporter;
};

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
};