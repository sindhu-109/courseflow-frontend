import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  Clock3,
  GraduationCap,
} from "lucide-react";
import toast from "react-hot-toast";
import UserLayout from "../../layout/UserLayout";
import EmptyState from "../../components/EmptyState";
import API from "../../api";
import { normalizeRegistration } from "../../services/adapters";
import { getCurrentUser } from "../../services/session";
import { getScheduleConflicts, parseCourseTimeRange } from "../../utils/schedule";

const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
];

const getNextClass = (approvedCourses) =>
  approvedCourses
    .map((course) => ({ ...course, parsedTime: parseCourseTimeRange(course.courseTime) }))
    .filter((course) => course.parsedTime)
    .sort((first, second) => {
      if (first.parsedTime.dayKey === second.parsedTime.dayKey) {
        return first.parsedTime.startMinutes - second.parsedTime.startMinutes;
      }

      return (
        DAYS.findIndex((day) => day.key === first.parsedTime.dayKey) -
        DAYS.findIndex((day) => day.key === second.parsedTime.dayKey)
      );
    })[0];

export default function MySchedule() {
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  const currentUser = getCurrentUser();

  useEffect(() => {
    const loadRegistrations = async () => {
      setLoading(true);

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
        toast.error("Unable to load your schedule.");
      } finally {
        setLoading(false);
      }
    };

    loadRegistrations();
  }, [currentUser?.email, currentUser?.id]);

  const approvedCourses = useMemo(
    () => registrations.filter((registration) => registration.status === "Approved"),
    [registrations]
  );
  const totalCredits = useMemo(
    () =>
      approvedCourses.reduce(
        (sum, registration) => sum + Number(registration.courseCredits || 0),
        0
      ),
    [approvedCourses]
  );
  const nextClass = useMemo(() => getNextClass(approvedCourses), [approvedCourses]);
  const conflictWarnings = useMemo(() => getScheduleConflicts(approvedCourses), [approvedCourses]);

  const calendarColumns = useMemo(
    () =>
      DAYS.map((day) => ({
        ...day,
        entries: approvedCourses
          .map((course) => ({ ...course, parsedTime: parseCourseTimeRange(course.courseTime) }))
          .filter((course) => course.parsedTime?.dayKey === day.key)
          .sort((first, second) => first.parsedTime.startMinutes - second.parsedTime.startMinutes),
      })),
    [approvedCourses]
  );

  const scheduleHealth = useMemo(() => {
    if (conflictWarnings.length > 0) {
      return "Needs attention";
    }
    if (totalCredits >= 18) {
      return "Heavy load";
    }
    return "Healthy";
  }, [conflictWarnings.length, totalCredits]);

  if (loading) {
    return (
      <UserLayout>
        <div className="spinner">Loading schedule...</div>
      </UserLayout>
    );
  }

  if (approvedCourses.length === 0) {
    return (
      <UserLayout>
        <div className="dashboard-shell">
          <section className="page-hero compact-hero">
            <div>
              <span className="eyebrow">Weekly schedule</span>
              <h1>Build your weekly class plan</h1>
              <p>Approved registrations will appear here as a calendar-style weekly view.</p>
            </div>
          </section>

          <EmptyState
            title="No approved classes yet"
            desc="Request and approve courses to generate your calendar, load summary, and conflict guidance."
          />

          <div>
            <Link to="/user/browse-courses" className="btn-primary home-link-btn">
              Browse courses
            </Link>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="dashboard-shell">
        <section className="page-hero compact-hero">
          <div>
            <span className="eyebrow">Weekly schedule</span>
            <h1>Your timetable at a glance</h1>
            <p>
              Review your total credit load, next upcoming class, and schedule health before you
              add more commitments to the week.
            </p>
          </div>
        </section>

        <section className="stats-row">
          <article className="dashboard-stat-card">
            <CalendarRange size={18} />
            <strong>{approvedCourses.length}</strong>
            <span>Approved classes</span>
            <p>Courses already locked into your active weekly plan.</p>
          </article>
          <article className="dashboard-stat-card">
            <GraduationCap size={18} />
            <strong>{totalCredits}</strong>
            <span>Total credits</span>
            <p>Your current approved credit load for the term.</p>
          </article>
          <article className={`dashboard-stat-card ${conflictWarnings.length ? "alert-card" : "success-card"}`}>
            <AlertTriangle size={18} />
            <strong>{scheduleHealth}</strong>
            <span>Schedule health</span>
            <p>
              {conflictWarnings.length
                ? "Resolve overlap alerts to keep your timetable workable."
                : "No overlap alerts in your approved classes right now."}
            </p>
          </article>
        </section>

        <section className="split-panel dashboard-split">
          <article className="card-surface emphasis-panel">
            <span className="eyebrow">Next upcoming class</span>
            <h2>{nextClass?.courseName || "No class scheduled"}</h2>
            <p>
              {nextClass
                ? `${nextClass.courseTime} with ${nextClass.courseFaculty} in ${nextClass.courseRoom}.`
                : "Once your classes are approved, the next session will appear here."}
            </p>
          </article>

          <article className="card-surface">
            <span className="eyebrow">Conflict guidance</span>
            <h2>Recommended fixes</h2>
            {conflictWarnings.length === 0 ? (
              <div className="empty-state compact-empty">
                <CheckCircle2 size={18} />
                <p>Your approved timetable is conflict free.</p>
              </div>
            ) : (
              <div className="preview-timeline">
                {conflictWarnings.map((warning) => (
                  <div key={warning.id} className="timeline-item alert-item">
                    <AlertTriangle size={14} />
                    <div>
                      <strong>{warning.message}</strong>
                      <p>{warning.timeAlert}</p>
                      <span className="timeline-meta">
                        Suggested fix: {warning.replacementSuggestions[0]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="card-surface">
          <div className="section-heading left-aligned">
            <span className="eyebrow">Weekly calendar</span>
            <h2>See how your classes land across the week</h2>
          </div>

          <div className="weekly-calendar">
            {calendarColumns.map((day) => (
              <div key={day.key} className="calendar-column">
                <div className="calendar-column-header">{day.label}</div>
                <div className="calendar-column-body">
                  {day.entries.length === 0 ? (
                    <div className="calendar-empty">No class scheduled</div>
                  ) : (
                    day.entries.map((course) => (
                      <article key={course.id} className="calendar-event">
                        <span className="calendar-event-time">{course.courseTimeSlot}</span>
                        <strong>{course.courseCode}</strong>
                        <p>{course.courseName}</p>
                        <span>{course.courseRoom}</span>
                      </article>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="course-grid">
          {approvedCourses.map((course) => (
            <article key={course.id} className="course-showcase-card schedule-card">
              <div className="course-header-row">
                <div>
                  <div className="tag-row">
                    <span className="chip chip-core">{course.courseCode}</span>
                    <span className="chip">{course.courseCredits} credits</span>
                    <span className="chip">{course.courseMode}</span>
                  </div>
                  <h3>{course.courseName}</h3>
                </div>
                <span className="status-pill success">Approved</span>
              </div>
              <div className="course-meta-grid">
                <p>
                  <Clock3 size={14} /> {course.courseTime}
                </p>
                <p>
                  <GraduationCap size={14} /> {course.courseFaculty}
                </p>
                <p>
                  <CalendarRange size={14} /> {course.courseRoom}
                </p>
                <p>
                  <CheckCircle2 size={14} /> {course.courseDepartment}
                </p>
              </div>
            </article>
          ))}
        </section>
      </div>
    </UserLayout>
  );
}
