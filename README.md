# SmartQ Queue Management System

SmartQ is a full-stack queue management project for booking tokens, calling the next customer or patient, and keeping public displays updated through real-time Socket.IO events.

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Node.js, Express, Socket.IO
- Database: MySQL

## Local Setup

1. Install frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Install backend dependencies:

   ```bash
   cd backend
   npm install
   ```

3. Create environment files:

   ```bash
   cp frontend/.env.example frontend/.env.local
   cp backend/.env.example backend/.env
   ```

4. Update the backend `.env` file with your MySQL credentials.

5. Start the backend:

   ```bash
   cd backend
   npm run dev
   ```

6. Start the frontend:

   ```bash
   cd frontend
   npm run dev
   ```

The frontend runs on `http://localhost:3000`, and the backend runs on `http://localhost:5000` by default.

## Notes

- New passwords are stored with a salted scrypt hash.
- Legacy plain-text passwords can still log in, so existing demo users are not locked out.
- Frontend API URLs are controlled with `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL`.
