import type { NextFunction, Request, Response } from "express";
import { issueService } from "./issue.service";

const createIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await issueService.createIssueIntoDB(req.body, req.user);
    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: "Failed to create issue",
      error: error.message,
    });
  }
};

export const issueController = {
  createIssue,
};
