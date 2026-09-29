import { createServerFn } from "@tanstack/react-start";
import mongoose from "mongoose";
import { connectToDatabase } from "./db/connection";
import {
  UserModel,
  StudentProfileModel,
  MentorProfileModel,
  MentorshipRequestModel,
  AvailabilitySlotModel,
  SessionModel,
  MessageModel,
  FeedbackModel,
  type RequestStatus,
  type SessionStatus,
} from "./db/models";
import { verifyToken, hashPassword } from "./auth-helpers";
import { sendWelcomeCredentialsEmail } from "./email";

function requireUser(token?: string) {
  if (!token) throw new Error("Unauthorized");
  const payload = verifyToken(token);
  if (!payload?.sub) throw new Error("Unauthorized");
  return payload;
}

function buildIdQueries(id: string) {
  const ids: any[] = [id];
  if (mongoose.isValidObjectId(id)) {
    ids.push(new mongoose.Types.ObjectId(id));
  }
  return ids;
}

// ==================== PROFILES & ONBOARDING ====================

export const getProfileServerFn = createServerFn({ method: "POST" })
  .validator((data: { userId?: string; token?: string }) => data)
  .handler(async ({ data }) => {
    await connectToDatabase();
    let targetUserId = data.userId;
    if (!targetUserId && data.token) {
      const payload = requireUser(data.token);
      targetUserId = payload.sub;
    }
    if (!targetUserId) throw new Error("User ID is required");

    const user = await UserModel.findById(targetUserId).lean();
    if (!user) return { profile: null, studentProfile: null, mentorProfile: null };

    const idQueries = buildIdQueries(targetUserId);
    const studentProfile = await StudentProfileModel.findOne({ userId: { $in: idQueries } }).lean();
    const mentorProfile = await MentorProfileModel.findOne({ userId: { $in: idQueries } }).lean();

    return {
      profile: {
        id: user._id.toString(),
        full_name: user.fullName,
        email: user.email,
        avatar_url: user.avatarUrl || "",
        role: user.role,
        created_at: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
      },
      studentProfile: studentProfile
        ? {
            id: studentProfile._id.toString(),
            userId: String(studentProfile.userId),
            department: studentProfile.department || "",
            academicYear: studentProfile.academicYear || "",
            careerGoals: studentProfile.careerGoals || "",
            interests: studentProfile.interests || [],
            skills: studentProfile.skills || [],
            linkedinUrl: studentProfile.linkedinUrl || "",
            resumeUrl: studentProfile.resumeUrl || "",
          }
        : null,
      mentorProfile: mentorProfile
        ? {
            id: mentorProfile._id.toString(),
            userId: String(mentorProfile.userId),
            graduationYear: mentorProfile.graduationYear,
            company: mentorProfile.company || "",
            designation: mentorProfile.designation || "",
            experienceYears: mentorProfile.experienceYears ?? 0,
            bio: mentorProfile.bio || "",
            linkedinUrl: mentorProfile.linkedinUrl || "",
            expertise: mentorProfile.expertise || [],
            department: mentorProfile.department || "",
            approved: mentorProfile.approved ?? true,
          }
        : null,
    };
  });

export const updateOnboardingServerFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      token: string;
      fullName: string;
      avatarUrl?: string;
      role: "student" | "mentor" | "admin";
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
    }) => data
  )
  .handler(async ({ data }) => {
    const auth = requireUser(data.token);
    await connectToDatabase();

    await UserModel.findByIdAndUpdate(auth.sub, {
      fullName: data.fullName,
      avatarUrl: data.avatarUrl || "",
      role: data.role,
    });

    const idQueries = buildIdQueries(auth.sub);

    if (data.role === "student" && data.studentData) {
      await StudentProfileModel.findOneAndUpdate(
        { userId: { $in: idQueries } },
        { ...data.studentData, userId: auth.sub },
        { upsert: true, new: true }
      );
    } else if (data.role === "mentor" && data.mentorData) {
      await MentorProfileModel.findOneAndUpdate(
        { userId: { $in: idQueries } },
        { ...data.mentorData, userId: auth.sub, approved: true },
        { upsert: true, new: true }
      );
    }

    return { success: true };
  });

