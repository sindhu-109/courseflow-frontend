const DAY_LABEL_BY_KEY = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const DAY_KEY_BY_INPUT = {
  mon: "mon",
  monday: "mon",
  tue: "tue",
  tues: "tue",
  tuesday: "tue",
  wed: "wed",
  wednesday: "wed",
  thu: "thu",
  thur: "thu",
  thurs: "thu",
  thursday: "thu",
  fri: "fri",
  friday: "fri",
  sat: "sat",
  saturday: "sat",
  sun: "sun",
  sunday: "sun",
};

const parseClockTimeToMinutes = (timeText) => {
  const match = String(timeText || "")
    .trim()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2] || "0");

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    return null;
  }

  const meridiemOffset = match[3].toUpperCase() === "PM" ? 12 : 0;
  return (hours % 12 + meridiemOffset) * 60 + minutes;
};

const formatMinutesAsClock = (minutes) => {
  const hour24 = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  const meridiem = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${meridiem}`;
};

export const parseCourseTimeRange = (courseTime) => {
  const match = String(courseTime || "")
    .trim()
    .match(/^([A-Za-z]+)\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM))$/i);

  if (!match) {
    return null;
  }

  const dayKey = DAY_KEY_BY_INPUT[match[1].toLowerCase()];
  const startMinutes = parseClockTimeToMinutes(match[2]);
  const endMinutes = parseClockTimeToMinutes(match[3]);

  if (!dayKey || startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return null;
  }

  return {
    dayKey,
    dayLabel: DAY_LABEL_BY_KEY[dayKey],
    startMinutes,
    endMinutes,
    startLabel: formatMinutesAsClock(startMinutes),
    endLabel: formatMinutesAsClock(endMinutes),
    timeSlot: `${formatMinutesAsClock(startMinutes)} - ${formatMinutesAsClock(endMinutes)}`,
  };
};

const getConflictSeverity = (overlapMinutes) => {
  if (overlapMinutes >= 45) {
    return "High";
  }
  if (overlapMinutes >= 20) {
    return "Medium";
  }
  return "Low";
};

export const getScheduleConflicts = (registrations = []) => {
  const approvedRegistrations = registrations.filter(
    (registration) => registration.status === "Approved"
  );
  const conflicts = [];

  for (let firstIndex = 0; firstIndex < approvedRegistrations.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < approvedRegistrations.length; secondIndex += 1) {
      const firstRegistration = approvedRegistrations[firstIndex];
      const secondRegistration = approvedRegistrations[secondIndex];

      if (firstRegistration.userEmail !== secondRegistration.userEmail) {
        continue;
      }

      const firstTime = parseCourseTimeRange(firstRegistration.courseTime);
      const secondTime = parseCourseTimeRange(secondRegistration.courseTime);

      if (!firstTime || !secondTime || firstTime.dayKey !== secondTime.dayKey) {
        continue;
      }

      const overlapStart = Math.max(firstTime.startMinutes, secondTime.startMinutes);
      const overlapEnd = Math.min(firstTime.endMinutes, secondTime.endMinutes);

      if (overlapStart >= overlapEnd) {
        continue;
      }

      const overlapMinutes = overlapEnd - overlapStart;
      const severity = getConflictSeverity(overlapMinutes);

      conflicts.push({
        id: `${firstRegistration.userEmail}-${firstRegistration.courseId}-${secondRegistration.courseId}`,
        student: firstRegistration.student || firstRegistration.user?.name || firstRegistration.userEmail,
        studentEmail: firstRegistration.userEmail,
        impactedStudentsCount: 1,
        courseIds: [firstRegistration.courseId, secondRegistration.courseId],
        courseNames: [firstRegistration.courseName, secondRegistration.courseName],
        courseCodes: [firstRegistration.courseCode, secondRegistration.courseCode],
        severity,
        overlapMinutes,
        dayLabel: firstTime.dayLabel,
        message: `${firstRegistration.courseName} overlaps with ${secondRegistration.courseName}.`,
        timeAlert: `${firstTime.dayLabel}, ${formatMinutesAsClock(overlapStart)} - ${formatMinutesAsClock(overlapEnd)} overlap`,
        replacementSuggestions: [
          `Consider moving ${firstRegistration.courseCode} to a later ${firstTime.dayLabel} section.`,
          `Review an alternative slot for ${secondRegistration.courseCode} to remove the clash.`,
        ],
      });
    }
  }

  return conflicts;
};
