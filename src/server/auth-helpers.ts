import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import type { AppRole } from "@/types/auth";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "uni_mentor_connect_super_secret_jwt_key_2026_change_in_production";

export function signToken(user: { id: string; email: string; role: AppRole }): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): { sub: string; email: string; role: AppRole } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string; email: string; role: AppRole };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
