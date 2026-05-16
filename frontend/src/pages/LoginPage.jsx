import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [form, setFrom] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFrom((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Please fill all fields");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.token, data.user);
      navigate("/notes");
      toast.success(`Welcome back, ${data.user.name.split(" ")[0]}!`);
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card fade-in">
        <div className="auth-logo">Sync Scribe</div>
        <div className="auth-subtitle">Sign in to your workspace</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="input"
              type="email"
              name="email"
              placeholder="lionelmessi@example.com"
              value={form.email}
              onChange={handleChange}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="input"
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ marginTop: 8, justifyContent: "center" }}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner" style={{ width: 16, height: 16 }} />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
