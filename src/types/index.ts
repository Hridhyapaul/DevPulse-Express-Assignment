export const user_role = {
  CONTRIBUTOR: "contributor",
  MAINTAINER: "maintainer",
} as const;

export type ROLES = "contributor" | "maintainer";

export const issue_type = {
  BUG: "bug",
  FEATURE_REQUEST: "feature_request",
} as const;

export const issue_status = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
} as const;
