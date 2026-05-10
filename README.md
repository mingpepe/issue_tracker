# IssueFlow - Intelligent Task Management

IssueFlow is a modern, high-performance task management application designed for organized workflows. It features a sophisticated dark theme, hierarchical task nesting, and fluid drag-and-drop organization.

## 🚀 Key Features

- **🌑 Elegant Dark Theme**: Optimized for focus with a cohesive dark aesthetic across all components.
- **hierarchy Hierarchical Tasks**: Organize your flow with infinite nesting levels for sub-tasks.
- **🖱️ Drag-and-Drop Sorting**: Seamlessly reorder tasks or nest them within other tasks using intuitive mouse controls.
- **✅ Completion Management**: Toggle task status with a single click. Completed tasks are automatically moved to a dedicated "Completed" section.
- **🧺 Bulk Operations**: Select multiple tasks to perform batch deletions, making cleanup fast and efficient.
- **📏 Compact UI**: Designed to handle hundreds of tasks with a high-density, streamlined layout.
- **🔄 Real-time Sync**: Automatically saves your changes to a local backend for persistence.

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework**: Vue 3 (Composition API)
- **State Management**: Pinia
- **Styling**: Tailwind CSS
- **Interactions**: Vuedraggable (SortableJS)
- **Icons**: Heroicons (SVG)

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express
- **Storage**: JSON-based local persistence

## 📥 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Clone the repository
```bash
git clone <repository-url>
cd issue-tracker
```

### 2. Setup the Server
```bash
cd server
npm install
npm start
```
The server will run on `http://localhost:3001`.

### 3. Setup the Client
```bash
cd ../client
npm install
npm run dev
```
The client will run on `http://localhost:5173` (default Vite port).

## 📖 Usage Guide

- **Creating Tasks**: Use the "New Task" button at the top for top-level issues, or the "Add" button inside a task to create nested sub-tasks.
- **Organizing**: Grab the handle (six dots icon) on the left of any task to drag and reorder or change its parent.
- **Completing**: Click the circular checkbox next to a task title to mark it as done.
- **Bulk Action**: Click the square checkbox on the far left to select multiple items. A bulk action bar will appear at the bottom for deletion.
- **Theme**: The application defaults to Dark Mode for a premium engineering experience.

---

Built with ❤️ for productivity.
