import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  ClipboardList,
  Clock3,
} from "lucide-react";
import toast from "react-hot-toast";
import UserLayout from "../../layout/UserLayout";
import API from "../../api";
import { normalizeRegistration } from "../../services/adapters";
import { getCurrentUser } from "../../services/session";
import { getScheduleConflicts, parseCourseTimeRange } from "../../utils/schedule";

const weekOrder = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const getNextClass = (approvedCourses) =>
  approvedCourses
    .map((course) => ({ ...course, parsedTime: parseCourseTimeRange(course.courseTime) }))
    .filter((course) => course.parsedTime)
    .sort((first, second) => {
      const dayDifference =
        weekOrder.indexOf(first.parsedTime.dayKey) - weekOrder.indexOf(second.parsedTime.dayKey);
      if (dayDifference !== 0) {
        return dayDifference;
      }
      return first.parsedTime.startMinutes - second.parsedTime.startMinutes;
    })[0];

export default function UserDashboard() {
  const [registrations, setRegistrations] = useState([]);
  const currentUser = getCurrentUser();

  useEffect(() => {
    const loadRegistrations = async () => {
      try {
        const response = await API.get("/registrations");
        const normalizedRegistrations = Array.isArray(response.data)
          ? response.data.map(normalizeRegistration)
          : [];

        setRegistrations(
          normalizedRegistrations.filter(
            (registration) =>
              registration.userId === currentUser?.id ||
              registration.userEmail === currentUser?.email
          )
        );
      } catch {
        toast.error("Unable to load dashboard data.");
      }
    };

    loadRegistrations();
  }, [currentUser?.email, currentUser?.id]);

  const approvedCourses = useMemo(
    () => registrations.filter((registration) => registration.status === "Approved"),
    [registrations]
  );
  const pendingCourses = useMemo(
    () => registrations.filter((registration) => registration.status === "Pending"),
    [registrations]
  );
  const conflictAlerts = useMemo(() => getScheduleConflicts(approvedCourses), [approvedCourses]);
  const nextClass = useMemo(() => getNextClass(approvedCourses), [approvedCourses]);

  const recommendedActions = useMemo(
    () => [
      {
        title: "Browse course catalog",
        description: "Explore electives, compare sections, and request additional seats.",
        to: "/user/browse-courses",
      },
      {
        title: "Review pending items",
        description: pendingCourses.length
          ? `${pendingCourses.length} request${pendingCourses.length > 1 ? "s are" : " is"} waiting for admin review.`
          : "No pending items right now, but you can review past decision notes anytime.",
        to: "/user/my-registrations",
      },
      {
        title: "Resolve schedule conflicts",
        description: conflictAlerts.length
          ? `${conflictAlerts.length} conflict alert${conflictAlerts.length > 1 ? "s need" : " needs"} your attention.`
          : "Your current approved timetable is conflict free.",
        to: "/user/schedule",
      },
    ],
    [conflictAlerts.length, pendingCourses.length]
  );

  const activityFeed = useMemo(
    () =>
      registrations.slice(0, 4).map((registration) => ({
        id: registration.id,
        title: `${registration.courseCode} · ${registration.courseName}`,
        detail:
          registration.status === "Pending"
            ? "Request submitted and waiting for approval."
            : registration.status === "Approved"
              ? registration.decisionNote || "Approved and added to your schedule."
              : registration.rejectionReason || registration.decisionNote || "Request was rejected.",
        date: registration.updatedAt || registration.createdAt,
      })),
    [registrations]
  );

  return (
    <UserLayout>
      <div className="dashboard-shell">
        <section className="page-hero">
          <div>
            <span className="eyebrow">Student dashboard</span>
            <h1>Welcome back{currentUser?.name ? `, ${currentUser.name}` : ""}</h1>
            <p>
              Here is your current registration picture, your next class, and the actions that
              will keep your term plan moving forward.
            </p>
          </div>
          <div className="hero-actions">
            <Link to="/user/browse-courses" className="btn-primary home-link-btn">
              Browse courses <ArrowRight size={16} />
            </Link>
            <Link to="/user/my-registrations" className="btn-secondary home-link-btn">
              Review requests
            </Link>
          </div>
        </section>

        <section className="stats-row">
          <article className="dashboard-stat-card">
            <BookOpen size={18} />
            <strong>{approvedCourses.length}</strong>
            <span>Approved courses</span>
            <p>Confirmed classes already included in your active term plan.</p>
          </article>
          <article className="dashboard-stat-card">
            <ClipboardList size={18} />
            <strong>{pendingCourses.length}</strong>
            <span>Pending requests</span>
            <p>Requests still moving through the admin approval workflow.</p>
          </article>
          <article className="dashboard-stat-card alert-card">
            <AlertTriangle size={18} />
            <strong>{conflictAlerts.length}</strong>
            <span>Conflict alerts</span>
            <p>Approved courses with overlapping time windows that need review.</p>
          </article>
        </section>

        <section className="split-panel dashboard-split">
          <article className="card-surface emphasis-panel">
            <span className="eyebrow">Next class</span>
            <h2>{nextClass ? nextClass.courseName : "No approved class yet"}</h2>
            <p>
              {nextClass
                ? `${nextClass.courseTime} with ${nextClass.courseFaculty} in ${nextClass.courseRoom}.`
                : "Approve at least one request to see your next scheduled class here."}
            </p>
            {nextClass ? (
              <div className="tag-row">
                <span className="chip chip-core">{nextClass.courseCode}</span>
                <span className="chip">{nextClass.courseCredits} credits</span>
                <span className="chip">{nextClass.courseMode}</span>
              </div>
            ) : null}
          </article>

          <article className="card-surface">
            <span className="eyebrow">Recommended actions</span>
            <h2>What should you do next?</h2>
            <div className="workflow-list compact-list">
              {recommendedActions.map((action) => (
                <Link key={action.title} to={action.to} className="workflow-link">
                  <strong>{action.title}</strong>
                  <span>{action.description}</span>
                </Link>
              ))}
            </div>
          </article>
        </section>

        <section className="split-panel dashboard-split">
          <article className="card-surface">
            <span className="eyebrow">Recent activity</span>
            <h2>Latest registration updates</h2>
            <div className="preview-timeline">
              {activityFeed.length === 0 ? (
                <div className="timeline-item">
                  <span className="timeline-dot" />
                  <p>Your recent activity will appear here after you submit requests.</p>
                </div>
              ) : (
                activityFeed.map((item) => (
                  <div key={item.id} className="timeline-item">
                    <span className="timeline-dot" />
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                      <span className="timeline-meta">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="card-surface">
            <span className="eyebrow">Schedule snapshot</span>
            <h2>Keep your week balanced</h2>
            <div className="preview-timeline">
              <div className="timeline-item">
                <CalendarClock size={14} />
                <p>{approvedCourses.length} approved classes are already on your weekly plan.</p>
              </div>
              <div className="timeline-item">
                <Clock3 size={14} />
                <p>
                  {conflictAlerts.length
                    ? "Review overlaps before adding more classes to your busiest days."
                    : "Your approved classes currently fit together without time clashes."}
                </p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </UserLayout>
  );
}