export const updateProfileServerFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      token: string;
      fullName?: string;
      avatarUrl?: string;
      studentData?: Record<string, unknown>;
      mentorData?: Record<string, unknown>;
    }) => data
  )
  .handler(async ({ data }) => {
    const auth = requireUser(data.token);
    await connectToDatabase();

    const updateFields: Record<string, unknown> = {};
    if (data.fullName !== undefined) updateFields.fullName = data.fullName;
    if (data.avatarUrl !== undefined) updateFields.avatarUrl = data.avatarUrl;

    if (Object.keys(updateFields).length > 0) {
      await UserModel.findByIdAndUpdate(auth.sub, updateFields);
    }

    const idQueries = buildIdQueries(auth.sub);

    if (data.studentData) {
      await StudentProfileModel.findOneAndUpdate(
        { userId: { $in: idQueries } },
        { ...data.studentData, userId: auth.sub },
        { upsert: true, new: true }
      );
    }

    if (data.mentorData) {
      await MentorProfileModel.findOneAndUpdate(
        { userId: { $in: idQueries } },
        { ...data.mentorData, userId: auth.sub },
        { upsert: true, new: true }
      );
    }

    return { success: true };
  });

// ==================== MENTORS ====================

export const getMentorsServerFn = createServerFn({ method: "POST" })
  .validator((data: { search?: string; company?: string; graduationYear?: number; department?: string; skill?: string; approvedOnly?: boolean }) => data)
  .handler(async ({ data }) => {
    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (data.approvedOnly !== false) {
      query.approved = true;
    }
    if (data.department) {
      query.department = data.department;
    }
    if (data.company) {
      query.company = { $regex: new RegExp(data.company.trim(), "i") };
    }
    if (data.graduationYear) {
      query.graduationYear = data.graduationYear;
    }
    if (data.skill) {
      query.expertise = { $in: [data.skill] };
    }

    // Get all mentor profiles matching query
    const mentorProfiles = await MentorProfileModel.find(query).lean();
    
    // Also fetch all users with role 'mentor' to map full names and emails
    const mentorUsers = await UserModel.find({ role: "mentor" }).lean();
    const userMap = new Map(mentorUsers.map((u) => [u._id.toString(), u]));

    const profileUserMap = new Map();
    const result: any[] = [];

    for (const mp of mentorProfiles) {
      const uId = String(mp.userId);
      profileUserMap.set(uId, mp);
      const u = userMap.get(uId);
      if (!u) continue;

      result.push({
        id: uId,
        user_id: uId,
        full_name: u.fullName,
        avatar_url: u.avatarUrl,
        email: u.email,
        company: mp.company || "",
        designation: mp.designation || "Alumni Mentor",
        department: mp.department || "",
        experience_years: mp.experienceYears ?? 0,
        graduation_year: mp.graduationYear,
        bio: mp.bio || "",
        linkedin_url: mp.linkedinUrl || "",
        expertise: mp.expertise || [],
        approved: mp.approved ?? true,
      });
    }

    // If approvedOnly is false, also include any mentor user who might not have a separate MentorProfile yet
    if (data.approvedOnly === false) {
      for (const u of mentorUsers) {
        const uId = u._id.toString();
        if (!profileUserMap.has(uId)) {
          result.push({
            id: uId,
            user_id: uId,
            full_name: u.fullName,
            avatar_url: u.avatarUrl,
            email: u.email,
            company: "",
            designation: "Alumni Mentor",
            department: "",
            experience_years: 0,
            graduation_year: undefined,
            bio: "",
            linkedin_url: "",
            expertise: [],
            approved: false,
          });
        }
      }
    }

    if (data.search) {
      const q = data.search.toLowerCase().trim();
      return result.filter((m) =>
        m.full_name?.toLowerCase().includes(q) ||
        m.company?.toLowerCase().includes(q) ||
        m.designation?.toLowerCase().includes(q) ||
        m.department?.toLowerCase().includes(q) ||
        (m.graduation_year && String(m.graduation_year).includes(q)) ||
        m.expertise?.some((s: string) => s.toLowerCase().includes(q))
      );
    }

    return result;
  });

export const getMentorByIdServerFn = createServerFn({ method: "POST" })
  .validator((data: { mentorId: string }) => data)
  .handler(async ({ data }) => {
    await connectToDatabase();
    const user = await UserModel.findById(data.mentorId).lean();
    if (!user) return null;

    const idQueries = buildIdQueries(data.mentorId);
    const mentorProfile = await MentorProfileModel.findOne({ userId: { $in: idQueries } }).lean();
    const slots = await AvailabilitySlotModel.find({
      mentorId: { $in: idQueries },
      isBooked: false,
      startTime: { $gte: new Date() },
    })
      .sort({ startTime: 1 })
      .lean();

    return {
      id: data.mentorId,
      user_id: data.mentorId,
      full_name: user.fullName,
      avatar_url: user.avatarUrl,
      email: user.email,
      company: mentorProfile?.company || "",
      designation: mentorProfile?.designation || "Alumni Mentor",
      department: mentorProfile?.department || "",
      experience_years: mentorProfile?.experienceYears ?? 0,
      graduation_year: mentorProfile?.graduationYear,
      bio: mentorProfile?.bio || "",
      linkedin_url: mentorProfile?.linkedinUrl || "",
      expertise: mentorProfile?.expertise || [],
      approved: mentorProfile?.approved ?? true,
      slots: slots.map((s) => ({
        id: s._id.toString(),
        mentor_id: String(s.mentorId),
        start_time: s.startTime.toISOString(),
        end_time: s.endTime.toISOString(),
        is_booked: s.isBooked,
      })),
    };
  });

