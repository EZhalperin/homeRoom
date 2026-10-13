import * as studentRepository from "../repositories/studentRepository.js";
import * as classRepository from "../repositories/classRepository.js";
import * as userRepository from "../repositories/userRepository.js";
import * as analyticsMath from "./analyticsMath.js";
import { weightedAverage } from "./gradeService.js";
import { RISK_CONFIG } from "../config/risk.config.js";
import { AppError } from "../utils/AppError.js";

/**
 * Analytics orchestration service. Role-scoped; enforce privacy thresholds.
 * @module services/analyticsService
 */

/**
 * Parent analytics: metrics for the parent's child.
 * Class average for a subject is ONLY included if >= 5 students in the class have grades in that subject.
 * Risk is exposed ONLY as a categorical level (no numeric index).
 *
 * @param {string} parentUserId
 * @param {number} [months=6]
 */
export async function getMyChildAnalytics(parentUserId, months = 6) {
  const found = await studentRepository.findActiveStudentByStudentId(parentUserId);
  if (!found) {
    throw new AppError("Student not found", 404);
  }

  const { student, classId } = found;
  const grades = Array.isArray(student.grades) ? student.grades : [];
  const attendance = Array.isArray(student.attendance) ? student.attendance : [];

  const overallAverage = analyticsMath.calculateOverallAverage(grades);

  const riskIdx = student.academicRiskIndex ?? 0;
  let riskLevel = "ok";
  if (riskIdx >= RISK_CONFIG.ALERT_THRESHOLD) {
    riskLevel = "alert";
  } else if (riskIdx >= RISK_CONFIG.WARNING_THRESHOLD) {
    riskLevel = "warning";
  }

  const absences = attendance.filter((a) => a.type === "absence").length;
  const lates = attendance.filter((a) => a.type === "late").length;
  const totals = {
    grades: grades.length,
    absences,
    lates,
  };

  // Compute subject averages with 5-student privacy threshold
  const childSubMap = weightedAverage(grades) || {};
  const childSubjects = Object.keys(childSubMap);

  // Fetch classmates' grades in ONE query
  const classmates = await classRepository.findStudentsByClassId(classId);
  const classStudentsList = Array.isArray(classmates) ? classmates : [];

  const subjectAverages = childSubjects.map((sub) => {
    const childAvg = Math.round(childSubMap[sub] * 10) / 10;

    // Check how many students in the class have grades in this subject
    const qualifyingStudentAverages = [];
    for (const st of classStudentsList) {
      const stSubMap = weightedAverage(st.grades || []);
      if (stSubMap && Number.isFinite(stSubMap[sub])) {
        qualifyingStudentAverages.push(stSubMap[sub]);
      }
    }

    // Privacy threshold: only show classAverage if >= 5 students have grades in that subject
    let classAverage = null;
    if (qualifyingStudentAverages.length >= 5) {
      const sum = qualifyingStudentAverages.reduce((acc, v) => acc + v, 0);
      classAverage = Math.round((sum / qualifyingStudentAverages.length) * 10) / 10;
    }

    return {
      subject: sub,
      average: childAvg,
      classAverage,
    };
  });

  const gradesTrend = analyticsMath.monthlyTrend(grades, months);
  const attendanceByMonth = analyticsMath.attendanceByMonth(attendance, months);

  return {
    overallAverage,
    riskLevel,
    totals,
    subjectAverages,
    gradesTrend,
    attendanceByMonth,
  };
}

/**
 * Teacher analytics for their active homeroom class.
 * Throws 404 if no active class.
 *
 * @param {string} teacherUserId
 * @param {number} [months=6]
 */
