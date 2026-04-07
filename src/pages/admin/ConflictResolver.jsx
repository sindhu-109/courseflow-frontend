import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRightCircle, CheckCircle2, Users } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../../layout/AdminLayout";
import API from "../../api";
import { normalizeRegistration } from "../../services/adapters";
import { getScheduleConflicts } from "../../utils/schedule";

const RESOLVED_CONFLICTS_KEY = "resolvedConflicts";

export default function ConflictResolver() {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [resolvedConflictIds, setResolvedConflictIds] = useState(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(RESOLVED_CONFLICTS_KEY) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const loadRegistrations = async () => {
      try {
        const response = await API.get("/registrations");
        setRegistrations(
          Array.isArray(response.data) ? response.data.map(normalizeRegistration) : []
        );
      } catch {
        toast.error("Unable to load conflict data.");
      }
    };

    loadRegistrations();
  }, []);

  const conflicts = useMemo(
    () =>
      getScheduleConflicts(registrations).map((conflict) => ({
        ...conflict,
        resolved: resolvedConflictIds.includes(conflict.id),
      })),
    [registrations, resolvedConflictIds]
  );

  const activeConflictCount = conflicts.filter((conflict) => !conflict.resolved).length;

  const markResolved = (conflictId) => {
    if (resolvedConflictIds.includes(conflictId)) {
      return;
    }

    const nextResolvedIds = [...resolvedConflictIds, conflictId];
    setResolvedConflictIds(nextResolvedIds);
    window.sessionStorage.setItem(RESOLVED_CONFLICTS_KEY, JSON.stringify(nextResolvedIds));
  };

  return (
    <AdminLayout>
      <div className="dashboard-shell">
        <section className="page-hero compact-hero">
          <div>
            <span className="eyebrow">Conflict center</span>
            <h1>Review overlaps with severity and suggested replacement paths</h1>
            <p>
              Jump directly to the affected course records, understand impact, and leave the queue
              with fewer schedule collisions.
            </p>
          </div>
        </section>

        <section className="stats-row">
          <article className="dashboard-stat-card alert-card">
            <AlertTriangle size={18} />
            <strong>{activeConflictCount}</strong>
            <span>Active alerts</span>
            <p>Approved schedules that still have unresolved overlaps.</p>
          </article>
          <article className="dashboard-stat-card success-card">
            <CheckCircle2 size={18} />
            <strong>{conflicts.filter((conflict) => conflict.resolved).length}</strong>
            <span>Resolved</span>
            <p>Conflicts already reviewed and marked complete in this workspace.</p>
          </article>
        </section>

        <section className="stacked-cards">
          {conflicts.length === 0 ? (
            <div className="card-surface">No schedule conflicts were found in approved registrations.</div>
          ) : (
            conflicts.map((conflict) => (
              <article key={conflict.id} className="registration-card card-surface">
                <div className="course-header-row">
                  <div>
                    <div className="tag-row">
                      <span className={`chip severity-chip severity-${conflict.severity.toLowerCase()}`}>
                        {conflict.severity} severity
                      </span>
                      <span className="chip">{conflict.dayLabel}</span>
                    </div>
                    <h3>{conflict.student}</h3>
                    <p className="course-description">{conflict.message}</p>
                  </div>
                  <span className={`status-pill ${conflict.resolved ? "success" : "danger"}`}>
                    {conflict.resolved ? "Resolved" : "Needs action"}
                  </span>
                </div>

                <div className="registration-timeline">
                  <div>
                    <span className="timeline-label">Overlap window</span>
                    <strong>{conflict.timeAlert}</strong>
                  </div>
                  <div>
                    <span className="timeline-label">Impacted students</span>
                    <strong>{conflict.impactedStudentsCount}</strong>
                  </div>
                </div>

                <div className="preview-timeline">
                  {conflict.replacementSuggestions.map((suggestion) => (
                    <div key={suggestion} className="timeline-item alert-item">
                      <Users size={14} />
                      <p>{suggestion}</p>
                    </div>
                  ))}
                </div>

                <div className="button-row spaced-row">
                  <button
                    onClick={() => markResolved(conflict.id)}
                    disabled={conflict.resolved}
                    className={conflict.resolved ? "btn-muted" : "btn-primary"}
                  >
                    {conflict.resolved ? "Reviewed" : "Mark reviewed"}
                  </button>

                  {conflict.courseIds.map((courseId, index) => (
                    <button
                      key={`${conflict.id}-${courseId}`}
                      onClick={() => navigate(`/admin/manage-courses?editCourseId=${courseId}`)}
                      className="btn-success"
                    >
                      <ArrowRightCircle size={14} /> Open {conflict.courseCodes[index]}
                    </button>
                  ))}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
