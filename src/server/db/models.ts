import mongoose, { Schema, type Document, type Model } from "mongoose";

export type AppRole = "student" | "mentor" | "admin";
export type RequestStatus = "pending" | "accepted" | "rejected" | "cancelled";
export type SessionStatus = "pending" | "confirmed" | "completed" | "cancelled";

// 1. User
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  fullName: string;
  avatarUrl?: string;
  role: AppRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: "" },
    role: { type: String, enum: ["student", "mentor", "admin"], default: "student" },
  },
  { timestamps: true }
);

// 2. StudentProfile
export interface IStudentProfile extends Document {
  userId: string;
  department?: string;
  academicYear?: string;
  careerGoals?: string;
  interests: string[];
  skills: string[];
  linkedinUrl?: string;
  resumeUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    department: { type: String, default: "" },
    academicYear: { type: String, default: "" },
    careerGoals: { type: String, default: "" },
    interests: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    linkedinUrl: { type: String, default: "" },
    resumeUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

// 3. MentorProfile
export interface IMentorProfile extends Document {
  userId: string;
  graduationYear?: number;
  company?: string;
  designation?: string;
  experienceYears?: number;
  bio?: string;
  linkedinUrl?: string;
  expertise: string[];
  department?: string;
  approved: boolean;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MentorProfileSchema = new Schema<IMentorProfile>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    graduationYear: { type: Number },
    company: { type: String, default: "" },
    designation: { type: String, default: "" },
    experienceYears: { type: Number, default: 0 },
    bio: { type: String, default: "" },
    linkedinUrl: { type: String, default: "" },
    expertise: { type: [String], default: [] },
    department: { type: String, default: "" },
    approved: { type: Boolean, default: false },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

// 4. MentorshipRequest
export interface IMentorshipRequest extends Document {
  menteeId: string;
  mentorId: string;
  message?: string;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const MentorshipRequestSchema = new Schema<IMentorshipRequest>(
  {
    menteeId: { type: String, required: true, index: true },
    mentorId: { type: String, required: true, index: true },
    message: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

// 5. AvailabilitySlot
export interface IAvailabilitySlot extends Document {
  mentorId: string;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AvailabilitySlotSchema = new Schema<IAvailabilitySlot>(
  {
    mentorId: { type: String, required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    isBooked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 6. Session
export interface ISession extends Document {
  mentorId: string;
  menteeId: string;
  slotId?: string;
  scheduledAt: Date;
  endAt?: Date;
  meetingUrl?: string;
  topic?: string;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    mentorId: { type: String, required: true, index: true },
    menteeId: { type: String, required: true, index: true },
    slotId: { type: String },
    scheduledAt: { type: Date, required: true },
    endAt: { type: Date },
    meetingUrl: { type: String, default: "" },
    topic: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

// 7. Message
export interface IMessage extends Document {
  senderId: string;
  receiverId: string;
  content: string;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    senderId: { type: String, required: true, index: true },
    receiverId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    readAt: { type: Date },
  },
  { timestamps: true }
);

// 8. Notification
export interface INotification extends Document {
  userId: string;
  type: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 9. Feedback
export interface IFeedback extends Document {
  sessionId: string;
  raterId: string;
  rating: number;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    sessionId: { type: String, required: true, index: true },
    raterId: { type: String, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, default: "" },
  },
  { timestamps: true }
);

export const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export const StudentProfileModel: Model<IStudentProfile> =
  mongoose.models.StudentProfile || mongoose.model<IStudentProfile>("StudentProfile", StudentProfileSchema);
export const MentorProfileModel: Model<IMentorProfile> =
  mongoose.models.MentorProfile || mongoose.model<IMentorProfile>("MentorProfile", MentorProfileSchema);
export const MentorshipRequestModel: Model<IMentorshipRequest> =
  mongoose.models.MentorshipRequest || mongoose.model<IMentorshipRequest>("MentorshipRequest", MentorshipRequestSchema);
export const AvailabilitySlotModel: Model<IAvailabilitySlot> =
  mongoose.models.AvailabilitySlot || mongoose.model<IAvailabilitySlot>("AvailabilitySlot", AvailabilitySlotSchema);
export const SessionModel: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);
export const MessageModel: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
export const NotificationModel: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
export const FeedbackModel: Model<IFeedback> =
  mongoose.models.Feedback || mongoose.model<IFeedback>("Feedback", FeedbackSchema);
