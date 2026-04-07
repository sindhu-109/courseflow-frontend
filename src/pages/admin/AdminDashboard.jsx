import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BookOpen,
  ClipboardList,
  Clock3,
  TrendingUp,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../../layout/AdminLayout";
import API from "../../api";
import {
  normalizeCourse,
  normalizeRegistration,
  normalizeUser,
} from "../../services/adapters";
import { getScheduleConflicts } from "../../utils/schedule";

export default function AdminDashboard() {
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [coursesResponse, usersResponse, registrationsResponse] = await Promise.all([
          API.get("/courses"),
          API.get("/admin/users"),
          API.get("/registrations"),
        ]);

        setCourses(Array.isArray(coursesResponse.data) ? coursesResponse.data.map(normalizeCourse) : []);
        setUsers(Array.isArray(usersResponse.data) ? usersResponse.data.map(normalizeUser) : []);
        setRegistrations(
          Array.isArray(registrationsResponse.data)
            ? registrationsResponse.data.map(normalizeRegistration)
            : []
        );
      } catch {
        toast.error("Unable to load admin dashboard data.");
      }
    };

    loadDashboard();
  }, []);

  const students = useMemo(
    () => users.filter((user) => user.role === "student"),
    [users]
  );
  const pendingRegistrations = useMemo(
    () => registrations.filter((registration) => registration.status === "Pending"),
    [registrations]
  );
  const approvedRegistrations = useMemo(
    () => registrations.filter((registration) => registration.status === "Approved"),
    [registrations]
  );
  const conflictAlerts = useMemo(
    () => getScheduleConflicts(approvedRegistrations),
    [approvedRegistrations]
  );
  const courseDemand = useMemo(
    () =>
      Object.values(
        registrations.reduce((accumulator, registration) => {
          if (!accumulator[registration.courseId]) {
            accumulator[registration.courseId] = {
              id: registration.courseId,
              courseName: registration.courseName,
              courseCode: registration.courseCode,
              requests: 0,
              pending: 0,
            };
          }
          accumulator[registration.courseId].requests += 1;
          if (registration.status === "Pending") {
            accumulator[registration.courseId].pending += 1;
          }
          return accumulator;
        }, {})
      )
        .sort((first, second) => second.requests - first.requests)
        .slice(0, 5),
    [registrations]
  );

  const recentEvents = useMemo(
    () =>
      registrations.slice(0, 5).map((registration) => ({
        id: registration.id,
        title: `${registration.student} · ${registration.courseCode}`,
        detail:
          registration.status === "Pending"
            ? `Requested ${registration.courseName} and is waiting for review.`
            : `${registration.status} · ${registration.decisionNote || "Decision recorded."}`,
      })),
    [registrations]
  );

  const severitySummary = useMemo(
    () =>
      conflictAlerts.reduce(
        (summary, conflict) => {
          summary[conflict.severity] = (summary[conflict.severity] || 0) + 1;
          return summary;
        },
        { High: 0, Medium: 0, Low: 0 }
      ),
    [conflictAlerts]
  );

  return (
    <AdminLayout>
      <div className="dashboard-shell">
        <section className="page-hero compact-hero">
          <div>
            <span className="eyebrow">Admin operations</span>
            <h1>Run the registration cycle from one control center</h1>
            <p>
              Track queue health, student demand, conflict severity, and the exact actions that
              should happen today.
            </p>
          </div>
          <div className="hero-actions">
            <Link to="/admin/registrations" className="btn-primary home-link-btn">
              Review approvals
            </Link>
            <Link to="/admin/manage-courses" className="btn-secondary home-link-btn">
              Update catalog
            </Link>
          </div>
        </section>

        <section className="stats-row">
          <article className="dashboard-stat-card">
            <Users size={18} />
            <strong>{students.length}</strong>
            <span>Active students</span>
            <p>Accounts currently available to request and manage course selections.</p>
          </article>
          <article className="dashboard-stat-card">
            <BookOpen size={18} />
            <strong>{courses.length}</strong>
            <span>Published sections</span>
            <p>Course sections with metadata students can already review and request.</p>
          </article>
          <article className="dashboard-stat-card">
            <ClipboardList size={18} />
            <strong>{pendingRegistrations.length}</strong>
            <span>Approval queue</span>
            <p>Requests that need a decision before students can finalize their schedules.</p>
          </article>
          <article className="dashboard-stat-card alert-card">
            <AlertTriangle size={18} />
            <strong>{conflictAlerts.length}</strong>
            <span>Conflict alerts</span>
            <p>Approved schedules currently carrying overlap risk across the timetable.</p>
          </article>
        </section>

        <section className="split-panel dashboard-split">
          <article className="card-surface">
            <span className="eyebrow">Action required today</span>
            <h2>Priority items for the operations team</h2>
            <div className="preview-timeline">
              <div className="timeline-item">
                <Clock3 size={14} />
                <p>{pendingRegistrations.length} pending request(s) still need approval decisions.</p>
              </div>
              <div className="timeline-item">
                <AlertTriangle size={14} />
                <p>{severitySummary.High} high-severity conflict(s) should be reviewed first.</p>
              </div>
              <div className="timeline-item">
                <TrendingUp size={14} />
                <p>{courseDemand[0]?.courseName || "No course demand yet"} is currently the most requested section.</p>
              </div>
            </div>
          </article>

          <article className="card-surface">
            <span className="eyebrow">Approval queue preview</span>
            <h2>Requests waiting right now</h2>
            <div className="stacked-mini-list">
              {pendingRegistrations.length === 0 ? (
                <p>No pending requests at the moment.</p>
              ) : (
                pendingRegistrations.slice(0, 5).map((request) => (
                  <div key={request.id} className="mini-list-item">
                    <div>
                      <strong>{request.student}</strong>
                      <span>{request.courseCode} · {request.courseName}</span>
                    </div>
                    <span className="status-pill warning">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="split-panel dashboard-split">
          <article className="card-surface">
            <span className="eyebrow">Recent events</span>
            <h2>Latest registration activity</h2>
            <div className="preview-timeline">
              {recentEvents.map((event) => (
                <div key={event.id} className="timeline-item">
                  <span className="timeline-dot" />
                  <div>
                    <strong>{event.title}</strong>
                    <p>{event.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="card-surface">
            <span className="eyebrow">Top 5 requested courses</span>
            <h2>Where demand is concentrating</h2>
            <div className="stacked-mini-list">
              {courseDemand.map((course) => (
                <div key={course.id} className="mini-list-item">
                  <div>
                    <strong>{course.courseCode}</strong>
                    <span>{course.courseName}</span>
                  </div>
                  <span className="status-pill info">{course.requests} requests</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="split-panel dashboard-split">
          <article className="card-surface">
            <span className="eyebrow">Conflict summary</span>
            <h2>Severity by current alert volume</h2>
            <div className="severity-grid">
              <div className="severity-card high">
                <strong>{severitySummary.High}</strong>
                <span>High</span>
              </div>
              <div className="severity-card medium">
                <strong>{severitySummary.Medium}</strong>
                <span>Medium</span>
              </div>
              <div className="severity-card low">
                <strong>{severitySummary.Low}</strong>
                <span>Low</span>
              </div>
            </div>
          </article>

          <article className="card-surface emphasis-panel">
            <span className="eyebrow">Executive note</span>
            <h2>Keep decisions fast and metadata complete</h2>
            <p>
              The strongest registration experience comes from accurate course data, quick queue
              triage, and early intervention on conflicts before they spread across student plans.
            </p>
          </article>
        </section>
      </div>
    </AdminLayout>
  );
}
