import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Search, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../../layout/AdminLayout";
import EmptyState from "../../components/EmptyState";
import SkeletonCard from "../../components/SkeletonCard";
import API from "../../api";
import { normalizeRegistration } from "../../services/adapters";

export default function Registrations() {
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [sortBy, setSortBy] = useState("Newest first");
  const [searchText, setSearchText] = useState("");
  const [decisionNotes, setDecisionNotes] = useState({});

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await API.get("/registrations");
      setRegistrations(Array.isArray(res.data) ? res.data.map(normalizeRegistration) : []);
    } catch {
      toast.error("Unable to load registrations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const filteredRequests = useMemo(() => {
    const sorted = [...registrations]
      .filter((registration) => {
        const matchesStatus =
          statusFilter === "All statuses" || registration.status === statusFilter;
        const matchesSearch =
          !searchText ||
          [registration.user?.name, registration.course?.courseName, registration.course?.courseCode]
            .join(" ")
            .toLowerCase()
            .includes(searchText.toLowerCase());

        return matchesStatus && matchesSearch;
      })
      .sort((first, second) => {
        if (sortBy === "Oldest first") {
          return new Date(first.createdAt) - new Date(second.createdAt);
        }
        if (sortBy === "Course name") {
          return (first.course?.courseName || "").localeCompare(second.course?.courseName || "");
        }
        return new Date(second.createdAt) - new Date(first.createdAt);
      });

    return sorted;
  }, [registrations, searchText, sortBy, statusFilter]);

  const pendingCount = registrations.filter((request) => request.status === "Pending").length;
  const approvedCount = registrations.filter((request) => request.status === "Approved").length;
  const rejectedCount = registrations.filter((request) => request.status === "Rejected").length;

  const approve = async (id) => {
    await API.patch(`/admin/approve/${id}`, {
      decisionNote: decisionNotes[id] || "",
    });
    await fetchRegistrations();
  };

  const reject = async (id) => {
    await API.patch(`/admin/reject/${id}`, {
      decisionNote: decisionNotes[id] || "",
    });
    await fetchRegistrations();
  };

  const handleStatusChange = async (requestId, status) => {
    try {
      if (status === "Approved") {
        await approve(requestId);
      } else {
        await reject(requestId);
      }
      toast.success(`Request ${status.toLowerCase()} successfully.`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Unable to ${status.toLowerCase()} request.`);
    }
  };

  const handleBulkAction = async (status) => {
    try {
      await Promise.all(
        registrations
          .filter((request) => request.status === "Pending")
          .map((request) => (status === "Approved" ? approve(request.id) : reject(request.id)))
      );
      toast.success(`Pending requests ${status.toLowerCase()} successfully.`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update all pending requests.");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="dashboard-shell">
        <section className="page-hero compact-hero">
          <div>
            <span className="eyebrow">Approval queue</span>
            <h1>Review registrations with full decision context</h1>
            <p>
              Filter the queue, sort by date or course, add decision notes, and process requests
              individually or in bulk.
            </p>
          </div>
        </section>

        <section className="stats-row">
          <article className="dashboard-stat-card">
            <Clock3 size={18} />
            <strong>{pendingCount}</strong>
            <span>Pending</span>
            <p>Requests still waiting for a decision from the admin team.</p>
          </article>
          <article className="dashboard-stat-card">
            <CheckCircle2 size={18} />
            <strong>{approvedCount}</strong>
            <span>Approved</span>
            <p>Requests already accepted into student term plans.</p>
          </article>
          <article className="dashboard-stat-card alert-card">
            <XCircle size={18} />
            <strong>{rejectedCount}</strong>
            <span>Rejected</span>
            <p>Requests that need a follow-up decision or an alternative course path.</p>
          </article>
        </section>

        <section className="card-surface toolbar-surface filter-surface">
          <div className="toolbar-title">
            <Search size={16} />
            <span>Queue filters</span>
          </div>
          <input
            className="page-search"
            type="text"
            placeholder="Search by student, course title, or course code"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <div className="filter-grid">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>All statuses</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option>Newest first</option>
              <option>Oldest first</option>
              <option>Course name</option>
            </select>
            <button onClick={() => handleBulkAction("Approved")} className="btn-success">
              Bulk approve pending
            </button>
            <button onClick={() => handleBulkAction("Rejected")} className="btn-danger">
              Bulk reject pending
            </button>
          </div>
        </section>

        {filteredRequests.length === 0 ? (
          <EmptyState
            title="No registrations match the current filters"
            desc="Adjust the queue filters or wait for new student requests."
          />
        ) : (
          <section className="stacked-cards">
            {filteredRequests.map((registration) => (
              <article key={registration.id} className="registration-card card-surface">
                <div className="course-header-row">
                  <div>
                    <div className="tag-row">
                      <span className="chip chip-core">{registration.course?.courseCode}</span>
                      <span className="chip">{registration.course?.department}</span>
                      <span className="chip">{registration.course?.semester}</span>
                    </div>
                    <h3>{registration.user?.name}</h3>
                    <p className="course-description">
                      Requested {registration.course?.courseName} on{" "}
                      {new Date(registration.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`status-pill ${registration.status === "Approved" ? "success" : registration.status === "Rejected" ? "danger" : "warning"}`}>
                    {registration.status}
                  </span>
                </div>

                <div className="course-meta-grid">
                  <p>{registration.user?.email}</p>
                  <p>{registration.course?.time}</p>
                  <p>{registration.course?.room}</p>
                  <p>{registration.course?.mode}</p>
                </div>

                <textarea
                  className="decision-textarea"
                  placeholder="Decision notes for the student or department record"
                  value={decisionNotes[registration.id] ?? registration.decisionNote ?? ""}
                  onChange={(event) =>
                    setDecisionNotes((previous) => ({
                      ...previous,
                      [registration.id]: event.target.value,
                    }))
                  }
                />

                <div className="registration-timeline">
                  <div>
                    <span className="timeline-label">Request date</span>
                    <strong>{new Date(registration.createdAt).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span className="timeline-label">Decision date</span>
                    <strong>
                      {registration.decisionAt
                        ? new Date(registration.decisionAt).toLocaleDateString()
                        : "Awaiting review"}
                    </strong>
                  </div>
                </div>

                <div className="button-row spaced-row">
                  <button onClick={() => handleStatusChange(registration.id, "Approved")} className="btn-success">
                    Approve
                  </button>
                  <button onClick={() => handleStatusChange(registration.id, "Rejected")} className="btn-danger">
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </AdminLayout>
  );
}
