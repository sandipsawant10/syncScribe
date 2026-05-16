import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
  const [form, setFrom] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFrom((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("Please fill all fields");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/signup", form);
      login(data.token, data.user);
      navigate("/notes");
      toast.success("Account created successfully!");
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Signup failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card fade-in">
        <div className="auth-logo">Sync Scribe</div>
        <div className="auth-subtitle">Create your free workspace </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="input"
              type="text"
              name="name"
              placeholder="Lionel Messi"
              value={form.name}
              onChange={handleChange}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="input"
              type="email"
              name="email"
              placeholder="lionelmessi@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="input"
              type="password"
              name="password"
              placeholder="At least 6 characters"
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
              "Create Account"
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
