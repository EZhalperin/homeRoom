import * as userRepository from "../repositories/userRepository.js";
import * as announcementRepository from "../repositories/announcementRepository.js";
import * as classRepository from "../repositories/classRepository.js";
import * as studentRepository from "../repositories/studentRepository.js";
import * as notificationService from "./notificationService.js";
import { buildAnnouncementDoc, extractGrade } from "../models/Announcement.js";
import { emitToUser } from "../sockets/realtime.js";
import { toObjectId } from "../utils/mongoHelpers.js";
import { AppError } from "../utils/AppError.js";

/** @module services/announcementService */

/**
 * Creates an announcement with role-based authoring and fan-out notifications.
 * @param {object} user - Authenticated user from verified JWT
 * @param {{ title: string, body: string, audience?: object }} payload
 * @returns {Promise<import("../models/Announcement.js").AnnouncementDoc>}
 */
export async function createAnnouncement(user, payload) {
  const authorUserId = user.userId;
  const authorRole = user.role;
  const authorName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.userId;
  const { title, body } = payload;

  let resolvedAudience;
  let targetedClasses = [];
  let recipientUserIds = [];

  if (authorRole === "teacher") {
    // Teachers cannot send an audience; it is strictly computed server-side
    if (payload.audience !== undefined) {
      throw new AppError("Teachers cannot specify an audience", 400);
    }
    const activeClass = await classRepository.findActiveByTeacherId(authorUserId);
    if (!activeClass) {
      throw new AppError("Teacher has no active class", 404);
    }

    resolvedAudience = {
      type: "classes",
      grades: [],
      classIds: [String(activeClass._id)],
    };

    targetedClasses = [activeClass];

    // A teacher's announcement targets only the parents of their class; author is never notified
    recipientUserIds = (activeClass.students || [])
      .map((s) => s.studentId)
      .filter((id) => Boolean(id) && id !== authorUserId);
  } else if (authorRole === "admin") {
    if (!payload.audience || !payload.audience.type) {
      throw new AppError("Audience is required for admin announcements", 400);
    }

    const { type, grades = [], classIds = [] } = payload.audience;

    if (type === "all") {
      resolvedAudience = { type: "all", grades: [], classIds: [] };
      targetedClasses = await classRepository.listActiveClasses();
    } else if (type === "grades") {
      if (!Array.isArray(grades) || grades.length === 0) {
        throw new AppError("Grades list cannot be empty", 400);
      }
      resolvedAudience = { type: "grades", grades, classIds: [] };
      const allClasses = await classRepository.listActiveClasses();
      targetedClasses = allClasses.filter((c) => grades.includes(extractGrade(c.className)));
    } else if (type === "classes") {
      if (!Array.isArray(classIds) || classIds.length === 0) {
        throw new AppError("Class IDs list cannot be empty", 400);
      }

      // Validate each class is an active class
      for (const cid of classIds) {
        const cls = await classRepository.findById(cid);
        if (!cls || !cls.isActive) {
          throw new AppError(`Class ${cid} not found or inactive`, 400);
        }
      }

      const objectIds = classIds.map((cid) => toObjectId(cid, "class id"));
      resolvedAudience = { type: "classes", grades: [], classIds: classIds.map(String) };
      targetedClasses = await classRepository.listActiveClasses({ _id: { $in: objectIds } });
    } else {
      throw new AppError("Invalid audience type", 400);
    }

    // Admin announcement targets teachers and parents of targeted active classes
    const recipientSet = new Set();
    for (const cls of targetedClasses) {
      if (cls.teacherId && cls.teacherId !== authorUserId) {
        recipientSet.add(cls.teacherId);
      }
      for (const s of cls.students || []) {
        if (s.studentId && s.studentId !== authorUserId) {
          recipientSet.add(s.studentId);
        }
      }
    }
    recipientUserIds = Array.from(recipientSet);
  } else {
    throw new AppError("Forbidden", 403);
  }

  const doc = buildAnnouncementDoc({
    authorUserId,
    authorRole,
    authorName,
    title,
    body,
    audience: resolvedAudience,
  });

  await announcementRepository.create(doc);

  // Fan-out notifications with insertMany (no await in loops)
  if (recipientUserIds.length > 0) {
    const preview = body.length > 100 ? `${body.slice(0, 100).trim()}...` : body.trim();
    await notificationService.createMany(recipientUserIds, {
      type: "announcement",
      title: `הודעה חדשה: ${title.trim()}`,
      body: preview,
      link: "/announcements",
      data: { announcementId: String(doc._id) },
    });

    for (const uid of recipientUserIds) {
      emitToUser(uid, "announcement:new", doc);
    }
  }

  return doc;
}

/**
 * Lists announcements filtered by role permissions and audience relevance.
 * @param {object} user - Authenticated user
 * @param {{ limit?: number, before?: string|Date }} [opts]
 */
export async function listAnnouncements(user, opts = {}) {
  let filter = {};

  if (user.role === "admin") {
    // Admin sees all
    filter = {};
  } else if (user.role === "teacher") {
    // Teacher sees their authored announcements, plus announcements matching their class, grade, or 'all'
    const activeClass = await classRepository.findActiveByTeacherId(user.userId);
    if (activeClass) {
      const classIdStr = String(activeClass._id);
      const grade = extractGrade(activeClass.className);
      filter = {
        $or: [
          { authorUserId: user.userId },
          { "audience.type": "all" },
          { "audience.type": "grades", "audience.grades": grade },
          { "audience.type": "classes", "audience.classIds": classIdStr },
        ],
      };
    } else {
      filter = {
        $or: [
          { authorUserId: user.userId },
          { "audience.type": "all" },
        ],
      };
    }
  } else if (user.role === "parent") {
    // Parent sees announcements targeting their child's class, grade, or 'all'
    const found = await studentRepository.findActiveStudentByStudentId(user.userId);
    if (found) {
      const classIdStr = String(found.classId);
      const grade = extractGrade(found.className);
      filter = {
        $or: [
          { "audience.type": "all" },
          { "audience.type": "grades", "audience.grades": grade },
          { "audience.type": "classes", "audience.classIds": classIdStr },
        ],
      };
    } else {
      filter = { "audience.type": "all" };
    }
  } else {
    throw new AppError("Forbidden", 403);
  }

  return announcementRepository.list({ filter, limit: opts.limit, before: opts.before });
}

/**
 * Deletes an announcement. Admin can delete any; Teacher can only delete their own.
 * @param {string} id
 * @param {object} user
 */
export async function deleteAnnouncement(id, user) {
  const announcement = await announcementRepository.findById(id);
  if (!announcement) {
    throw new AppError("Announcement not found", 404);
  }

  if (user.role === "teacher" && announcement.authorUserId !== user.userId) {
    throw new AppError("Forbidden", 403);
  }

  if (user.role !== "admin" && user.role !== "teacher") {
    throw new AppError("Forbidden", 403);
  }

  await announcementRepository.deleteById(id);
  return { message: "Announcement deleted successfully" };
}

/**
 * Returns audience totals for parents and students.
 * @returns {Promise<{ parentsCount: number, studentsCount: number }>}
 */
export async function getAudienceStats() {
  const userStats = await userRepository.countAudienceStats();
  let studentsCount = userStats.studentsCount;
  if (studentsCount === 0) {
    const mongoCount = await classRepository.countActiveStudents();
    studentsCount = mongoCount;
  }
  return {
    parentsCount: userStats.parentsCount,
    studentsCount,
  };
}