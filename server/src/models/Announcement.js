import { ObjectId } from "mongodb";

/**
 * Document shapes for the `announcements` collection (native driver, no schemas).
 * @module models/Announcement
 */

export const COLLECTION = "announcements";
export const AUDIENCE_TYPES = Object.freeze(["all", "grades", "classes"]);

/**
 * @typedef {Object} Audience
 * @property {'all'|'grades'|'classes'} type
 * @property {string[]} [grades]
 * @property {string[]} [classIds]
 *
 * @typedef {Object} AnnouncementDoc
 * @property {import("mongodb").ObjectId} [_id]
 * @property {string} authorUserId
 * @property {'admin'|'teacher'} authorRole
 * @property {string} authorName
 * @property {string} title
 * @property {string} body
 * @property {Audience} audience
 * @property {Date} createdAt
 */

/**
 * Extracts grade prefix from a class name (e.g. "י'2" -> "י", "י1" -> "י", "יא'3" -> "יא").
 * Grade = the class name prefix before the apostrophe.
 * @param {string} className
 * @returns {string}
 */
export function extractGrade(className) {
  if (!className || typeof className !== "string") return "";
  const parts = className.split(/['’]/);
  return parts[0].trim();
}

/**
 * @param {{ authorUserId: string, authorRole: 'admin'|'teacher', authorName: string, title: string, body: string, audience: Audience }} param0
 * @returns {AnnouncementDoc}
 */
export function buildAnnouncementDoc({ authorUserId, authorRole, authorName, title, body, audience }) {
  return {
    _id: new ObjectId(),
    authorUserId,
    authorRole,
    authorName,
    title: title.trim(),
    body: body.trim(),
    audience: {
      type: audience.type,
      grades: Array.isArray(audience.grades) ? audience.grades : [],
      classIds: Array.isArray(audience.classIds) ? audience.classIds.map(String) : [],
    },
    createdAt: new Date(),
  };
}