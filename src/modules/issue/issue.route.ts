import { Router } from "express";
import { issueController } from "./issue.controller";
import auth from "../../middleware/auth";
import { user_role } from "../../types";

const router = Router();

router.post("/", auth(), issueController.createIssue);
router.get("/", issueController.getAllIssues);
router.get("/:id", issueController.getSingleIssue);
router.patch("/:id", auth(), issueController.updateIssue);
router.delete("/:id", auth(user_role.MAINTAINER), issueController.deleteIssue);

export const issueRouter = router;
