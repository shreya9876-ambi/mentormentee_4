import {
  signInServerFn,
  signUpServerFn,
  getMeServerFn,
} from "@/server/auth";
import type { SafeUser, AppRole } from "@/types/auth";
import {
  getProfileServerFn,
  updateOnboardingServerFn,
  updateProfileServerFn,
  getMentorsServerFn,
  getMentorByIdServerFn,
  getRequestsServerFn,
  createRequestServerFn,
  updateRequestStatusServerFn,
  getMentorSlotsServerFn,
  createSlotServerFn,
  deleteSlotServerFn,
  getSessionsServerFn,
  bookSessionServerFn,
  updateSessionStatusServerFn,
  getConversationsServerFn,
  getMessagesServerFn,
  sendMessageServerFn,
  getFeedbackServerFn,
  submitFeedbackServerFn,
  getDashboardStatsServerFn,
  getAdminDataServerFn,
  approveMentorServerFn,
  adminUpdateMentorDetailsServerFn,
  adminCreateAlumniServerFn,
  adminCreateStudentServerFn,
} from "@/server/api";

const TOKEN_KEY = "uni_mentor_auth_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export type { SafeUser, AppRole };
export type RequestStatus = "pending" | "accepted" | "rejected" | "cancelled";
export type SessionStatus = "pending" | "confirmed" | "completed" | "cancelled";

