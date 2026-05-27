import { createBrowserRouter } from 'react-router-dom';
import TaskListPage from '../pages/TaskListPage';
import TaskDetailPage from '../pages/TaskDetailPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/',          element: <ProtectedRoute><TaskListPage /></ProtectedRoute> },
  { path: '/tasks/:id', element: <ProtectedRoute><TaskDetailPage /></ProtectedRoute> },
  { path: '/login',     element: <LoginPage /> },
  { path: '/register',  element: <RegisterPage /> },
]);
