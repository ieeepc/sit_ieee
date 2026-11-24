import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// Fail closed in production: a missing secret would make member/admin cookies forgeable.
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev-secret-change-me");
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production.");
}

export const MEMBER_COOKIE = "sit_member_token";
export const ADMIN_COOKIE = "sit_admin_token";

export type MemberTokenPayload = {
  id: string;
  usn: string;
  isAdmin: boolean;
};

export function signMemberToken(payload: MemberTokenPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyMemberToken(token: string): MemberTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as MemberTokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentMember(): Promise<MemberTokenPayload | null> {
  const store = await cookies();
  const token = store.get(MEMBER_COOKIE)?.value;
  if (!token) return null;
  return verifyMemberToken(token);
}

export function signAdminToken() {
  return jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAdminToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role?: string };
    return decoded.role === "admin";
  } catch {
    return false;
  }
}

export async function isAdminRequest(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}

export const FACULTY_COOKIE = "sit_faculty_token";

export type FacultyTokenPayload = {
  id: string;
  username: string;
  role: "faculty";
};

export function signFacultyToken(payload: Omit<FacultyTokenPayload, "role">) {
  return jwt.sign({ ...payload, role: "faculty" }, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyFacultyToken(token: string): FacultyTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as FacultyTokenPayload;
    return decoded.role === "faculty" ? decoded : null;
  } catch {
    return null;
  }
}

export async function getCurrentFaculty(): Promise<FacultyTokenPayload | null> {
  const store = await cookies();
  const token = store.get(FACULTY_COOKIE)?.value;
  if (!token) return null;
  return verifyFacultyToken(token);
}
