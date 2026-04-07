import { parseCourseTimeRange } from "../utils/schedule";

export const normalizeUser = (user = {}) => ({
  id: Number(user.id ?? user.userId ?? 0),
  name: String(user.name ?? user.fullName ?? "").trim(),
  email: String(user.email ?? "").trim().toLowerCase(),
  role: String(user.role ?? "student").trim().toLowerCase(),
  status: String(user.status ?? "Approved").trim(),
  joinedAt: user.joinedAt ?? user.createdAt ?? "",
  lastActiveAt: user.lastActiveAt ?? user.updatedAt ?? "",
});

export const normalizeCourse = (course = {}) => {
  const normalized = {
    id: Number(course.id ?? course.courseId ?? 0),
    courseName: String(course.courseName ?? course.name ?? "").trim(),
    courseCode: String(course.courseCode ?? course.code ?? "").trim().toUpperCase(),
    faculty: String(course.faculty ?? "").trim(),
    facultyProfile: String(course.facultyProfile ?? "Faculty profile coming soon.").trim(),
    time: String(course.time ?? "").trim(),
    credits: Number(course.credits ?? 0),
    capacity: Number(course.capacity ?? 0),
    department: String(course.department ?? "").trim(),
    semester: String(course.semester ?? "").trim(),
    mode: String(course.mode ?? "In Person").trim(),
    room: String(course.room ?? "").trim(),
    prerequisites: String(course.prerequisites ?? "None").trim(),
    description: String(course.description ?? "").trim(),
    enrolledCount: Number(course.enrolledCount ?? course.enrolled ?? 0),
    availableSeats: Number(course.availableSeats ?? NaN),
  };

  const schedule = parseCourseTimeRange(normalized.time);

  return {
    ...normalized,
    availableSeats: Number.isFinite(normalized.availableSeats)
      ? normalized.availableSeats
      : Math.max(0, normalized.capacity - normalized.enrolledCount),
    day: schedule?.dayLabel || "TBA",
    dayKey: schedule?.dayKey || "",
    timeSlot: schedule?.timeSlot || normalized.time,
  };
};

export const normalizeRegistration = (registration = {}) => {
  const user = normalizeUser(registration.user ?? registration.student ?? {});
  const course = normalizeCourse(registration.course ?? {});

  return {
    id: Number(registration.id ?? registration.registrationId ?? 0),
    userId: Number(registration.userId ?? user.id ?? 0),
    userEmail: String(registration.userEmail ?? user.email ?? "").trim().toLowerCase(),
    status: String(registration.status ?? "Pending").trim(),
    createdAt: registration.createdAt ?? "",
    updatedAt: registration.updatedAt ?? "",
    decisionAt: registration.decisionAt ?? "",
    decisionNote: String(registration.decisionNote ?? "").trim(),
    rejectionReason: String(registration.rejectionReason ?? "").trim(),
    user,
    course,
    courseId: Number(registration.courseId ?? course.id ?? 0),
    student: user.name,
    studentEmail: user.email,
    studentStatus: user.status,
    studentJoinedAt: user.joinedAt,
    studentLastActiveAt: user.lastActiveAt,
    courseName: course.courseName,
    courseCode: course.courseCode,
    courseFaculty: course.faculty,
    courseFacultyProfile: course.facultyProfile,
    courseTime: course.time,
    courseCredits: course.credits,
    courseCapacity: course.capacity,
    courseEnrolledCount: course.enrolledCount,
    courseAvailableSeats: course.availableSeats,
    courseDepartment: course.department,
    courseSemester: course.semester,
    courseMode: course.mode,
    courseRoom: course.room,
    courseDescription: course.description,
    coursePrerequisites: course.prerequisites,
    courseDay: course.day,
    courseDayKey: course.dayKey,
    courseTimeSlot: course.timeSlot,
  };
};
