# Bridge Frontend

Bridge is a modern web application built with React 19 and Vite. It utilizes TanStack Router and TanStack Start for efficient routing and server capabilities. The user interface is styled using Tailwind CSS v4 and Radix UI primitives (shadcn/ui), ensuring an accessible, responsive, and aesthetically pleasing design.

## Features & Tech Stack

- **Framework:** React 19 + Vite
- **Routing:** TanStack Router & TanStack Start
- **Styling:** Tailwind CSS v4
- **UI Components:** Radix UI / shadcn/ui
- **Forms & Validation:** React Hook Form + Zod
- **Data Fetching:** TanStack React Query

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have [Node.js](https://nodejs.org/) installed on your machine. We recommend using [Bun](https://bun.sh/) or `npm` to manage your dependencies.

### 1. Clone the repository

```bash
git clone <repository-url>
cd bridge-frontend
```

_(Note: Replace `<repository-url>` with the actual Git URL of the repository)_

### 2. Install dependencies

Using Bun (Recommended):

```bash
bun install
```

Or using npm:

```bash
npm install
```

### 3. Run the development server

Using Bun:

```bash
bun run dev
```

Or using npm:

```bash
npm run dev
```

The application will be running at [http://localhost:3000](http://localhost:3000) (or whichever port Vite automatically selects).

## Available Scripts

In the project directory, you can run:

- `npm run dev` or `bun run dev`: Runs the app in development mode.
- `npm run build` or `bun run build`: Builds the app for production.
- `npm run lint` or `bun run lint`: Runs ESLint to check for code issues.
- `npm run format` or `bun run format`: Runs Prettier to format the codebase.
