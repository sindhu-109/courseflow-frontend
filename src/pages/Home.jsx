import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarRange,
  ClipboardCheck,
  LayoutPanelTop,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { getRole } from "../services/session";

const featureCards = [
  {
    title: "Course discovery",
    description:
      "Students can compare courses using credits, capacity, prerequisites, faculty context, and schedule details before they request a seat.",
    icon: BookOpen,
  },
  {
    title: "Schedule planning",
    description:
      "Weekly planning surfaces total load, next class timing, and conflict risk early instead of after approvals are already delayed.",
    icon: CalendarRange,
  },
  {
    title: "Approval workflow",
    description:
      "Admins get a practical queue with decision context, timestamps, notes, and operational visibility instead of a bare status table.",
    icon: ClipboardCheck,
  },
  {
    title: "Conflict detection",
    description:
      "The system flags overlaps, grades severity, and points teams to the exact courses and replacement paths that need attention.",
    icon: ShieldCheck,
  },
];

const workflowSteps = [
  {
    step: "1",
    title: "Students build a realistic plan",
    description:
      "Browse rich course cards, filter by department or timing, and request classes with enough detail to make confident choices.",
  },
  {
    step: "2",
    title: "Requests move through review",
    description:
      "Approval teams see queue health, pending demand, course pressure, and the notes they need to approve or reject quickly.",
  },
  {
    step: "3",
    title: "Schedules stay healthy",
    description:
      "Conflict alerts, recent activity, and dashboard summaries keep both students and admins aligned on what should happen next.",
  },
];

const audienceBenefits = {
  students: [
    "See approved courses, pending requests, and conflict alerts in one dashboard.",
    "Plan a weekly schedule before problems become registration blockers.",
    "Track request timelines, decisions, and rejection reasons clearly.",
  ],
  admins: [
    "Review approvals with queue metrics and recent event context.",
    "Monitor demand, capacity pressure, and the most requested courses.",
    "Resolve schedule conflicts faster with direct links to impacted courses.",
  ],
};

const dashboardPreviewStats = [
  { label: "Approved courses", value: "18" },
  { label: "Pending reviews", value: "09" },
  { label: "Conflict alerts", value: "03" },
  { label: "Open sections", value: "26" },
];

export default function Home() {
  const role = getRole();
  const dashboardPath =
    role === "admin" ? "/admin/dashboard" : role === "student" ? "/user/dashboard" : "/login";

  return (
    <div className="home-page premium-page">
      <header className="landing-navbar">
        <div>
          <span className="eyebrow">Academic operations suite</span>
          <h3>CourseFlow</h3>
        </div>

        <div className="home-auth-links">
          <Link to="/login" className="btn-secondary home-link-btn">
            Login
          </Link>
          <Link to="/signup" className="btn-primary home-link-btn">
            Create account
          </Link>
        </div>
      </header>

      <main className="landing-main landing-main-spaced">
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow">Modern course registration</span>
            <h1>One workspace for course discovery, schedule planning, approvals, and conflict resolution.</h1>
            <p>
              CourseFlow helps students build stronger schedules and gives academic teams an
              operations dashboard that feels designed for real registration work.
            </p>

            <div className="landing-actions">
              <Link to={dashboardPath} className="btn-primary home-link-btn">
                Open dashboard <ArrowRight size={16} />
              </Link>
              <Link to="/user/browse-courses" className="btn-secondary home-link-btn">
                Browse course catalog
              </Link>
            </div>

            <div className="trust-strip">
              <div className="trust-item">
                <Sparkles size={16} />
                <span>Used by departments</span>
              </div>
              <div className="trust-item">
                <ShieldCheck size={16} />
                <span>Secure local workflow</span>
              </div>
              <div className="trust-item">
                <Users size={16} />
                <span>Fast approvals</span>
              </div>
            </div>
          </div>

          <div className="hero-preview card-surface">
            <div className="preview-header">
              <span className="status-pill success">Live preview</span>
              <span>Student and admin overview</span>
            </div>

            <div className="preview-grid">
              {dashboardPreviewStats.map((item) => (
                <div key={item.label} className="metric-card">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <div className="mock-dashboard-list">
              <div className="mock-dashboard-item">
                <div>
                  <span className="mock-label">Next class</span>
                  <strong>Data Structures | Monday 10:00 AM</strong>
                </div>
                <span className="status-pill info">Block A Room 204</span>
              </div>
              <div className="mock-dashboard-item">
                <div>
                  <span className="mock-label">Action required today</span>
                  <strong>Review 4 pending requests with schedule overlaps</strong>
                </div>
                <span className="status-pill warning">Queue priority</span>
              </div>
              <div className="mock-dashboard-item">
                <div>
                  <span className="mock-label">Conflict summary</span>
                  <strong>Software Engineering overlaps with Data Structures</strong>
                </div>
                <span className="status-pill danger">High severity</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section-stack">
          <div className="section-heading">
            <span className="eyebrow">Product capabilities</span>
            <h2>Stronger content and clearer decision support on every core screen.</h2>
          </div>
          <div className="feature-grid">
            {featureCards.map((feature) => (
              <article key={feature.title} className="feature-card">
                <feature.icon size={20} />
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-stack">
          <div className="section-heading">
            <span className="eyebrow">How it works</span>
            <h2>Three steps from discovery to an approved schedule.</h2>
          </div>
          <div className="workflow-list workflow-columns">
            {workflowSteps.map((item) => (
              <article key={item.step} className="workflow-item card-surface">
                <span className="workflow-index">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="split-panel">
          <article className="card-surface">
            <span className="eyebrow">Benefits for students</span>
            <h2>Know exactly what to do next.</h2>
            <div className="bullet-list">
              {audienceBenefits.students.map((benefit) => (
                <p key={benefit}>{benefit}</p>
              ))}
            </div>
          </article>

          <article className="card-surface">
            <span className="eyebrow">Benefits for admins</span>
            <h2>Run registration like an operations team.</h2>
            <div className="bullet-list">
              {audienceBenefits.admins.map((benefit) => (
                <p key={benefit}>{benefit}</p>
              ))}
            </div>
          </article>
        </section>

        <section className="split-panel">
          <article className="card-surface">
            <span className="eyebrow">Trust and readiness</span>
            <h2>Designed for practical department use.</h2>
            <div className="trust-grid">
              <div className="trust-card">
                <LayoutPanelTop size={18} />
                <strong>Clear operations view</strong>
                <p>KPI cards, queue previews, and conflict summaries support daily review work.</p>
              </div>
              <div className="trust-card">
                <ShieldCheck size={18} />
                <strong>Role-based access</strong>
                <p>Student and admin experiences stay separate while sharing one consistent system.</p>
              </div>
            </div>
          </article>

          <article className="card-surface emphasis-panel">
            <span className="eyebrow">Ready to start</span>
            <h2>Move from thin templates to a real academic product.</h2>
            <p>
              The refreshed experience focuses on stronger copy, clearer hierarchy, and richer
              content on the screens teams actually use every day.
            </p>
          </article>
        </section>
      </main>

      <footer className="landing-footer">
        <p>CourseFlow | 2026</p>
        <div className="landing-footer-links">
          <Link to="/">About</Link>
          <Link to="/login">Support</Link>
          <Link to="/signup">Privacy</Link>
          <Link to="/login">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
