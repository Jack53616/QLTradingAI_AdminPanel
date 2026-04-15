# QL Trading AI — Admin Panel

  A professional full-stack admin dashboard for the **QL Trading AI** Telegram trading bot platform.

  ## Tech Stack

  - **Frontend**: React 19 + Vite + TypeScript + TailwindCSS v4
  - **Backend**: Node.js + Express + TypeScript
  - **Database**: PostgreSQL with Drizzle ORM
  - **Auth**: JWT (Bearer token)
  - **API Client**: Auto-generated from OpenAPI spec (Orval)

  ## Features

  ### Dashboard
  - Real-time platform statistics (users, balances, trades, pending approvals)
  - Recent activity feed
  - Alerts for pending withdrawals and transfers

  ### User Management
  - Search and filter users by status
  - Adjust user balance (add/subtract)
  - Update user status (active, frozen, banned, temp ban with duration)

  ### Transfer Approvals
  - Review and approve/reject pending transfers between users
  - Atomic balance movements on approval

  ### Withdrawal Approvals  
  - Review pending withdrawal requests with fee breakdown
  - Shows gross amount, fee, and net payout

  ### Trade Monitoring
  - View all trades with P&L, symbol, side (buy/sell)
  - Filter by open/closed status

  ## Setup

  ```bash
  # Install dependencies
  pnpm install

  # Set environment variables
  DATABASE_URL=postgresql://...
  ADMIN_PASSWORD=your_secure_password
  SESSION_SECRET=your_session_secret
  JWT_SECRET=your_jwt_secret

  # Push database schema
  pnpm run db:push

  # Start development
  pnpm run dev
  ```

  ## Project Structure

  ```
  artifacts/
    api-server/     # Express API backend
    ql-admin/       # React admin frontend
  lib/
    db/             # Drizzle ORM schema & migrations
    api-spec/       # OpenAPI specification
    api-client-react/ # Auto-generated React Query hooks
  ```

  ## Default Credentials

  - Password: `admin123` (set `ADMIN_PASSWORD` env var to change)

  ---

  Built on top of QL Trading AI v3.0 PRO platform.
  