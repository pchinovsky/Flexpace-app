# **FLEXPACE Documentation**

## **1. Overview**

FLEXPACE is an interactive task management web application designed to help users organize, prioritize, and visualize their tasks. It allows users to create personal and shared boards, manage draggable and resizable task cards, and collaborate through shared tasks. With user authentication, board customization, and real-time updates, FLEXPACE offers a modern and intuitive task management experience.

---

## **2. Features**

### **Core Features**

- **User Authentication**: Secure login, registration, and logout using Firebase Authentication.
- **Task Management**: Create, edit, delete, drag, resize, and categorize tasks.
- **Custom Boards**: Create personal boards with customizable names and background images.
- **Public and Shared Boards**: Access a public board where all public tasks are displayed.
- **Filter View**: View and search tasks from multiple boards in one unified "Filter" board.
- **Task Details View**: View detailed information about a task and its subtasks in a modal or as a page.
- **Responsive Design**: Fully responsive for mobile, tablet, and desktop devices.
- **Error Handling**: User-friendly error messages for network issues and server errors.
- **404 Page**: A fallback page that appears when users access an invalid route.

---

## **3. Used Frameworks and Libraries**

### **Frontend**

- **Angular** (v16.2.0) - Main framework for building the SPA (Single Page Application).
- **Angular Material** - UI components for modals, buttons, and inputs.
- **RxJS** - Reactive programming for handling async data streams.
- **Angular CDK** - Used for drag-and-drop and resizable components.
- **Firebase** - Real-time database and authentication for user and task data.
- **TypeScript** - Strongly typed JavaScript, which powers Angular.
- **SCSS** - CSS preprocessor for styles.

### **Back-end (Serverless)**

- **Firebase Firestore** - Database for storing task, board, and user data.
- **Firebase Authentication** - User authentication, session handling, and user data.
- **Firebase Hosting** - Hosting for the deployed production app.

---

## **4. How to Run the Project**

### **Prerequisites**

1. **Node.js** - Ensure Node.js is installed.
2. **Angular CLI** - Install Angular CLI globally:
   ```bash
   npm install -g @angular/cli
   ```

### **Firebase CLI**

Install the Firebase CLI globally:

````bash
npm install -g firebase-tools
## Environment Variables
Ensure Firebase project credentials are set up properly in `src/environments/`.

## Development Server

### Clone the project from GitHub:
```bash
git clone https://github.com/username/FLEXPACE.git
````

### Install dependencies:

```bash
npm install
```

### Run the development server:

```bash
ng serve
```

### Open the app in the browser:

```arduino
http://localhost:4200/
```

## Production Build

### Create a production build:

```bash
ng build --prod
```

### Deploy the app to Firebase Hosting:

```bash
firebase deploy
```

## Functionality

### 1. User Authentication

- Users can log in, register, and log out.
- Upon logout, the app redirects to the public board (`/wall`).

### 2. Board Management

- Users can create custom boards.
- Each board has draggable and resizable task cards.
- Boards can be renamed, deleted, or customized with a background image.

### 3. Task Management

- **Add/Edit/Delete Tasks**: Users can add, edit, and delete tasks on their personal boards.
- **Drag & Drop**: Tasks are draggable and resizable on boards.
- **Task Details**: Clicking on a task opens a modal or a dedicated page with the task’s full details.
- **Subtasks**: Each task can have a list of subtasks.
- **Task Sharing**: Tasks can be made public so that all users can view them on the public board.

### 4. Filter Board

- Users can filter tasks across all boards.
- Tasks that are marked as "Saved" appear in the filter view.

## Architecture

```
src/
  ├── app/
  │     ├── auth/          # User authentication (login, register, profile)
  │     ├── boards/        # Default, universal, custom, and filter boards
  │     ├── task/          # Task components and logic (drag, drop, details)
  │     ├── services/      # Shared services for authentication, error handling, etc.
  │     ├── guards/        # Auth guards to protect routes
  │     └── shared/        # Shared components (modals, notifications, etc.)
  └── environments/        # Environment files for Firebase configuration
```

## Routes

| Path              | Component       | Auth Required? |
| ----------------- | --------------- | -------------- |
| `/wall`           | Public Board    | ❌ No          |
| `/default`        | Default Board   | ✅ Yes         |
| `/universal`      | Universal Board | ✅ Yes         |
| `/today`          | Today’s Board   | ✅ Yes         |
| `/board/:boardId` | Custom Board    | ✅ Yes         |
| `/auth/login`     | Login Page      | ❌ No          |
| `/auth/register`  | Register Page   | ❌ No          |
| `/profile`        | Profile Page    | ✅ Yes         |
| `**`              | 404 Error Page  | ❌ No          |

## How to Contribute

1. Fork the repository.
2. Clone your fork.
3. Create a new branch.
4. Make changes and push to your branch.
5. Create a pull request.

## Credits

- **Developer**: [Your Name]
- **Contributors**: [Other team members, if any]
- **Instructor/Supervisor**: [Name, if applicable]
