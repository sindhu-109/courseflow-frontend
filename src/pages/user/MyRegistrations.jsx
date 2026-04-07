import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  CircleX,
  ClipboardList,
} from "lucide-react";
import toast from "react-hot-toast";
import UserLayout from "../../layout/UserLayout";
import EmptyState from "../../components/EmptyState";
import API from "../../api";
import { normalizeRegistration } from "../../services/adapters";
import { getCurrentUser } from "../../services/session";

const STATUS_META = {
  Approved: {
    icon: CheckCircle2,
    className: "success",
    label: "Approved",
  },
  Pending: {
    icon: CalendarClock,
    className: "warning",
    label: "Pending review",
  },
  Rejected: {
    icon: CircleX,
    className: "danger",
    label: "Rejected",
  },
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "Not recorded");

export default function MyRegistrations() {
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
        toast.error("Unable to load your registrations.");
      } finally {
        setLoading(false);
      }
    };

    loadRegistrations();
  }, [currentUser?.email, currentUser?.id]);

  const statusSummary = useMemo(
    () =>
      registrations.reduce(
        (summary, registration) => {
          summary[registration.status] = (summary[registration.status] || 0) + 1;
          return summary;
        },
        { Approved: 0, Pending: 0, Rejected: 0 }
      ),
    [registrations]
  );

  if (loading) {
    return (
      <UserLayout>
        <div className="spinner">Loading registrations...</div>
      </UserLayout>
    );
  }

  if (registrations.length === 0) {
    return (
      <UserLayout>
        <div className="dashboard-shell">
          <section className="page-hero compact-hero">
            <div>
              <span className="eyebrow">Registration history</span>
              <h1>Track every request and decision</h1>
              <p>Your submission dates, admin decisions, and status timelines will appear here.</p>
            </div>
          </section>

          <EmptyState
            title="No registrations yet"
            desc="Submit a course request to start building your registration timeline."
          />
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="dashboard-shell">
        <section className="page-hero compact-hero">
          <div>
            <span className="eyebrow">Registration history</span>
            <h1>Every request, decision, and timeline in one place</h1>
            <p>
              Review when you submitted each request, when admin decisions happened, and why a
              request was approved or rejected.
            </p>
          </div>
        </section>

        <section className="stats-row">
          <article className="dashboard-stat-card">
            <CheckCircle2 size={18} />
            <strong>{statusSummary.Approved}</strong>
            <span>Approved</span>
            <p>Requests already accepted into your term plan.</p>
          </article>
          <article className="dashboard-stat-card">
            <ClipboardList size={18} />
            <strong>{statusSummary.Pending}</strong>
            <span>Pending</span>
            <p>Requests still waiting for a decision from the admin team.</p>
          </article>
          <article className="dashboard-stat-card alert-card">
            <CircleX size={18} />
            <strong>{statusSummary.Rejected}</strong>
            <span>Rejected</span>
            <p>Requests that need revision, re-submission, or a different section.</p>
          </article>
        </section>

        <section className="stacked-cards">
          {registrations.map((registration) => {
            const meta = STATUS_META[registration.status] || STATUS_META.Pending;
            const StatusIcon = meta.icon;

            return (
              <article key={registration.id} className="registration-card card-surface">
                <div className="course-header-row">
                  <div>
                    <div className="tag-row">
                      <span className="chip chip-core">{registration.courseCode}</span>
                      <span className="chip">{registration.courseDepartment}</span>
                      <span className="chip">{registration.courseSemester}</span>
                    </div>
                    <h3>{registration.courseName}</h3>
                    <p className="course-description">{registration.courseDescription}</p>
                  </div>
                  <span className={`status-pill ${meta.className}`}>
                    <StatusIcon size={14} /> {meta.label}
                  </span>
                </div>

                <div className="course-meta-grid">
                  <p>{registration.courseFaculty}</p>
                  <p>{registration.courseTime}</p>
                  <p>{registration.courseRoom}</p>
                  <p>{registration.courseMode}</p>
                </div>

                <div className="registration-timeline registration-timeline-extended">
                  <div>
                    <span className="timeline-label">Request date</span>
                    <strong>{formatDate(registration.createdAt)}</strong>
                  </div>
                  <div>
                    <span className="timeline-label">Decision date</span>
                    <strong>{formatDate(registration.decisionAt)}</strong>
                  </div>
                  <div>
                    <span className="timeline-label">Last update</span>
                    <strong>{formatDate(registration.updatedAt)}</strong>
                  </div>
                  <div>
                    <span className="timeline-label">Decision note</span>
                    <strong>{registration.decisionNote || "Waiting for admin review."}</strong>
                  </div>
                </div>

                {registration.status === "Rejected" && registration.rejectionReason ? (
                  <div className="decision-callout danger-callout">
                    <span className="timeline-label">Rejection reason</span>
                    <strong>{registration.rejectionReason}</strong>
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      </div>
    </UserLayout>
  );
}