// ==================== REQUESTS ====================

export const getRequestsServerFn = createServerFn({ method: "POST" })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const auth = requireUser(data.token);
    await connectToDatabase();

    const myId = auth.sub;
    const myIdQueries = buildIdQueries(myId);

    const requests = await MentorshipRequestModel.find({
      $or: [{ menteeId: { $in: myIdQueries } }, { mentorId: { $in: myIdQueries } }],
    })
      .sort({ createdAt: -1 })
      .lean();

    const otherIds = requests.map((r) => (String(r.menteeId) === myId ? String(r.mentorId) : String(r.menteeId)));
    const users = await UserModel.find({ _id: { $in: otherIds } }).lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const studentProfiles = await StudentProfileModel.find({
      $or: [{ userId: { $in: otherIds } }, { userId: { $in: otherIds.filter(id => mongoose.isValidObjectId(id)).map(id => new mongoose.Types.ObjectId(id)) } }],
    }).lean();
    const studentMap = new Map(studentProfiles.map((s) => [String(s.userId), s]));

    const mentorProfiles = await MentorProfileModel.find({
      $or: [{ userId: { $in: otherIds } }, { userId: { $in: otherIds.filter(id => mongoose.isValidObjectId(id)).map(id => new mongoose.Types.ObjectId(id)) } }],
    }).lean();
    const mentorMap = new Map(mentorProfiles.map((m) => [String(m.userId), m]));

    return requests.map((r) => {
      const menteeIdStr = String(r.menteeId);
      const mentorIdStr = String(r.mentorId);
      const otherId = menteeIdStr === myId ? mentorIdStr : menteeIdStr;
      const otherUser = userMap.get(otherId);
      const studentP = studentMap.get(otherId);
      const mentorP = mentorMap.get(otherId);

      return {
        id: r._id.toString(),
        mentee_id: menteeIdStr,
        mentor_id: mentorIdStr,
        message: r.message,
        status: r.status,
        created_at: r.createdAt.toISOString(),
        other_user: {
          id: otherId,
          full_name: otherUser?.fullName || "Unknown",
          email: otherUser?.email || "",
          avatar_url: otherUser?.avatarUrl,
          role: otherUser?.role,
          department: studentP?.department || mentorP?.department || "",
          academic_year: studentP?.academicYear || "",
          career_goals: studentP?.careerGoals || "",
          skills: (studentP?.skills && studentP.skills.length > 0) ? studentP.skills : (mentorP?.expertise || []),
          company: mentorP?.company || "",
          designation: mentorP?.designation || "",
          graduation_year: mentorP?.graduationYear,
        },
      };
    });
  });

export const createRequestServerFn = createServerFn({ method: "POST" })
  .validator((data: { token: string; mentorId: string; message?: string }) => data)
  .handler(async ({ data }) => {
    const auth = requireUser(data.token);
    await connectToDatabase();

    const myIdQueries = buildIdQueries(auth.sub);
    const mentorIdQueries = buildIdQueries(data.mentorId);

    const existing = await MentorshipRequestModel.findOne({
      menteeId: { $in: myIdQueries },
      mentorId: { $in: mentorIdQueries },
      status: { $in: ["pending", "accepted"] },
    });
    if (existing) {
      throw new Error("You already have a pending or active request with this mentor");
    }

    const created = await MentorshipRequestModel.create({
      menteeId: auth.sub,
      mentorId: data.mentorId,
      message: data.message || "",
      status: "pending",
    });

    return { id: created._id.toString(), success: true };
  });

export const updateRequestStatusServerFn = createServerFn({ method: "POST" })
  .validator((data: { token: string; requestId: string; status: RequestStatus }) => data)
  .handler(async ({ data }) => {
    const auth = requireUser(data.token);
    await connectToDatabase();

    const request = await MentorshipRequestModel.findById(data.requestId);
    if (!request) throw new Error("Request not found");
    if (String(request.mentorId) !== auth.sub && String(request.menteeId) !== auth.sub) {
      throw new Error("Unauthorized to update this request");
    }

    request.status = data.status;
    await request.save();

    return { success: true };
  });

