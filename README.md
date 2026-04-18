# 🧗 ClimbIRL Backend

The robust Node.js and TypeScript backbone for **ClimbIRL**, a gamified real-life task management application. This server handles authentication, gamification logic, leaderboard synchronization, and achievement tracking.

## 🚀 Features

-   **OTP Authentication**: Secure passwordless login using Email OTP (Mailjet/Nodemailer).
-   **Gamification Engine**: Logic for XP calculation, leveling up, and streaks.
-   **Task Management**: Daily task synchronization and completion tracking.
-   **Leaderboard System**: Real-time ranking with Weekly and Monthly filters.
-   **Achievement System**: Atomic achievement unlocking with rarity-based XP rewards.
-   **Legal Compliance**: Dedicated routes for Privacy Policy, Terms, and Account Deletion.

## 🛠️ Tech Stack

-   **Runtime**: Node.js (v18+)
-   **Language**: TypeScript
-   **Framework**: Express.js
-   **Database**: MongoDB (via Mongoose)
-   **Auth**: JWT (JSON Web Tokens)
-   **Email**: Mailjet & Nodemailer

## 🏗️ Architecture

The backend follows a domain-driven, service-oriented architecture:

-   📂 `controllers/`: Handles incoming HTTP requests and responses.
-   📂 `services/`: Contains core business logic (e.g., leveling logic, task validation).
-   📂 `models/`: Mongoose schemas and TypeScript interfaces for data persistence.
-   📂 `routes/`: API endpoint definitions and routing logic.
-   📂 `middleware/`: Auth guards and request validation.
-   📂 `utils/`: Reusable helper functions (e.g., email templates, OTP generation).
-   📂 `scripts/`: Database seeding and maintenance scripts.

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone <repo-url>
cd ClimbIRL_BE
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASSWORD=your_app_password
MAILJET_API=your_mailjet_api
MAILJET_SECRET=your_mailjet_secret
```

### 4. Seed Initial Data
To populate the database with default tasks and achievements:
```bash
npm run seed
```

## 📜 Available Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the development server with hot-reload (tsx watch). |
| `npm run build` | Compiles TypeScript to JavaScript (dist/). |
| `npm run start` | Runs the compiled production server. |
| `npm run seed` | Seeds the database with default achievements and tasks. |

## 📁 Key File Descriptions

-   `server.ts`: The main entry point that initializes Express and connects to MongoDB.
-   `models/User.ts`: Defines the user structure including XP, Level, and Streaks.
-   `services/taskService.ts`: Manages the logic for completing tasks and awarding XP.
-   `routes/authRoutes.ts`: Handles registration and OTP-based verification.
-   `public/`: Contains static HTML files for Terms of Service and Privacy Policy.

---
Developed with ❤️ for the ClimbIRL Community.
