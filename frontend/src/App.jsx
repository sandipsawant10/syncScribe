import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import SharedNotePage from "./pages/SharedNotePage";
import NotesPage from "./pages/NotesPage";
import DashboardPage from "./pages/DashboardPage";
import Layout from "./components/Layout";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="loading=screen">
        <div className="spinner">
          <span className="text-muted text-sm">Loading...</span>
        </div>
      </div>
    );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/notes" replace /> : children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "var(--bg-3)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Navigate to="/notes" replace />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />
          <Route path="/shared/:shareId" element={<SharedNotePage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route path="notes" element={<NotesPage />} />
            <Route path="notes/:noteId" element={<NotesPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