// ==================== SLOTS & SESSIONS ====================

export const getMentorSlotsServerFn = createServerFn({ method: "POST" })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const auth = requireUser(data.token);
    await connectToDatabase();

    const idQueries = buildIdQueries(auth.sub);
    const slots = await AvailabilitySlotModel.find({ mentorId: { $in: idQueries } })
      .sort({ startTime: 1 })
      .lean();

    return slots.map((s) => ({
      id: s._id.toString(),
      mentor_id: String(s.mentorId),
      start_time: s.startTime.toISOString(),
      end_time: s.endTime.toISOString(),
      is_booked: s.isBooked,
    }));
  });

export const createSlotServerFn = createServerFn({ method: "POST" })
  .validator((data: { token: string; startTime: string; endTime: string }) => data)
  .handler(async ({ data }) => {
    const auth = requireUser(data.token);
    await connectToDatabase();

    const slot = await AvailabilitySlotModel.create({
      mentorId: auth.sub,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      isBooked: false,
    });

    return { id: slot._id.toString(), success: true };
  });

export const deleteSlotServerFn = createServerFn({ method: "POST" })
  .validator((data: { token: string; slotId: string }) => data)
  .handler(async ({ data }) => {
    const auth = requireUser(data.token);
    await connectToDatabase();

    const idQueries = buildIdQueries(auth.sub);
    await AvailabilitySlotModel.findOneAndDelete({ _id: data.slotId, mentorId: { $in: idQueries } });
    return { success: true };
  });

export const getSessionsServerFn = createServerFn({ method: "POST" })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const auth = requireUser(data.token);
    await connectToDatabase();

    const idQueries = buildIdQueries(auth.sub);
    const sessions = await SessionModel.find({
      $or: [{ mentorId: { $in: idQueries } }, { menteeId: { $in: idQueries } }],
    })
      .sort({ scheduledAt: -1 })
      .lean();

    const userIds = [
      ...new Set(sessions.flatMap((s) => [String(s.mentorId), String(s.menteeId)])),
    ];
    const users = await UserModel.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    return sessions.map((s) => {
      const mentorIdStr = String(s.mentorId);
      const menteeIdStr = String(s.menteeId);
      return {
        id: s._id.toString(),
        mentor_id: mentorIdStr,
        mentee_id: menteeIdStr,
        slot_id: s.slotId,
        scheduled_at: s.scheduledAt.toISOString(),
        end_at: s.endAt?.toISOString(),
        meeting_url: s.meetingUrl,
        topic: s.topic,
        status: s.status,
        created_at: s.createdAt.toISOString(),
        mentor: {
          id: mentorIdStr,
          full_name: userMap.get(mentorIdStr)?.fullName || "Mentor",
          avatar_url: userMap.get(mentorIdStr)?.avatarUrl,
        },
        mentee: {
          id: menteeIdStr,
          full_name: userMap.get(menteeIdStr)?.fullName || "Mentee",
          avatar_url: userMap.get(menteeIdStr)?.avatarUrl,
        },
      };
    });
  });

export const bookSessionServerFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      token: string;
      mentorId: string;
      slotId?: string;
      scheduledAt: string;
      topic?: string;
      meetingUrl?: string;
    }) => data
  )
  .handler(async ({ data }) => {
    const auth = requireUser(data.token);
    await connectToDatabase();

    if (data.slotId) {
      await AvailabilitySlotModel.findByIdAndUpdate(data.slotId, { isBooked: true });
    }

    const session = await SessionModel.create({
      mentorId: data.mentorId,
      menteeId: auth.sub,
      slotId: data.slotId,
      scheduledAt: new Date(data.scheduledAt),
      topic: data.topic || "Mentorship Session",
      meetingUrl: data.meetingUrl || `https://meet.jit.si/mentor-session-${Math.random().toString(36).substring(7)}`,
      status: "confirmed",
    });

    return { id: session._id.toString(), success: true };
  });

export const updateSessionStatusServerFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      token: string;
      sessionId: string;
      status?: SessionStatus;
      meetingUrl?: string;
    }) => data
  )
  .handler(async ({ data }) => {
    const auth = requireUser(data.token);
    await connectToDatabase();

    const session = await SessionModel.findById(data.sessionId);
    if (!session) throw new Error("Session not found");
    if (String(session.mentorId) !== auth.sub && String(session.menteeId) !== auth.sub) {
      throw new Error("Unauthorized");
    }

    if (data.status) session.status = data.status;
    if (data.meetingUrl !== undefined) session.meetingUrl = data.meetingUrl;

    await session.save();
    return { success: true };
  });