export const api = {
  auth: {
    async signIn(email: string, password: string) {
      const res = await signInServerFn({ data: { email, password } });
      if (res.token) setStoredToken(res.token);
      return res;
    },
    async signUp(params: { email: string; password: string; fullName: string; role: AppRole }) {
      const res = await signUpServerFn({ data: params });
      if (res.token) setStoredToken(res.token);
      return res;
    },
    async getMe() {
      const token = getStoredToken();
      if (!token) return { user: null };
      try {
        const res = await getMeServerFn({ data: { token } });
        return res;
      } catch {
        removeStoredToken();
        return { user: null };
      }
    },
    signOut() {
      removeStoredToken();
    },
  },

  profile: {
    async getProfile(userId?: string) {
      const token = getStoredToken() || undefined;
      return await getProfileServerFn({ data: { userId, token } });
    },
    async updateOnboarding(params: {
      fullName: string;
      avatarUrl?: string;
      role: AppRole;
      studentData?: {
        department?: string;
        academicYear?: string;
        careerGoals?: string;
        interests?: string[];
        skills?: string[];
        linkedinUrl?: string;
        resumeUrl?: string;
      };
      mentorData?: {
        graduationYear?: number;
        company?: string;
        designation?: string;
        experienceYears?: number;
        bio?: string;
        linkedinUrl?: string;
        expertise?: string[];
        department?: string;
      };
    }) {
      const token = getStoredToken();
      if (!token) throw new Error("Unauthorized");
      return await updateOnboardingServerFn({ data: { ...params, token } });
    },
    async updateProfile(params: {
      fullName?: string;
      avatarUrl?: string;
      studentData?: Record<string, unknown>;
      mentorData?: Record<string, unknown>;
    }) {
      const token = getStoredToken();
      if (!token) throw new Error("Unauthorized");
      return await updateProfileServerFn({ data: { ...params, token } });
    },
  },

  mentors: {
    async list(filters?: { search?: string; company?: string; graduationYear?: number; department?: string; skill?: string; approvedOnly?: boolean }) {
      return await getMentorsServerFn({ data: filters || {} });
    },
    async getById(mentorId: string) {
      return await getMentorByIdServerFn({ data: { mentorId } });
    },
  },

  requests: {
    async list() {
      const token = getStoredToken();
      if (!token) return [];
      return await getRequestsServerFn({ data: { token } });
    },
    async create(mentorId: string, message?: string) {
      const token = getStoredToken();
      if (!token) throw new Error("Unauthorized");
      return await createRequestServerFn({ data: { token, mentorId, message } });
    },
    async updateStatus(requestId: string, status: RequestStatus) {
      const token = getStoredToken();
      if (!token) throw new Error("Unauthorized");
      return await updateRequestStatusServerFn({ data: { token, requestId, status } });
    },
  },

  slots: {
    async list() {
      const token = getStoredToken();
      if (!token) return [];
      return await getMentorSlotsServerFn({ data: { token } });
    },
    async create(startTime: string, endTime: string) {
      const token = getStoredToken();
      if (!token) throw new Error("Unauthorized");
      return await createSlotServerFn({ data: { token, startTime, endTime } });
    },
    async delete(slotId: string) {
      const token = getStoredToken();
      if (!token) throw new Error("Unauthorized");
      return await deleteSlotServerFn({ data: { token, slotId } });
    },
  },

  sessions: {
    async list() {
      const token = getStoredToken();
      if (!token) return [];
      return await getSessionsServerFn({ data: { token } });
    },
    async book(params: { mentorId: string; slotId?: string; scheduledAt: string; topic?: string; meetingUrl?: string }) {
      const token = getStoredToken();
      if (!token) throw new Error("Unauthorized");
      return await bookSessionServerFn({ data: { ...params, token } });
    },
    async updateStatus(sessionId: string, status?: SessionStatus, meetingUrl?: string) {
      const token = getStoredToken();
      if (!token) throw new Error("Unauthorized");
      return await updateSessionStatusServerFn({ data: { token, sessionId, status, meetingUrl } });
    },
  },

  messages: {
    async getConversations() {
      const token = getStoredToken();
      if (!token) return [];
      return await getConversationsServerFn({ data: { token } });
    },
    async getMessages(otherUserId: string) {
      const token = getStoredToken();
      if (!token) return { otherUser: null, messages: [] };
      return await getMessagesServerFn({ data: { token, otherUserId } });
    },
    async send(receiverId: string, content: string) {
      const token = getStoredToken();
      if (!token) throw new Error("Unauthorized");
      return await sendMessageServerFn({ data: { token, receiverId, content } });
    },
  },

  feedback: {
    async getFeedback() {
      const token = getStoredToken();
      if (!token) return { sessions: [], feedback: [] };
      return await getFeedbackServerFn({ data: { token } });
    },
    async submit(params: { sessionId: string; rating: number; review?: string }) {
      const token = getStoredToken();
      if (!token) throw new Error("Unauthorized");
      return await submitFeedbackServerFn({ data: { ...params, token } });
    },
  },

  dashboard: {
    async getStats() {
      const token = getStoredToken();
      if (!token) return null;
      return await getDashboardStatsServerFn({ data: { token } });
    },
  },

  admin: {
    async getData() {
      const token = getStoredToken();
      if (!token) throw new Error("Unauthorized");
      return await getAdminDataServerFn({ data: { token } });
    },
    async approveMentor(mentorUserId: string, approved: boolean) {
      const token = getStoredToken();
      if (!token) throw new Error("Unauthorized");
      return await approveMentorServerFn({ data: { token, mentorUserId, approved } });
    },
    async updateMentorDetails(params: {
      mentorUserId: string;
      graduationYear?: number;
      company?: string;
      designation?: string;
      department?: string;
    }) {
      const token = getStoredToken();
      if (!token) throw new Error("Unauthorized");
      return await adminUpdateMentorDetailsServerFn({ data: { ...params, token } });
    },
    async createAlumni(params: {
      fullName: string;
      email: string;
      password?: string;
      company: string;
      designation?: string;
      graduationYear?: number;
      department?: string;
      experienceYears?: number;
      bio?: string;
      expertise?: string[];
      approved?: boolean;
    }) {
      const token = getStoredToken();
      if (!token) throw new Error("Unauthorized");
      return await adminCreateAlumniServerFn({ data: { ...params, token } });
    },
    async createStudent(params: {
      fullName: string;
      email: string;
      password?: string;
      department?: string;
      academicYear?: string;
      careerGoals?: string;
      skills?: string[];
    }) {
      const token = getStoredToken();
      if (!token) throw new Error("Unauthorized");
      return await adminCreateStudentServerFn({ data: { ...params, token } });
    },
  },
};
