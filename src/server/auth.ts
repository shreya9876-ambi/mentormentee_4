import { createServerFn } from "@tanstack/react-start";
import { connectToDatabase } from "./db/connection";
import {
  UserModel,
  StudentProfileModel,
  MentorProfileModel,
} from "./db/models";
import {
  signToken,
  verifyToken,
  hashPassword,
  comparePassword,
} from "./auth-helpers";
import { sendWelcomeCredentialsEmail } from "./email";
import type { SafeUser, AppRole } from "@/types/auth";

export const signUpServerFn = createServerFn({ method: "POST" })
  .validator((data: { email: string; password: string; fullName: string; role: AppRole }) => data)
  .handler(async ({ data }) => {
    await connectToDatabase();
    const { email, password, fullName, role } = data;

    if (role === "student") {
      throw new Error(
        "Student accounts are created exclusively by the Placement Cell Admin. Please use the credentials sent to your email by the admin."
      );
    }

    if (role === "admin") {
      throw new Error("Admin accounts cannot be registered publicly.");
    }

    const existing = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      throw new Error("A user with this email already exists");
    }

    const passwordHash = await hashPassword(password);
    const user = await UserModel.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      fullName: fullName.trim(),
      role: role || "student",
      avatarUrl: "",
    });

    const userId = user._id.toString();

    await MentorProfileModel.create({ userId, approved: false });

    // Dispatch welcome email in background
    sendWelcomeCredentialsEmail({
      to: user.email,
      fullName: user.fullName,
      role: user.role as any,
      rawPassword: password,
    }).catch((e) => console.error("[Auth] Welcome email failed:", e));

    const safeUser: SafeUser = {
      id: userId,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };

    const token = signToken({ id: userId, email: user.email, role: user.role });

    return { user: safeUser, token };
  });

export const signInServerFn = createServerFn({ method: "POST" })
  .validator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    await connectToDatabase();
    const { email, password } = data;

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const match = await comparePassword(password, user.passwordHash);
    if (!match) {
      throw new Error("Invalid email or password");
    }

    const userId = user._id.toString();

    const safeUser: SafeUser = {
      id: userId,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };

    const token = signToken({ id: userId, email: user.email, role: user.role });

    return { user: safeUser, token };
  });

export const getMeServerFn = createServerFn({ method: "POST" })
  .validator((data: { token?: string }) => data)
  .handler(async ({ data }) => {
    if (!data.token) {
      return { user: null };
    }

    const payload = verifyToken(data.token);
    if (!payload?.sub) {
      return { user: null };
    }

    await connectToDatabase();
    const user = await UserModel.findById(payload.sub);
    if (!user) {
      return { user: null };
    }

    const safeUser: SafeUser = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };

    return { user: safeUser };
  });
