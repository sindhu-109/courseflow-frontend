import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../../api";
import StatusBanner from "../../components/StatusBanner";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [showPass, setShowPass] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [statusBanner, setStatusBanner] = useState({ type: "", msg: "" });

  const handleSignup = async (event) => {
    event.preventDefault();

    if (!acceptedTerms) {
      setStatusBanner({ type: "error", msg: "Please agree to the privacy and acceptable-use note." });
      return;
    }

    try {
      await API.post("/auth/signup", {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      toast.success("Account created successfully.");
      navigate("/login");
    } catch (error) {
      const message = error.response?.data?.message || "Unable to create account right now.";
      setStatusBanner({ type: "error", msg: message });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-content-panel">
          <span className="eyebrow">Account setup</span>
          <h1>Create your CourseFlow account</h1>
          <p>
            Set up a student or admin profile to manage course registration through a cleaner,
            role-aware academic workflow.
          </p>

          <div className="auth-side-list">
            <div>
              <strong>Why create an account?</strong>
              <p>Students can request courses and follow decisions. Admins can review and manage the queue.</p>
            </div>
            <div>
              <strong>Password requirements</strong>
              <p>Use at least 8 characters. Stronger passwords help protect academic records.</p>
            </div>
            <div>
              <strong>Help and support</strong>
              <p>If you are unsure which role to choose, contact your department coordinator before continuing.</p>
            </div>
            <div>
              <strong>Privacy and security</strong>
              <p>This app uses a local workflow for demo and departmental review use.</p>
            </div>
          </div>
        </section>

        <form className="auth-card" onSubmit={handleSignup}>
          <div className="signupHeader">
            <h2>Create account</h2>
            <p>Choose the role that matches how you will use the system.</p>
          </div>

          <StatusBanner type={statusBanner.type} msg={statusBanner.msg} />

          <div className="roleSelect">
            <button type="button" className={`roleCard ${role === "student" ? "active" : ""}`} onClick={() => setRole("student")}>
              <h4>Student</h4>
              <p>Request courses, track approvals, and manage your schedule.</p>
            </button>
            <button type="button" className={`roleCard ${role === "admin" ? "active" : ""}`} onClick={() => setRole("admin")}>
              <h4>Admin</h4>
              <p>Manage catalog details, approvals, and conflict resolution.</p>
            </button>
          </div>

          <div className="inputGroup">
            <label htmlFor="signup-name">Full name</label>
            <input
              id="signup-name"
              placeholder="Enter your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="inputGroup">
            <label htmlFor="signup-email">Email address</label>
            <input
              id="signup-email"
              type="email"
              placeholder="name@campus.edu"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="inputGroup">
            <label htmlFor="signup-password">Password</label>
            <div className="passwordWrap">
              <input
                id="signup-password"
                type={showPass ? "text" : "password"}
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowPass((previous) => !previous)}>
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <label className="termsRow">
            <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} />
            <span>I understand the privacy note and want to create this account.</span>
          </label>

          <button type="submit" className="btn-primary fullBtn">
            Create account
          </button>

          <p className="auth-switch-copy">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
