import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Toaster } from "react-hot-toast";
import { getRole, isLoggedIn } from "./services/session";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));

const UserDashboard = lazy(() => import("./pages/user/UserDashboard"));
const BrowseCourses = lazy(() => import("./pages/user/BrowseCourses"));
const MySchedule = lazy(() => import("./pages/user/MySchedule"));
const MyRegistrations = lazy(() => import("./pages/user/MyRegistrations"));

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ManageCourses = lazy(() => import("./pages/admin/ManageCourses"));
const ManageUsers = lazy(() => import("./pages/admin/ManageUsers"));
const Registrations = lazy(() => import("./pages/admin/Registrations"));
const ConflictResolver = lazy(() => import("./pages/admin/ConflictResolver"));

const RoleRoute = ({ roleNeeded, children }) => {
  const role = getRole();

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  if (role !== roleNeeded) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/user/*"
            element={
              <RoleRoute roleNeeded="student">
                <Outlet />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="browse-courses" element={<BrowseCourses />} />
            <Route path="schedule" element={<MySchedule />} />
            <Route path="my-registrations" element={<MyRegistrations />} />
          </Route>

          <Route
            path="/admin/*"
            element={
              <RoleRoute roleNeeded="admin">
                <Outlet />
              </RoleRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="manage-courses" element={<ManageCourses />} />
            <Route path="manage-users" element={<ManageUsers />} />
            <Route path="registrations" element={<Registrations />} />
            <Route path="conflict-resolver" element={<ConflictResolver />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
