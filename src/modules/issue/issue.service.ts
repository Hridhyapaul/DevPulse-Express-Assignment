import pool from "../../db";
import { issue_status, issue_type } from "../../types";
import type { IIssue } from "./issue.interface";

const createIssueIntoDB = async (payload: IIssue, user: any) => {
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
    [title, description, type, user.id],
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

  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];

  const usersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [reporterIds],
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
      updated_at: issue.updated_at,
    };
  });

  return issuesWithReporter;
};

const getSingleIssueFromDB = async (issueId: string) => {
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [
    issueId,
  ]);

  const issue = issueResult.rows[0];

  const reporterResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id],
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
    updated_at: issue.updated_at,
  };
};

const updateIssueIntoDB = async (issueId: string, payload: any, user: any) => {
  console.log(issueId, payload, user);
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [
    issueId,
  ]);

  if (issueResult.rowCount === 0) {
    throw new Error("Issue not found");
  }

  const issue = issueResult.rows[0];

  // Contributor Rules
  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      throw new Error("You can only update your own issue");
    }

    if (issue.status !== issue_status.OPEN) {
      throw new Error("You can only update open issues");
    }
    
    if (payload.status) {
      throw new Error("Contributors are not allowed to update status");
    }
  }

  // Type Validation
  if (payload.type && !Object.values(issue_type).includes(payload.type)) {
    throw new Error("Type must be bug or feature_request");
  }

  let updateStatus;

  // Only maintainer can update status
  if (user.role === "maintainer") {
    if (
      payload.status &&
      !Object.values(issue_status).includes(payload.status)
    ) {
      throw new Error("Invalid status");
    }

    updateStatus = payload.status;
  }

  const result = await pool.query(
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
    [payload.title, payload.description, payload.type, updateStatus, issueId],
  );
  return result.rows[0];
};

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
};
