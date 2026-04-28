import { BookOpen, CalendarRange, UserCircle2, Users } from "lucide-react";

const getButtonState = (registrationStatus) => {
  if (registrationStatus === "Approved") {
    return { disabled: true, label: "Approved" };
  }

  if (registrationStatus === "Pending") {
    return { disabled: true, label: "Pending approval" };
  }

  return { disabled: false, label: "Request seat" };
};

export default function CourseCatalogCard({ course, onEnroll, registrationStatus }) {
  const buttonState = getButtonState(registrationStatus);

  return (
    <article className="course-showcase-card">
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
        <span
          className={`status-pill ${course.availableSeats <= 5 ? "warning" : "success"}`}
        >
          {course.availableSeats} seats open
        </span>
      </div>

      <p className="course-description">{course.description}</p>

      <div className="course-meta-grid">
        <p>
          <BookOpen size={14} /> {course.day} | {course.timeSlot}
        </p>
        <p>
          <CalendarRange size={14} /> {course.mode} | {course.room}
        </p>
        <p>
          <Users size={14} /> Capacity {course.capacity} | Enrolled {course.enrolledCount}
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
          onClick={() => onEnroll(course.id)}
          disabled={buttonState.disabled}
          className={buttonState.disabled ? "btn-muted" : "btn-primary"}
        >
          {buttonState.label}
        </button>
      </div>
    </article>
  );
}
