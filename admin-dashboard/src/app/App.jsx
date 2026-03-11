import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../modules/auth/LoginPage";
import ForgotPasswordPage from "../modules/auth/ForgotPasswordPage";
import Dashboard from "../modules/dashboard/Dashboard";
import Projects from "../modules/projects/ProjectsPage";
import ProjectProfilePage from "@/modules/projects/ProjectProfilePage";
import Sites from "../modules/sites/SitesPage";
import SiteProfilePage from "@/modules/sites/SiteProfilePage";
import Workers from "../modules/workers/WorkersPage";
import WorkerProfilePage from "@/modules/workers/WorkerProfilePage";
import Attendance from "../modules/attendance/AttendancePage";
import Shifts from "../modules/shifts/ShiftsPage";
import AuditLogs from "../modules/audit-logs/AuditLogsPage";
import Reports from "../modules/reports/ReportsPage";
import Users from "../modules/users/UsersPage";
import AdministrationPage from "../modules/administration/AdministrationPage";
import DataManagementPage from "../modules/data_management/DataManagementPage";
import MediaRepositoryPage from "../modules/media_repository/MediaRepositoryPage";
import ProtectedRoute from "../core/auth/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <ProjectProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sites"
          element={
            <ProtectedRoute>
              <Sites />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sites/:id"
          element={
            <ProtectedRoute>
              <SiteProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/workers"
          element={
            <ProtectedRoute>
              <Workers />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/workers/:id" 
          element={
            <ProtectedRoute>
              <WorkerProfilePage />
            </ProtectedRoute>
          } 
        />

        <Route
          path="/shifts"
          element={
            <ProtectedRoute>
              <Shifts />
            </ProtectedRoute>
          }
        />


        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <Attendance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Users />
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/administration"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdministrationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/data-management"
          element={
            <ProtectedRoute roles={["admin"]}>
              <DataManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/media-repository"
          element={
            <ProtectedRoute roles={["admin"]}>
              <MediaRepositoryPage />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
