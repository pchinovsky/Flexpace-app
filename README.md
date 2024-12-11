# **FLEXPACE Documentation**

## **Overview**

FLEXPACE is an interactive task/note management web application simulating a flexible desk-like space.

It allows users to create personal and shared boards, manage draggable and resizable note cards, and collaborate through shared notes.

---

## **Used Frameworks and Libraries**

### **Frontend**

- **Angular** (v16.2.0) - Main framework for building the SPA (Single Page Application).
- **Angular Fire** (v7.6.1) - Firebase integration for Angular.
- **Angular Material** - UI components for modals, buttons, and inputs.
- **RxJS** - Reactive programming for handling async data streams.
- **Firebase** (v9.23.0) - Real-time database and authentication for user and task data.
- **TypeScript** (v5.1.6) - Strongly typed JavaScript, which powers Angular.

### **Back-end (Serverless)**

- **Firebase Firestore** - Database for storing task, board, and user data.
- **Firebase Authentication** - User authentication, session handling, and user data.
- **Firebase Storage** - Storing background images.
- **Firebase Hosting** - Hosting for the deployed production app.

---

## General Functionality

### 1. User Authentication

- Users can log in, register, and log out.
- Upon logout, the app redirects to the public board (`/wall`).

### 2. Public board

- All published tasks are displayed and accessible to both users and guests.
- Users can save or unsave the tasks published by other users and leave comments on them.

### 3. Board Management

- Users can create custom boards aside of the Default board available for everyone after registration.
- Each board allows the creation of draggable and resizable task/note cards.
- Boards can be renamed, customized with a background image from a predefined selection, or deleted along with all contained tasks.

### 4. Task Management

- **Publishing**: Users can publish a task and it will become visible to other users on the public board, and updates to it will be accessible to the users who have saved public in their collections.
- **Add/Edit/Delete Tasks**: Users can add, edit, and delete tasks on their personal boards.
- **Drag & Drop**: Tasks are draggable and resizable on boards, and additionally customizable. Tasks can be also dropped over the navigation buttons and moved to another board.
- **Task Details**: Clicking on a task opens a modal with the full details.
- **Subtasks**: Each task can have a list of subtasks.
- **Task Sharing**: Tasks can be made public so that all users can view them on the public board.

### 5. Filter Board

- All tasks owned by the user and tasks owned by other users and saved by the current user are displayed and can be filtered according to colors, properties, or text content.

### 6. Profile page

- Users can link a profile picture and enter personal information.
- User interaction statistics such as number of tasks owned or number of own tasks saved by other users are listed.
- The last edited task is displayed.

---

## **How to Run the Project**

### **Prerequisites**

1. **Node.js** - Ensure Node.js is installed.
2. **Angular CLI** - Install Angular CLI globally:
   ```bash
   npm install -g @angular/cli
   ```

### **Firebase CLI**

Install the Firebase CLI globally:

```bash
npm install -g firebase-tools
```

### **Environment Variables**

Ensure Firebase project credentials are set up properly in `src/environments/`.

## Development Server

### Clone the project from GitHub:

```bash
git clone https://github.com/username/FLEXPACE.git
```

### \*\*Install dependencies:

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

---

## Routes

| Path              | Component      | Auth Required? |
| ----------------- | -------------- | -------------- |
| `/wall`           | Public Board   | ❌ No          |
| `/default`        | Default Board  | ✅ Yes         |
| `/universal`      | Filter Board   | ✅ Yes         |
| `/board/:boardId` | Custom Board   | ✅ Yes         |
| `/auth/login`     | Login Page     | ❌ No          |
| `/auth/register`  | Register Page  | ❌ No          |
| `/profile`        | Profile Page   | ✅ Yes         |
| `**`              | 404 Error Page | ❌ No          |

## Credits

- **Developement and design**: Peter Chinovsky 2024
