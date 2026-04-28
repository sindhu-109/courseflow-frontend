import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import UserLayout from "../../layout/UserLayout";
import CourseCatalogCard from "../../components/CourseCatalogCard";
import CourseCatalogFilters from "../../components/CourseCatalogFilters";
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

        <CourseCatalogFilters
          filterOptions={filterOptions}
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearchChange={setSearchText}
          searchText={searchText}
        />

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
              filteredCourses.map((course) => (
                <CourseCatalogCard
                  key={course.id}
                  course={course}
                  onEnroll={handleEnroll}
                  registrationStatus={registrationByCourseId[course.id]}
                />
              ))
            )}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