// ==================== MESSAGING ====================

export const getConversationsServerFn = createServerFn({ method: "POST" })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const auth = requireUser(data.token);
    await connectToDatabase();

    const myId = auth.sub;
    const myIdQueries = buildIdQueries(myId);

    // Find ALL mentorship requests (pending, accepted, etc.)
    const requests = await MentorshipRequestModel.find({
      $or: [{ menteeId: { $in: myIdQueries } }, { mentorId: { $in: myIdQueries } }],
    })
      .sort({ createdAt: -1 })
      .lean();

    // Find ALL messages
    const messages = await MessageModel.find({
      $or: [{ senderId: { $in: myIdQueries } }, { receiverId: { $in: myIdQueries } }],
    })
      .sort({ createdAt: -1 })
      .lean();

    const otherUserIds = new Set<string>();
    requests.forEach((r) => {
      const other = String(r.menteeId) === myId ? String(r.mentorId) : String(r.menteeId);
      otherUserIds.add(other);
    });
    messages.forEach((m) => {
      const other = String(m.senderId) === myId ? String(m.receiverId) : String(m.senderId);
      otherUserIds.add(other);
    });

    const otherIdArr = Array.from(otherUserIds);
    const users = await UserModel.find({ _id: { $in: otherIdArr } }).lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const studentProfiles = await StudentProfileModel.find({
      $or: [{ userId: { $in: otherIdArr } }, { userId: { $in: otherIdArr.filter(id => mongoose.isValidObjectId(id)).map(id => new mongoose.Types.ObjectId(id)) } }],
    }).lean();
    const studentMap = new Map(studentProfiles.map((s) => [String(s.userId), s]));

    const mentorProfiles = await MentorProfileModel.find({
      $or: [{ userId: { $in: otherIdArr } }, { userId: { $in: otherIdArr.filter(id => mongoose.isValidObjectId(id)).map(id => new mongoose.Types.ObjectId(id)) } }],
    }).lean();
    const mentorMap = new Map(mentorProfiles.map((m) => [String(m.userId), m]));

    return otherIdArr
      .map((otherId) => {
        const u = userMap.get(otherId);
        if (!u) return null;

        const studentP = studentMap.get(otherId);
        const mentorP = mentorMap.get(otherId);

        const lastMsg = messages.find(
          (m) =>
            (String(m.senderId) === myId && String(m.receiverId) === otherId) ||
            (String(m.senderId) === otherId && String(m.receiverId) === myId)
        );

        const relReq = requests.find(
          (r) =>
            (String(r.menteeId) === myId && String(r.mentorId) === otherId) ||
            (String(r.menteeId) === otherId && String(r.mentorId) === myId)
        );

        return {
          id: u._id.toString(),
          full_name: u.fullName,
          email: u.email,
          avatar_url: u.avatarUrl,
          role: u.role,
          last_message: lastMsg ? lastMsg.content : (relReq?.message || "Connected on Mentorship Platform"),
          last_message_time: lastMsg ? lastMsg.createdAt.toISOString() : (relReq?.createdAt ? relReq.createdAt.toISOString() : undefined),
          request_status: relReq?.status,
          department: studentP?.department || mentorP?.department || "",
          academic_year: studentP?.academicYear || "",
          career_goals: studentP?.careerGoals || "",
          skills: (studentP?.skills && studentP.skills.length > 0) ? studentP.skills : (mentorP?.expertise || []),
          company: mentorP?.company || "",
          designation: mentorP?.designation || "",
          graduation_year: mentorP?.graduationYear,
        };
      })
      .filter(Boolean);
  });

