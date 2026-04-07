import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../../api";
import { setSession } from "../../services/session";
import StatusBanner from "../../components/StatusBanner";

function generateCaptcha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [captcha, setCaptcha] = useState(() => generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [statusBanner, setStatusBanner] = useState({ type: "", msg: "" });

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (captchaInput.trim() !== captcha) {
      setStatusBanner({ type: "error", msg: "Captcha verification failed. Please try again." });
      toast.error("Captcha verification failed. Please try again.");
      refreshCaptcha();
      return;
    }

    try {
      const response = await API.post("/auth/login", {
        email: email.trim(),
        password,
      });
      console.log(response.data);
      const matchedUser = response.data?.user ?? response.data;

      if (!matchedUser) {
        throw new Error("Invalid login response.");
      }

      if (matchedUser.status === "Blocked") {
        setStatusBanner({ type: "error", msg: "Your account is currently blocked by admin." });
        toast.error("Your account is currently blocked by admin.");
        return;
      }

      if (matchedUser.role !== role) {
        setStatusBanner({ type: "error", msg: `This account is registered as ${matchedUser.role}.` });
        toast.error(`This account is registered as ${matchedUser.role}.`);
        return;
      }

      setSession({ ...matchedUser, remember });
      toast.success("Login successful.");
      navigate(matchedUser.role === "admin" ? "/admin/dashboard" : "/user/dashboard");
    } catch (error) {
      const message = error.response?.data?.message || "Invalid email or password.";
      setStatusBanner({ type: "error", msg: message });
      toast.error(message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-content-panel">
          <span className="eyebrow">Institution access</span>
          <h1>Sign in to continue your registration workflow</h1>
          <p>
            Use your institutional account to review schedules, submit course requests, approve
            registrations, and manage conflict resolution.
          </p>

          <div className="auth-side-list">
            <div>
              <strong>Why sign in?</strong>
              <p>Access student dashboards, approval queues, and role-based schedule tools.</p>
            </div>
            <div>
              <strong>Password requirements</strong>
              <p>Use at least 8 characters and keep your campus credentials private.</p>
            </div>
            <div>
              <strong>Support and privacy</strong>
              <p>Need help? Contact your department office. Session data stays within this local workflow.</p>
            </div>
            <div>
              <strong>Admin access</strong>
              <p>Select the admin role only if your account has been created for academic operations.</p>
            </div>
          </div>
        </section>

        <form className="auth-card" onSubmit={handleLogin}>
          <div className="loginHeader">
            <h2>Login</h2>
            <p>Use your student or admin account to enter CourseFlow.</p>
          </div>

          <StatusBanner type={statusBanner.type} msg={statusBanner.msg} />

          <div className="inputGroup">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              placeholder="name@campus.edu"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="inputGroup">
            <label htmlFor="login-password">Password</label>
            <div className="passwordWrap">
              <input
                id="login-password"
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPass((previous) => !previous)}>
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="inputGroup">
            <label htmlFor="login-role">Access role</label>
            <select id="login-role" value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <label className="rememberRow">
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
            <span>Remember this session on this device</span>
          </label>

          <div className="inputGroup">
            <label htmlFor="captcha-input">Security check</label>
            <div className="captchaRow">
              <span className="captchaPrompt" aria-live="polite">
                {captcha}
              </span>
              <button type="button" className="captchaRefresh" onClick={refreshCaptcha}>
                Refresh
              </button>
            </div>
            <input
              id="captcha-input"
              type="text"
              placeholder="Enter the code shown above"
              value={captchaInput}
              onChange={(event) => setCaptchaInput(event.target.value)}
            />
          </div>

          <button className="btn-primary fullBtn">Sign in</button>

          <p className="auth-switch-copy">
            Need an account?
            <button type="button" className="link-button" onClick={() => navigate("/signup")}>
              Create one here
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
