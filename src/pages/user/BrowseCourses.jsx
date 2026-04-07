import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CalendarRange,
  Search,
  UserCircle2,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import UserLayout from "../../layout/UserLayout";
import EmptyState from "../../components/EmptyState";
import SkeletonCard from "../../components/SkeletonCard";
import API from "../../api";
import { normalizeCourse, normalizeRegistration } from "../../services/adapters";
import { getCurrentUser } from "../../services/session";

const FILTER_DEFAULTS = {
  department: "All departments",
  faculty: "All faculty",
  day: "All days",
  timeSlot: "All time slots",
  availability: "Any availability",
};

const getTimeBucket = (timeText) => {
  if (timeText.includes("8:") || timeText.includes("9:") || timeText.includes("10:")) {
    return "Morning";
  }
  if (
    timeText.includes("11:") ||
    timeText.includes("12:") ||
    timeText.includes("1:") ||
    timeText.includes("2:")
  ) {
    return "Midday";
  }
  return "Afternoon";
};

export default function BrowseCourses() {
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [filters, setFilters] = useState(FILTER_DEFAULTS);

  const currentUser = getCurrentUser();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        const [coursesResponse, registrationsResponse] = await Promise.all([
          API.get("/courses"),
          currentUser?.id ? API.get("/registrations") : Promise.resolve({ data: [] }),
        ]);

        setCourses(Array.isArray(coursesResponse.data) ? coursesResponse.data.map(normalizeCourse) : []);

        const normalizedRegistrations = Array.isArray(registrationsResponse.data)
          ? registrationsResponse.data.map(normalizeRegistration)
          : [];

        setRegistrations(
          normalizedRegistrations.filter(
            (registration) =>
              registration.userId === currentUser?.id ||
              registration.userEmail === currentUser?.email
          )
        );
      } catch {
        toast.error("Unable to load the course catalog.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser?.email, currentUser?.id]);

  const registrationByCourseId = useMemo(
    () =>
      registrations.reduce((result, registration) => {
        result[registration.courseId] = registration.status;
        return result;
      }, {}),
    [registrations]
  );

  const filterOptions = useMemo(
    () => ({
      departments: ["All departments", ...new Set(courses.map((course) => course.department))],
      faculty: ["All faculty", ...new Set(courses.map((course) => course.faculty))],
      days: ["All days", ...new Set(courses.map((course) => course.day))],
      timeSlots: ["All time slots", "Morning", "Midday", "Afternoon"],
      availability: ["Any availability", "Open seats", "Low availability"],
    }),
    [courses]
  );

  const filteredCourses = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesQuery =
        !query ||
        [
          course.courseName,
          course.courseCode,
          course.department,
          course.faculty,
          course.description,
          course.prerequisites,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesDepartment =
        filters.department === FILTER_DEFAULTS.department || course.department === filters.department;
      const matchesFaculty =
        filters.faculty === FILTER_DEFAULTS.faculty || course.faculty === filters.faculty;
      const matchesDay = filters.day === FILTER_DEFAULTS.day || course.day === filters.day;
      const matchesTimeSlot =
        filters.timeSlot === FILTER_DEFAULTS.timeSlot ||
        getTimeBucket(course.time) === filters.timeSlot;
      const matchesAvailability =
        filters.availability === FILTER_DEFAULTS.availability ||
        (filters.availability === "Open seats" && course.availableSeats > 5) ||
        (filters.availability === "Low availability" && course.availableSeats <= 5);

      return (
        matchesQuery &&
        matchesDepartment &&
        matchesFaculty &&
        matchesDay &&
        matchesTimeSlot &&
        matchesAvailability
      );
    });
  }, [courses, filters, searchText]);

  const handleFilterChange = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
  };

  const handleEnroll = async (courseId) => {
    if (!currentUser?.id) {
      toast.error("Please login again.");
      return;
    }

    try {
      await API.post(`/registrations?userId=${currentUser.id}&courseId=${courseId}`);
      const registrationsResponse = await API.get("/registrations");
      const normalizedRegistrations = Array.isArray(registrationsResponse.data)
        ? registrationsResponse.data.map(normalizeRegistration)
        : [];

      setRegistrations(
        normalizedRegistrations.filter(
          (registration) =>
            registration.userId === currentUser.id ||
            registration.userEmail === currentUser.email
        )
      );
      toast.success("Registration request submitted for admin approval.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to submit registration request.");
    }
  };

  if (loading) {
    return (
      <UserLayout>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="dashboard-shell">
        <section className="page-hero compact-hero">
          <div>
            <span className="eyebrow">Course catalog</span>
            <h1>Find the right course for your term plan</h1>
            <p>
              Compare course code, credits, faculty, timing, prerequisites, availability, and
              delivery mode before you request a seat.
            </p>
          </div>
          <div className="hero-actions">
            <Link to="/user/my-registrations" className="btn-secondary home-link-btn">
              My requests
            </Link>
          </div>
        </section>

        <section className="card-surface toolbar-surface filter-surface">
          <div className="toolbar-title">
            <Search size={16} />
            <span>Search and refine the catalog</span>
          </div>

          <input
            type="text"
            placeholder="Search by title, code, faculty, prerequisite, or department"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="page-search"
          />

          <div className="filter-grid">
            <select value={filters.department} onChange={(event) => handleFilterChange("department", event.target.value)}>
              {filterOptions.departments.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select value={filters.faculty} onChange={(event) => handleFilterChange("faculty", event.target.value)}>
              {filterOptions.faculty.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select value={filters.day} onChange={(event) => handleFilterChange("day", event.target.value)}>
              {filterOptions.days.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select value={filters.timeSlot} onChange={(event) => handleFilterChange("timeSlot", event.target.value)}>
              {filterOptions.timeSlots.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select value={filters.availability} onChange={(event) => handleFilterChange("availability", event.target.value)}>
              {filterOptions.availability.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </section>

        {courses.length === 0 ? (
          <EmptyState
            title="No courses available yet"
            desc="Course sections will appear here once the catalog is published."
          />
        ) : (
          <div className="course-grid course-grid-dense">
            {filteredCourses.length === 0 ? (
              <EmptyState
                title="No matching courses found"
                desc="Try clearing a filter or searching with a broader keyword."
              />
            ) : (
              filteredCourses.map((course) => {
                const registrationStatus = registrationByCourseId[course.id];
                const isDisabled = registrationStatus === "Pending" || registrationStatus === "Approved";
                const buttonText =
                  registrationStatus === "Approved"
                    ? "Approved"
                    : registrationStatus === "Pending"
                      ? "Pending approval"
                      : "Request seat";

                return (
                  <article key={course.id} className="course-showcase-card">
                    <div className="course-header-row">
                      <div>
                        <div className="tag-row">
                          <span className="chip chip-core">{course.courseCode}</span>
                          <span className="chip">{course.department}</span>
                          <span className="chip">{course.credits} credits</span>
                          <span className="chip">{course.semester}</span>
                        </div>
                        <h3>{course.courseName}</h3>
                      </div>
                      <span className={`status-pill ${course.availableSeats <= 5 ? "warning" : "success"}`}>
                        {course.availableSeats} seats open
                      </span>
                    </div>

                    <p className="course-description">{course.description}</p>

                    <div className="course-meta-grid">
                      <p>
                        <BookOpen size={14} /> {course.day} · {course.timeSlot}
                      </p>
                      <p>
                        <CalendarRange size={14} /> {course.mode} · {course.room}
                      </p>
                      <p>
                        <Users size={14} /> Capacity {course.capacity} · Enrolled {course.enrolledCount}
                      </p>
                      <p>
                        <UserCircle2 size={14} /> {course.faculty}
                      </p>
                    </div>

                    <div className="faculty-snippet">
                      <strong>Faculty profile</strong>
                      <p>{course.facultyProfile}</p>
                    </div>

                    <div className="course-footer-row course-footer-stacked">
                      <div className="subtle-stack">
                        <span>Prerequisites: {course.prerequisites}</span>
                        {registrationStatus === "Rejected" ? (
                          <span>Your previous request was rejected. You can submit again.</span>
                        ) : null}
                      </div>

                      <button
                        onClick={() => handleEnroll(course.id)}
                        disabled={isDisabled}
                        className={isDisabled ? "btn-muted" : "btn-primary"}
                      >
                        {buttonText}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
