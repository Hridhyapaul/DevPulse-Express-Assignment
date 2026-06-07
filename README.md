# Devpulse-Express-Assignment

A RESTful Issue Tracking API built with Node.js, Express.js, TypeScript, PostgreSQL, and JWT Authentication. This application allows users to create, manage, update, and track issues with role-based access control.

## Live URL

```text
https://devpulse-express-postgres.vercel.app
```

## Features

- User registration and authentication
- JWT-based authorization
- Role-based access control (Contributor and Maintainer)
- Create new issues
- Retrieve all issues with filtering and sorting
- Retrieve a single issue by ID
- Update issues based on role permissions
- Delete issues (Maintainer only)
- Password hashing using bcrypt
- Global error handling
- PostgreSQL database integration
- Raw SQL queries using pg

## Tech Stack

### Backend

- Node.js
- Express.js
- TypeScript

### Database

- PostgreSQL

### Authentication

- JWT (JSON Web Token)
- bcryptjs

### Tools & Packages

- pg
- dotenv
- ts-node-dev

---

# Installation & Setup

## 1. Clone the Repository

```bash
git clone <https://github.com/Hridhyapaul/DevPulse-Express-Assignment.git>
cd DevPulse-Express-Assignment
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Create Environment Variables

Create a `.env` file in the root directory and add the following:

```env
PORT=5000

CONNECTION_STRING=your_postgresql_connection_string

SECRET_KEY=your_secret_key
```

## 4. Run the Application

### Development

```bash
npm run dev
```

### Build the Project

```bash
npm run build
```

### Run Production Build

```bash
npm start
```

# API Endpoints

## Authentication

### Register User

**POST**

```http
/api/auth/signup
```

### Login User

**POST**

```http
/api/auth/login
```

---

## Issues

### Create Issue

**POST**

```http
/api/issues
```

Authentication Required

### Get All Issues

**GET**

```http
/api/issues
```

### Available Query Parameters

```http
/api/issues?sort=newest
/api/issues?sort=oldest

/api/issues?type=bug
/api/issues?type=feature_request

/api/issues?status=open
/api/issues?status=in_progress
/api/issues?status=resolved
```

### Get Single Issue

**GET**

```http
/api/issues/:id
```

### Update Issue

**PATCH**

```http
/api/issues/:id
```

Access:

- Maintainer (any issue)
- Contributor (own issue only when status is open)

### Delete Issue

**DELETE**

```http
/api/issues/:id
```

Access:

- Maintainer only

---

# Database Schema Summary

## Users Table

| Column     | Type         | Description                      |
| ---------- | ------------ | -------------------------------- |
| id         | SERIAL       | Primary Key                      |
| name       | VARCHAR(100) | User's full name                 |
| email      | VARCHAR(255) | Unique email address             |
| password   | VARCHAR(255) | Hashed password                  |
| role       | VARCHAR(20)  | contributor or maintainer        |
| created_at | TIMESTAMP    | Record creation timestamp        |
| updated_at | TIMESTAMP    | Record last update timestamp     |

## Issues Table

| Column      | Type         | Description                                 |
| ----------- | ------------ | ------------------------------------------- |
| id          | SERIAL       | Primary Key                                 |
| title       | VARCHAR(150) | Issue title                                 |
| description | TEXT         | Detailed issue description                  |
| type        | VARCHAR(30)  | bug or feature_request                      |
| status      | VARCHAR(30)  | open, in_progress, resolved                 |
| reporter_id | INTEGER      | References the user who created the issue   |
| created_at  | TIMESTAMP    | Record creation timestamp                   |
| updated_at  | TIMESTAMP    | Record last update timestamp                |

---

# User Roles

## Contributor

- Create issues
- View issues
- Update own issues only when status is open
- Cannot update issue status
- Cannot delete issues

## Maintainer

- View all issues
- Update any issue
- Change issue workflow status
- Delete issues

---

# Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": "Error details"
}
```

---

# Success Response Format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

---

# Author

**Hridhya Paul**