export async function getMyClassAnalytics(teacherUserId, months = 6) {
  const cls = await classRepository.findActiveByTeacherId(teacherUserId);
  if (!cls) {
    throw new AppError("No active class found", 404);
  }

  const students = Array.isArray(cls.students) ? cls.students : [];
  const studentsCount = students.length;

  const studentAverages = [];
  const allGrades = [];
  const allAttendance = [];
  const subjectAveragesAccumulator = new Map();

  for (const s of students) {
    const sGrades = s.grades || [];
    const sAttendance = s.attendance || [];
    allGrades.push(...sGrades);
    allAttendance.push(...sAttendance);

    const sOverall = analyticsMath.calculateOverallAverage(sGrades);
    if (sOverall !== null) {
      studentAverages.push(sOverall);
    }

    const sSubMap = weightedAverage(sGrades) || {};
    for (const [sub, avg] of Object.entries(sSubMap)) {
      const list = subjectAveragesAccumulator.get(sub) || [];
      list.push(avg);
      subjectAveragesAccumulator.set(sub, list);
    }
  }

  // Class overall average
  const classAverage =
    studentAverages.length > 0
      ? Math.round((studentAverages.reduce((sum, v) => sum + v, 0) / studentAverages.length) * 10) / 10
      : null;

  // Class per-subject averages
  const subjectAverages = Array.from(subjectAveragesAccumulator.entries()).map(([subject, list]) => ({
    subject,
    average: Math.round((list.reduce((sum, v) => sum + v, 0) / list.length) * 10) / 10,
  }));

  const gradeDistribution = analyticsMath.gradeDistribution(studentAverages);
  const riskDistribution = analyticsMath.riskDistribution(students);

  // Top 5 at/above WARNING_THRESHOLD
  const atRisk = students
    .filter((s) => (s.academicRiskIndex ?? 0) >= RISK_CONFIG.WARNING_THRESHOLD)
    .sort((a, b) => (b.academicRiskIndex ?? 0) - (a.academicRiskIndex ?? 0))
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`.trim(),
      riskIndex: s.academicRiskIndex ?? 0,
    }));

  const gradesTrend = analyticsMath.monthlyTrend(allGrades, months);
  const attendanceByMonth = analyticsMath.attendanceByMonth(allAttendance, months);

  return {
    studentsCount,
    classAverage,
    subjectAverages,
    gradeDistribution,
    riskDistribution,
    atRisk,
    attendanceByMonth,
    gradesTrend,
  };
}

/**
 * Admin school-wide analytics.
 * User counts queried via count queries (no row fetching).
 *
 * @param {number} [months=6]
 */
export async function getSchoolAnalytics(months = 6) {
  // 1. User stats via exact count queries in Supabase
  const users = await userRepository.countUserStats();

  // 2. Active classes from MongoDB
  const classes = await classRepository.listActiveClasses();

  // 3. Batched teacher name resolution
  const teacherIds = Array.from(new Set(classes.map((c) => c.teacherId).filter(Boolean)));
  const teachers = await userRepository.findManyByUserIds(teacherIds);
  const teacherMap = new Map(
    teachers.map((t) => [t.userId, `${t.firstName || ""} ${t.lastName || ""}`.trim()]),
  );

  let totalStudents = 0;
  const schoolStudents = [];
  const schoolGrades = [];
  const schoolAttendance = [];
  const schoolStudentAverages = [];

  const classesSummary = classes.map((c) => {
    const cStudents = Array.isArray(c.students) ? c.students : [];
    const count = cStudents.length;
    totalStudents += count;

    let cAbsences = 0;
    const cAverages = [];

    for (const st of cStudents) {
      schoolStudents.push(st);
      const stGrades = st.grades || [];
      const stAttendance = st.attendance || [];
      schoolGrades.push(...stGrades);
      schoolAttendance.push(...stAttendance);

      cAbsences += stAttendance.filter((a) => a.type === "absence").length;

      const stAvg = analyticsMath.calculateOverallAverage(stGrades);
      if (stAvg !== null) {
        cAverages.push(stAvg);
        schoolStudentAverages.push(stAvg);
      }
    }

    const avg =
      cAverages.length > 0
        ? Math.round((cAverages.reduce((sum, v) => sum + v, 0) / cAverages.length) * 10) / 10
        : null;

    const absencesPerStudent = count > 0 ? Math.round((cAbsences / count) * 10) / 10 : 0;
    const classRisk = analyticsMath.riskDistribution(cStudents);

    return {
      classId: String(c._id),
      className: c.className,
      teacherName: teacherMap.get(c.teacherId) || null,
      studentsCount: count,
      average: avg,
      absencesPerStudent,
      riskDistribution: classRisk,
    };
  });

  const riskDistribution = analyticsMath.riskDistribution(schoolStudents);
  const gradeDistribution = analyticsMath.gradeDistribution(schoolStudentAverages);
  const attendanceByMonth = analyticsMath.attendanceByMonth(schoolAttendance, months);
  const gradesTrend = analyticsMath.monthlyTrend(schoolGrades, months);

  return {
    totals: {
      users,
      classes: classes.length,
      students: totalStudents,
    },
    riskDistribution,
    gradeDistribution,
    attendanceByMonth,
    gradesTrend,
    classes: classesSummary,
  };
}