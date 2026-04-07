import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Search, ShieldCheck, UserCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../../layout/AdminLayout";
import StatusBanner from "../../components/StatusBanner";
import API from "../../api";
import { normalizeRegistration, normalizeUser } from "../../services/adapters";
import { getScheduleConflicts } from "../../utils/schedule";

export default function ManageUsers() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [statusBanner, setStatusBanner] = useState({ type: "", msg: "" });
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All states");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        const [usersResponse, registrationsResponse] = await Promise.all([
          API.get("/admin/users"),
          API.get("/registrations"),
        ]);

        setStudents(Array.isArray(usersResponse.data) ? usersResponse.data.map(normalizeUser) : []);
        setRegistrations(
          Array.isArray(registrationsResponse.data)
            ? registrationsResponse.data.map(normalizeRegistration)
            : []
        );
      } catch {
        toast.error("Unable to load student accounts.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const studentRows = useMemo(
    () =>
      students
        .filter((student) => student.role === "student")
        .map((student) => {
          const studentRegistrations = registrations.filter(
            (registration) => registration.studentEmail === student.email
          );
          const approvedRegistrations = studentRegistrations.filter(
            (registration) => registration.status === "Approved"
          );

          return {
            ...student,
            approvedCount: approvedRegistrations.length,
            conflictCount: getScheduleConflicts(approvedRegistrations).length,
            schedule: approvedRegistrations,
          };
        })
        .filter((student) => {
          const matchesSearch =
            !searchText ||
            [student.name, student.email]
              .join(" ")
              .toLowerCase()
              .includes(searchText.toLowerCase());
          const matchesStatus =
            statusFilter === "All states" || student.status === statusFilter;
          return matchesSearch && matchesStatus;
        }),
    [registrations, searchText, statusFilter, students]
  );

  const handleStatusUpdate = async (studentId, status) => {
    try {
      await API.patch(`/admin/users/${studentId}`, { status });
      const usersResponse = await API.get("/admin/users");
      setStudents(Array.isArray(usersResponse.data) ? usersResponse.data.map(normalizeUser) : []);
      setStatusBanner({ type: "success", msg: `Account marked as ${status}.` });
      toast.success(`Account marked as ${status}.`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update student status.");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="spinner">Loading student accounts...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="dashboard-shell">
        <StatusBanner type={statusBanner.type} msg={statusBanner.msg} />

        <section className="page-hero compact-hero">
          <div>
            <span className="eyebrow">Student account management</span>
            <h1>Review account state and registration readiness</h1>
            <p>
              Search students, monitor activity, see how many approved courses they hold, and
              intervene before schedule problems grow.
            </p>
          </div>
        </section>

        <section className="card-surface toolbar-surface filter-surface">
          <div className="toolbar-title">
            <Search size={16} />
            <span>Search student records</span>
          </div>
          <input
            type="text"
            className="page-search"
            placeholder="Search by student name or email"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <div className="filter-grid two-column-grid">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>All states</option>
              <option>Approved</option>
              <option>Blocked</option>
            </select>
          </div>
        </section>

        <section className="stacked-cards">
          {studentRows.map((student) => (
            <article key={student.id} className="registration-card card-surface">
              <div className="course-header-row">
                <div>
                  <div className="tag-row">
                    <span className="chip">{student.status}</span>
                    <span className="chip">{student.approvedCount} approved courses</span>
                    <span className="chip">{student.conflictCount} conflicts</span>
                  </div>
                  <h3>{student.name}</h3>
                  <p className="course-description">{student.email}</p>
                </div>
                <span className={`status-pill ${student.status === "Blocked" ? "danger" : "success"}`}>
                  <UserCircle2 size={14} /> {student.status}
                </span>
              </div>

              <div className="registration-timeline registration-timeline-extended">
                <div>
                  <span className="timeline-label">Joined date</span>
                  <strong>{new Date(student.joinedAt).toLocaleDateString()}</strong>
                </div>
                <div>
                  <span className="timeline-label">Last activity</span>
                  <strong>{new Date(student.lastActiveAt).toLocaleDateString()}</strong>
                </div>
                <div>
                  <span className="timeline-label">Approved courses</span>
                  <strong>{student.approvedCount}</strong>
                </div>
                <div>
                  <span className="timeline-label">Conflict count</span>
                  <strong>{student.conflictCount}</strong>
                </div>
              </div>

              <div className="button-row spaced-row">
                <button onClick={() => setSelectedSchedule(student)} className="btn-info">
                  <CalendarClock size={14} /> View schedule
                </button>
                <button onClick={() => handleStatusUpdate(student.id, "Approved")} className="btn-success">
                  <ShieldCheck size={14} /> Approve
                </button>
                <button onClick={() => handleStatusUpdate(student.id, "Blocked")} className="btn-danger">
                  Block
                </button>
              </div>
            </article>
          ))}
        </section>

        {selectedSchedule ? (
          <section className="card-surface">
            <div className="course-header-row">
              <div>
                <span className="eyebrow">Approved schedule preview</span>
                <h2>{selectedSchedule.name}</h2>
              </div>
              <button onClick={() => setSelectedSchedule(null)} className="btn-muted">
                Close
              </button>
            </div>

            <div className="preview-timeline">
              {selectedSchedule.schedule.length === 0 ? (
                <div className="timeline-item">
                  <span className="timeline-dot" />
                  <p>No approved courses yet.</p>
                </div>
              ) : (
                selectedSchedule.schedule.map((course) => (
                  <div key={course.id} className="timeline-item">
                    <span className="timeline-dot" />
                    <div>
                      <strong>{course.courseCode} · {course.courseName}</strong>
                      <p>{course.courseTime} · {course.courseRoom}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        ) : null}
      </div>
    </AdminLayout>
  );
}
