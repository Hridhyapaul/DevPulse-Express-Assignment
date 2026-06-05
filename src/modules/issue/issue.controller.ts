import type { NextFunction, Request, Response } from "express";
import { issueService } from "./issue.service";

const createIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body.status) {
      res.status(400).json({
        success: false,
        message: "Status should not be provided while creating an issue",
      });
      return;
    }

    const result = await issueService.createIssueIntoDB(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const getAllIssues = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await issueService.getAllIssuesFromDB(
      req.query as Record<string, string>,
    );

    res.status(200).json({
      success: true,
      message: "Issues retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleIssue = async (req: Request, res: Response, next: NextFunction) => {
  const { id: issueId } = req.params;
  try {
    const result = await issueService.getSingleIssueFromDB(issueId as string);
    console.log(result);

    // if (!result) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Issue not found",
    //   });
    // }

    res.status(200).json({
      success: true,
      message: "Issue retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const updateIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(req.body);
    const { id: issueId } = req.params;
    const result = await issueService.updateIssueIntoDB(
      issueId as string,
      req.body,
      req.user,
    );

    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const deleteIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await issueService.deleteIssueFromDB(req.params.id as string);

    res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
      data: null,
    });
  } catch (error: any) {
    next(error);
  }
};

export const issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
};
