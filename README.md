Mini Project Manager: Full-Stack Application

This project is a minimal, full-stack project management system built to demonstrate proficiency in modern web development technologies, including secure authentication, RESTful API design, and a reactive frontend.

🚀 Live Application URL (Bonus Task)

The frontend application has been deployed using Netlify. Users can register and interact with the application live.

Deployed Frontend Link: [PASTE YOUR NETLIFY URL HERE]

(Note: The deployed frontend communicates with the local API you run on your machine for data.)

🏗️ Architecture and Technology Stack

Backend (ProjectManager.API)

Framework: C# .NET 8 Web API

Database: Entity Framework Core with SQLite (In-Memory/Local File)

Authentication: JWT (JSON Web Tokens) for secure, token-based user authentication and authorization.

Security: Data is scoped by UserId (logged-in user ID) to ensure users can only access their own projects and tasks.

Structure: Uses Controllers, Models, and DTOs (Data Transfer Objects) for separation of concerns.

Frontend (project-manager-frontend)

Framework: React (using functional components and hooks)

Scaffolding: Vite

Routing: react-router-dom for navigation (Login, Dashboard, Project Detail).

API Client: axios for making authenticated requests (sending the stored JWT) to the .NET API.

Styling: Minimalist CSS for a clean and responsive user experience.

📋 Core Features Implemented

Authentication: User registration (/api/auth/register) and login (/api/auth/login).

Security: JWT is stored and attached to all API requests, ensuring all project/task data is user-specific.

Projects:

Create, view all, view details, and delete projects.

Project lists show task count and completion status summaries.

Tasks:

Add new tasks to a specific project.

Update task title, due date, and completion status.

Delete tasks.

🛠️ Local Setup Guide

Follow these steps to run the full application locally:

1. Prerequisites

You must have the following installed:

.NET 8 SDK

Node.js (LTS) & npm

Git

2. Backend API Setup (ProjectManager.API)

Navigate to the ProjectManager.API directory in your terminal:

cd ProjectManager.API
# 1. Create the database file and tables
dotnet ef migrations add InitialSetup
dotnet ef database update

# 2. Start the C# API
dotnet run


(The API will start, typically listening on https://localhost:5001 or 7001)

3. Frontend Application Setup (project-manager-frontend)

Open a second terminal and navigate to the frontend directory:

cd project-manager-frontend
# Start the React development server (Vite)
npm run dev


(The browser will open to the React application, typically on http://localhost:5173)

4. Testing

Open the browser to the React URL (http://localhost:5173).

Navigate to Register to create a new user.

Log in, create a project, and manage tasks!
