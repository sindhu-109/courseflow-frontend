import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Dashboard from "./pages/user/UserDashboard";
import Courses from "./pages/user/BrowseCourses";
import Schedule from "./pages/user/MySchedule";
import MyRegistrations from "./pages/user/MyRegistrations";
import AdminPanel from "./pages/admin/AdminDashboard";
import ManageCourses from "./pages/admin/ManageCourses";
import ManageUsers from "./pages/admin/ManageUsers";
import Registrations from "./pages/admin/Registrations";
import ConflictResolver from "./pages/admin/ConflictResolver";
import { isLoggedIn } from "./services/session";


// ✅ ONLY ONE ProtectedRoute
const ProtectedRoute = ({ children }) => {
  if (!isLoggedIn()) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <Courses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <Schedule />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-registrations"
          element={
            <ProtectedRoute>
              <MyRegistrations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/manage-courses"
          element={
            <ProtectedRoute>
              <ManageCourses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/manage-users"
          element={
            <ProtectedRoute>
              <ManageUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/registrations"
          element={
            <ProtectedRoute>
              <Registrations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/conflict-resolver"
          element={
            <ProtectedRoute>
              <ConflictResolver />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