export const getMessagesServerFn = createServerFn({ method: "POST" })
  .validator((data: { token: string; otherUserId: string }) => data)
  .handler(async ({ data }) => {
    const auth = requireUser(data.token);
    await connectToDatabase();

    const myId = auth.sub;
    const myIdQueries = buildIdQueries(myId);
    const otherId = data.otherUserId;
    const otherIdQueries = buildIdQueries(otherId);

    const otherUser = await UserModel.findById(otherId).lean();
    let studentP = null;
    let mentorP = null;
    if (otherUser) {
      if (otherUser.role === "student") {
        studentP = await StudentProfileModel.findOne({ userId: { $in: otherIdQueries } }).lean();
      } else if (otherUser.role === "mentor") {
        mentorP = await MentorProfileModel.findOne({ userId: { $in: otherIdQueries } }).lean();
      }
    }

    const messages = await MessageModel.find({
      $or: [
        { senderId: { $in: myIdQueries }, receiverId: { $in: otherIdQueries } },
        { senderId: { $in: otherIdQueries }, receiverId: { $in: myIdQueries } },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    return {
      otherUser: otherUser
        ? {
            id: otherUser._id.toString(),
            full_name: otherUser.fullName,
            email: otherUser.email,
            avatar_url: otherUser.avatarUrl,
            role: otherUser.role,
            department: studentP?.department || mentorP?.department || "",
            academic_year: studentP?.academicYear || "",
            career_goals: studentP?.careerGoals || "",
            skills: (studentP?.skills && studentP.skills.length > 0) ? studentP.skills : (mentorP?.expertise || []),
            company: mentorP?.company || "",
            designation: mentorP?.designation || "",
            graduation_year: mentorP?.graduationYear,
          }
        : null,
      messages: messages.map((m) => ({
        id: m._id.toString(),
        sender_id: String(m.senderId),
        receiver_id: String(m.receiverId),
        content: m.content,
        created_at: m.createdAt.toISOString(),
      })),
    };
  });

export const sendMessageServerFn = createServerFn({ method: "POST" })
  .validator((data: { token: string; receiverId: string; content: string }) => data)
  .handler(async ({ data }) => {
    const auth = requireUser(data.token);
    await connectToDatabase();

    const message = await MessageModel.create({
      senderId: auth.sub,
      receiverId: data.receiverId,
      content: data.content,
    });

    return {
      id: message._id.toString(),
      sender_id: String(message.senderId),
      receiver_id: String(message.receiverId),
      content: message.content,
      created_at: message.createdAt.toISOString(),
    };
  });

// ==================== FEEDBACK ====================

export const getFeedbackServerFn = createServerFn({ method: "POST" })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const auth = requireUser(data.token);
    await connectToDatabase();

    const idQueries = buildIdQueries(auth.sub);
    const mySessions = await SessionModel.find({
      $or: [{ mentorId: { $in: idQueries } }, { menteeId: { $in: idQueries } }],
      status: "completed",
    }).lean();

    const sessionIds = mySessions.map((s) => s._id.toString());
    const feedbacks = await FeedbackModel.find({ sessionId: { $in: sessionIds } }).lean();

    const userIds = [
      ...new Set([
        ...mySessions.flatMap((s) => [String(s.mentorId), String(s.menteeId)]),
        ...feedbacks.map((f) => String(f.raterId)),
      ]),
    ];
    const users = await UserModel.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    return {
      sessions: mySessions.map((s) => ({
        id: s._id.toString(),
        topic: s.topic,
        scheduled_at: s.scheduledAt.toISOString(),
        mentor_id: String(s.mentorId),
        mentee_id: String(s.menteeId),
        mentor: { full_name: userMap.get(String(s.mentorId))?.fullName || "Mentor" },
        mentee: { full_name: userMap.get(String(s.menteeId))?.fullName || "Student" },
      })),
      feedback: feedbacks.map((f) => ({
        id: f._id.toString(),
        session_id: String(f.sessionId),
        rater_id: String(f.raterId),
        rating: f.rating,
        review: f.review,
        created_at: f.createdAt.toISOString(),
        rater: { full_name: userMap.get(String(f.raterId))?.fullName || "User" },
      })),
    };
  });

export const submitFeedbackServerFn = createServerFn({ method: "POST" })
  .validator((data: { token: string; sessionId: string; rating: number; review?: string }) => data)
  .handler(async ({ data }) => {
    const auth = requireUser(data.token);
    await connectToDatabase();

    const feedback = await FeedbackModel.findOneAndUpdate(
      { sessionId: data.sessionId, raterId: auth.sub },
      {
        sessionId: data.sessionId,
        raterId: auth.sub,
        rating: data.rating,
        review: data.review || "",
      },
      { upsert: true, new: true }
    );

    return { id: feedback._id.toString(), success: true };
  });

// ==================== DASHBOARD & ADMIN ====================

export const getDashboardStatsServerFn = createServerFn({ method: "POST" })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const auth = requireUser(data.token);
    await connectToDatabase();

    const idQueries = buildIdQueries(auth.sub);
    const mentorsCount = await MentorProfileModel.countDocuments({ approved: true });
    const studentsCount = await StudentProfileModel.countDocuments();
    const sessionsCount = await SessionModel.countDocuments({
      $or: [{ mentorId: { $in: idQueries } }, { menteeId: { $in: idQueries } }],
    });
    const pendingRequestsCount = await MentorshipRequestModel.countDocuments({
      $or: [{ mentorId: { $in: idQueries } }, { menteeId: { $in: idQueries } }],
      status: "pending",
    });

    const upcomingSessions = await SessionModel.find({
      $or: [{ mentorId: { $in: idQueries } }, { menteeId: { $in: idQueries } }],
      scheduledAt: { $gte: new Date() },
      status: { $in: ["pending", "confirmed"] },
    })
      .sort({ scheduledAt: 1 })
      .limit(5)
      .lean();

    const otherUserIds = upcomingSessions.map((s) => (String(s.mentorId) === auth.sub ? String(s.menteeId) : String(s.mentorId)));
    const users = await UserModel.find({ _id: { $in: otherUserIds } }).lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    return {
      mentorsCount,
      studentsCount,
      sessionsCount,
      pendingRequestsCount,
      upcomingSessions: upcomingSessions.map((s) => ({
        id: s._id.toString(),
        topic: s.topic,
        scheduled_at: s.scheduledAt.toISOString(),
        meeting_url: s.meetingUrl,
        other_user_name: userMap.get(String(s.mentorId) === auth.sub ? String(s.menteeId) : String(s.mentorId))?.fullName || "User",
      })),
    };
  });

