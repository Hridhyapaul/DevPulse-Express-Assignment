import type { NextFunction, Request, Response } from "express";
import { authService } from "./auth.service";

const signupUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.registerUserIntoDB(req.body);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const authController = {
  signupUser,
  loginUser,
};
