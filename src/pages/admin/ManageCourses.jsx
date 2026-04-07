import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen, Layers3, MapPin, PlusCircle, Users } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../../layout/AdminLayout";
import SkeletonCard from "../../components/SkeletonCard";
import StatusBanner from "../../components/StatusBanner";
import API from "../../api";
import { normalizeCourse } from "../../services/adapters";
import { parseCourseTimeRange } from "../../utils/schedule";

const EMPTY_FORM = {
  courseName: "",
  courseCode: "",
  faculty: "",
  facultyProfile: "",
  time: "",
  credits: 3,
  capacity: 30,
  department: "Computer Science",
  semester: "Semester 1",
  prerequisites: "",
  room: "",
  mode: "In Person",
  description: "",
};

export default function ManageCourses() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [statusBanner, setStatusBanner] = useState({ type: "", msg: "" });
  const [formData, setFormData] = useState(EMPTY_FORM);

  const loadCourses = async () => {
    const response = await API.get("/courses");
    setCourses(Array.isArray(response.data) ? response.data.map(normalizeCourse) : []);
  };

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);

      try {
        await loadCourses();
      } catch {
        toast.error("Unable to load courses.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    const editCourseId = Number(searchParams.get("editCourseId"));
    if (!editCourseId || courses.length === 0) {
      return;
    }

    const selectedCourse = courses.find((course) => course.id === editCourseId);
    if (selectedCourse) {
      setShowForm(true);
      setEditingCourseId(selectedCourse.id);
      setFormData({ ...EMPTY_FORM, ...selectedCourse });
    }
  }, [courses, searchParams]);

  const overview = useMemo(() => {
    const totalCapacity = courses.reduce((sum, course) => sum + Number(course.capacity || 0), 0);
    const totalEnrolled = courses.reduce((sum, course) => sum + Number(course.enrolledCount || 0), 0);

    return {
      count: courses.length,
      departments: new Set(courses.map((course) => course.department)).size,
      capacity: totalCapacity,
      enrolled: totalEnrolled,
    };
  }, [courses]);

  const handleAddClick = () => {
    setShowForm(true);
    setEditingCourseId(null);
    setFormData(EMPTY_FORM);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCourseId(null);
    setFormData(EMPTY_FORM);
  };

  const handleDelete = async (courseId) => {
    try {
      await API.delete(`/courses/${courseId}`);
      await loadCourses();
      setStatusBanner({ type: "success", msg: "Course removed from the catalog." });
      toast.success("Course removed from the catalog.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to remove the course.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.courseName || !formData.courseCode || !formData.faculty || !formData.time) {
      setStatusBanner({ type: "error", msg: "Complete the course title, code, faculty, and time fields." });
      toast.error("Complete the required course fields.");
      return;
    }

    if (!parseCourseTimeRange(formData.time)) {
      setStatusBanner({ type: "error", msg: "Use time like Mon 10:00 AM - 11:30 AM." });
      toast.error("Use time like Mon 10:00 AM - 11:30 AM.");
      return;
    }

    try {
      if (editingCourseId) {
        await API.put(`/courses/${editingCourseId}`, formData);
        setStatusBanner({ type: "success", msg: "Course details updated successfully." });
        toast.success("Course details updated successfully.");
      } else {
        await API.post("/courses", formData);
        setStatusBanner({ type: "success", msg: "Course published to the catalog." });
        toast.success("Course published to the catalog.");
      }

      await loadCourses();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save course details.");
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
        <StatusBanner type={statusBanner.type} msg={statusBanner.msg} />

        <section className="page-hero compact-hero">
          <div>
            <span className="eyebrow">Course catalog administration</span>
            <h1>Manage publish-ready course details</h1>
            <p>
              Keep course metadata complete so students can compare options and admins can review
              queue decisions with confidence.
            </p>
          </div>
          <div className="hero-actions">
            <button onClick={handleAddClick} className="btn-primary">
              <PlusCircle size={16} /> Add new course
            </button>
          </div>
        </section>

        <section className="stats-row">
          <article className="dashboard-stat-card">
            <BookOpen size={18} />
            <strong>{overview.count}</strong>
            <span>Published sections</span>
            <p>Total course offerings visible to students this term.</p>
          </article>
          <article className="dashboard-stat-card">
            <Layers3 size={18} />
            <strong>{overview.departments}</strong>
            <span>Departments</span>
            <p>Academic areas currently represented in the catalog.</p>
          </article>
          <article className="dashboard-stat-card">
            <MapPin size={18} />
            <strong>{overview.capacity}</strong>
            <span>Total seat capacity</span>
            <p>Combined seat count across all published sections.</p>
          </article>
          <article className="dashboard-stat-card">
            <Users size={18} />
            <strong>{overview.enrolled}</strong>
            <span>Approved seats filled</span>
            <p>Approved enrollments already occupying published capacity.</p>
          </article>
        </section>

        {showForm ? (
          <form onSubmit={handleSubmit} className="course-form-grid card-surface">
            <div className="form-heading">
              <h2>{editingCourseId ? "Edit course details" : "Create a new course section"}</h2>
              <p>Use complete academic metadata so the catalog feels trustworthy and operationally useful.</p>
            </div>

            <input placeholder="Course title" value={formData.courseName} onChange={(event) => setFormData((previous) => ({ ...previous, courseName: event.target.value }))} />
            <input placeholder="Course code" value={formData.courseCode} onChange={(event) => setFormData((previous) => ({ ...previous, courseCode: event.target.value.toUpperCase() }))} />
            <input placeholder="Faculty name" value={formData.faculty} onChange={(event) => setFormData((previous) => ({ ...previous, faculty: event.target.value }))} />
            <input placeholder="Faculty profile snippet" value={formData.facultyProfile} onChange={(event) => setFormData((previous) => ({ ...previous, facultyProfile: event.target.value }))} />
            <input placeholder="Mon 10:00 AM - 11:30 AM" value={formData.time} onChange={(event) => setFormData((previous) => ({ ...previous, time: event.target.value }))} />
            <input placeholder="Department" value={formData.department} onChange={(event) => setFormData((previous) => ({ ...previous, department: event.target.value }))} />
            <input placeholder="Semester" value={formData.semester} onChange={(event) => setFormData((previous) => ({ ...previous, semester: event.target.value }))} />
            <input placeholder="Prerequisites" value={formData.prerequisites} onChange={(event) => setFormData((previous) => ({ ...previous, prerequisites: event.target.value }))} />
            <input type="number" min="1" placeholder="Credits" value={formData.credits} onChange={(event) => setFormData((previous) => ({ ...previous, credits: Number(event.target.value) }))} />
            <input type="number" min="1" placeholder="Seat capacity" value={formData.capacity} onChange={(event) => setFormData((previous) => ({ ...previous, capacity: Number(event.target.value) }))} />
            <input placeholder="Room or location" value={formData.room} onChange={(event) => setFormData((previous) => ({ ...previous, room: event.target.value }))} />
            <input placeholder="Delivery mode" value={formData.mode} onChange={(event) => setFormData((previous) => ({ ...previous, mode: event.target.value }))} />
            <textarea placeholder="Short description for students" value={formData.description} onChange={(event) => setFormData((previous) => ({ ...previous, description: event.target.value }))} />

            <div className="form-actions-row">
              <button type="submit" className="btn-success">
                {editingCourseId ? "Save course changes" : "Publish course"}
              </button>
              <button type="button" onClick={resetForm} className="btn-muted">
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        <section className="course-grid">
          {courses.map((course) => (
            <article key={course.id} className="course-showcase-card">
              <div className="course-header-row">
                <div>
                  <div className="tag-row">
                    <span className="chip chip-core">{course.courseCode}</span>
                    <span className="chip">{course.department}</span>
                    <span className="chip">{course.semester}</span>
                  </div>
                  <h3>{course.courseName}</h3>
                </div>
                <span className="status-pill info">{course.mode}</span>
              </div>

              <p className="course-description">{course.description}</p>

              <div className="course-meta-grid">
                <p>{course.faculty}</p>
                <p>{course.time}</p>
                <p>{course.room}</p>
                <p>{course.credits} credits</p>
              </div>

              <div className="metadata-grid">
                <span>Capacity: {course.capacity}</span>
                <span>Approved enrolled: {course.enrolledCount}</span>
                <span>Prerequisites: {course.prerequisites || "None"}</span>
              </div>

              <div className="course-footer-row">
                <span className="subtle-text">{course.facultyProfile}</span>
                <div className="button-row">
                  <button onClick={() => { setShowForm(true); setEditingCourseId(course.id); setFormData({ ...EMPTY_FORM, ...course }); }} className="btn-info">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(course.id)} className="btn-danger">
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </AdminLayout>
  );
}