export const getAdminDataServerFn = createServerFn({ method: "POST" })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const auth = requireUser(data.token);
    if (auth.role !== "admin") throw new Error("Admin access required");
    await connectToDatabase();

    const mentors = await MentorProfileModel.find().lean();
    const mentorUserIds = mentors.map((m) => String(m.userId));
    const mentorUsers = await UserModel.find({
      $or: [{ _id: { $in: mentorUserIds } }, { role: "mentor" }],
    }).lean();
    const mentorUserMap = new Map(mentorUsers.map((u) => [u._id.toString(), u]));

    const students = await StudentProfileModel.find().lean();
    const studentUserIds = students.map((s) => String(s.userId));
    const studentUsers = await UserModel.find({
      $or: [{ _id: { $in: studentUserIds } }, { role: "student" }],
    }).lean();
    const studentUserMap = new Map(studentUsers.map((u) => [u._id.toString(), u]));

    const sessions = await SessionModel.find().sort({ scheduledAt: -1 }).limit(50).lean();
    const sessionUserIds = sessions.flatMap((s) => [String(s.mentorId), String(s.menteeId)]);
    const sessionUsers = await UserModel.find({ _id: { $in: sessionUserIds } }).lean();
    const sessionUserMap = new Map(sessionUsers.map((u) => [u._id.toString(), u]));

    return {
      mentors: mentors.map((m) => {
        const uId = String(m.userId);
        const u = mentorUserMap.get(uId);
        return {
          id: m._id.toString(),
          user_id: uId,
          full_name: u?.fullName || "Unknown",
          email: u?.email || "",
          avatar_url: u?.avatarUrl,
          company: m.company,
          designation: m.designation,
          department: m.department,
          graduation_year: m.graduationYear,
          experience_years: m.experienceYears,
          approved: m.approved,
          created_at: m.createdAt.toISOString(),
        };
      }),
      students: students.map((s) => {
        const uId = String(s.userId);
        const u = studentUserMap.get(uId);
        return {
          id: s._id.toString(),
          user_id: uId,
          full_name: u?.fullName || "Unknown",
          email: u?.email || "",
          avatar_url: u?.avatarUrl,
          department: s.department,
          academic_year: s.academicYear,
          career_goals: s.careerGoals,
          interests: s.interests || [],
          skills: s.skills || [],
          linkedin_url: s.linkedinUrl,
          created_at: s.createdAt.toISOString(),
        };
      }),
      sessions: sessions.map((s) => ({
        id: s._id.toString(),
        topic: s.topic,
        scheduled_at: s.scheduledAt.toISOString(),
        status: s.status,
        mentor_name: sessionUserMap.get(String(s.mentorId))?.fullName || "Mentor",
        mentee_name: sessionUserMap.get(String(s.menteeId))?.fullName || "Mentee",
      })),
    };
  });

export const approveMentorServerFn = createServerFn({ method: "POST" })
  .validator((data: { token: string; mentorUserId: string; approved: boolean }) => data)
  .handler(async ({ data }) => {
    const auth = requireUser(data.token);
    if (auth.role !== "admin") throw new Error("Admin access required");
    await connectToDatabase();

    const idQueries = buildIdQueries(data.mentorUserId);
    await MentorProfileModel.findOneAndUpdate(
      { userId: { $in: idQueries } },
      { approved: data.approved, approvedAt: data.approved ? new Date() : undefined }
    );

    return { success: true };
  });

export const adminUpdateMentorDetailsServerFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      token: string;
      mentorUserId: string;
      graduationYear?: number;
      company?: string;
      designation?: string;
      department?: string;
    }) => data
  )
  .handler(async ({ data }) => {
    const auth = requireUser(data.token);
    if (auth.role !== "admin") throw new Error("Admin access required");
    await connectToDatabase();

    const idQueries = buildIdQueries(data.mentorUserId);
    await MentorProfileModel.findOneAndUpdate(
      { userId: { $in: idQueries } },
      {
        graduationYear: data.graduationYear,
        company: data.company,
        designation: data.designation,
        department: data.department,
      }
    );

    return { success: true };
  });

export const adminCreateAlumniServerFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      token: string;
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
    }) => data
  )
  .handler(async ({ data }) => {
    const auth = requireUser(data.token);
    if (auth.role !== "admin") throw new Error("Admin access required");
    await connectToDatabase();

    const email = data.email.toLowerCase().trim();
    const existing = await UserModel.findOne({ email });
    if (existing) {
      throw new Error(`A user with email ${email} already exists`);
    }

    const rawPassword = data.password?.trim() || "password123";
    const passwordHash = await hashPassword(rawPassword);

    const user = await UserModel.create({
      fullName: data.fullName.trim(),
      email,
      passwordHash,
      role: "mentor",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    });

    const isApproved = data.approved !== false;
    await MentorProfileModel.create({
      userId: user._id.toString(),
      company: data.company.trim(),
      designation: data.designation?.trim() || "Software Engineer",
      graduationYear: data.graduationYear || new Date().getFullYear(),
      department: data.department?.trim() || "Computer Engineering",
      experienceYears: data.experienceYears || 2,
      bio: data.bio?.trim() || `${data.fullName} is a verified alumnus working at ${data.company}.`,
      expertise: data.expertise && data.expertise.length > 0 ? data.expertise : ["Mentorship", "Career Advice", "Interview Prep"],
      approved: isApproved,
      approvedAt: isApproved ? new Date() : undefined,
    });

    // Create an initial default availability slot for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(18, 0, 0, 0);

    await AvailabilitySlotModel.create({
      mentorId: user._id.toString(),
      startTime: tomorrow,
      endTime: tomorrowEnd,
      isBooked: false,
    });

    // Send credentials email to the newly registered mentor
    const emailResult = await sendWelcomeCredentialsEmail({
      to: email,
      fullName: data.fullName,
      role: "mentor",
      rawPassword,
      company: data.company,
      department: data.department,
    });

    return {
      success: true,
      userId: user._id.toString(),
      emailSent: emailResult.success,
      emailPreview: emailResult.previewUrl,
      message: `Alumni ${data.fullName} registered & welcome email dispatched!`,
    };
  });

export const adminCreateStudentServerFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      token: string;
      fullName: string;
      email: string;
      password?: string;
      department?: string;
      academicYear?: string;
      careerGoals?: string;
      skills?: string[];
    }) => data
  )
  .handler(async ({ data }) => {
    const auth = requireUser(data.token);
    if (auth.role !== "admin") throw new Error("Admin access required");
    await connectToDatabase();

    const email = data.email.toLowerCase().trim();
    const existing = await UserModel.findOne({ email });
    if (existing) {
      throw new Error(`A student with email ${email} already exists`);
    }

    const rawPassword = data.password?.trim() || "password123";
    const passwordHash = await hashPassword(rawPassword);

    const user = await UserModel.create({
      fullName: data.fullName.trim(),
      email,
      passwordHash,
      role: "student",
      avatarUrl: "",
    });

    await StudentProfileModel.create({
      userId: user._id.toString(),
      department: data.department?.trim() || "Computer Engineering",
      academicYear: data.academicYear?.trim() || "BE - Final Year",
      careerGoals: data.careerGoals?.trim() || "Software Engineer / Placement Preparation",
      skills: data.skills && data.skills.length > 0 ? data.skills : ["Problem Solving", "Data Structures", "Web Development"],
    });

    // Send credentials email to the newly registered student
    const emailResult = await sendWelcomeCredentialsEmail({
      to: email,
      fullName: data.fullName,
      role: "student",
      rawPassword,
      department: data.department,
    });

    return {
      success: true,
      userId: user._id.toString(),
      emailSent: emailResult.success,
      emailPreview: emailResult.previewUrl,
      message: `Student ${data.fullName} registered & credentials sent via email!`,
    };
  });
