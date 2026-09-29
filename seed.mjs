import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("No MONGODB_URI found in .env");
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  avatarUrl: { type: String },
  role: { type: String, enum: ["student", "mentor", "admin"], required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const StudentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  department: { type: String },
  academicYear: { type: String },
  careerGoals: { type: String },
  interests: [{ type: String }],
  skills: [{ type: String }],
  linkedinUrl: { type: String },
  resumeUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const MentorProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  graduationYear: { type: Number },
  company: { type: String },
  designation: { type: String },
  experienceYears: { type: Number },
  bio: { type: String },
  linkedinUrl: { type: String },
  expertise: [{ type: String }],
  department: { type: String },
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const AvailabilitySlotSchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  isBooked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
const StudentProfileModel = mongoose.models.StudentProfile || mongoose.model("StudentProfile", StudentProfileSchema);
const MentorProfileModel = mongoose.models.MentorProfile || mongoose.model("MentorProfile", MentorProfileSchema);
const AvailabilitySlotModel = mongoose.models.AvailabilitySlot || mongoose.model("AvailabilitySlot", AvailabilitySlotSchema);

async function seed() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);
  console.log("Connected successfully!");

  const count = await UserModel.countDocuments();
  if (count > 0) {
    console.log(`Database already has ${count} users. Skipping seed or you can clear DB first.`);
  }

  const hashedPassword = await bcrypt.hash("password123", 10);
  const adminRawPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminHashedPassword = await bcrypt.hash(adminRawPassword, 10);

  // 1. Admin
  const adminEmail = process.env.ADMIN_EMAIL || "admin@pcoer.in";
  let admin = await UserModel.findOne({ email: adminEmail });
  if (!admin) {
    admin = await UserModel.create({
      email: adminEmail,
      passwordHash: adminHashedPassword,
      fullName: "Platform Admin",
      role: "admin",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    });
    console.log(`Created Admin: ${adminEmail}`);
  }

  // 2. Sample Student
  let student = await UserModel.findOne({ email: "student@pcoer.in" });
  if (!student) {
    student = await UserModel.create({
      email: "student@pcoer.in",
      passwordHash: hashedPassword,
      fullName: "Aarav Sharma",
      role: "student",
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    });
    await StudentProfileModel.create({
      userId: student._id,
      department: "Computer Engineering",
      academicYear: "Final Year (BE)",
      careerGoals: "Aspiring to crack Software Engineer roles at product companies.",
      skills: ["React", "Node.js", "Data Structures", "Python", "SQL"],
      interests: ["Full Stack Development", "System Design", "Cloud Computing"],
      linkedinUrl: "https://linkedin.com/in/aarav-sharma",
    });
    console.log("Created Student: student@pcoer.in (Password: password123)");
  }

  // 3. Sample Verified Alumni Mentors
  const sampleMentors = [
    {
      fullName: "Priya Patil",
      email: "priya.patil@microsoft.alumni.com",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      company: "Microsoft",
      designation: "Software Engineer II",
      graduationYear: 2021,
      experienceYears: 3,
      department: "Computer Engineering",
      bio: "PCCOER 2021 Computer Engg graduate. Working on Azure Core Services. Happy to help juniors with DSA prep, mock technical interviews, and resume reviews.",
      expertise: ["System Design", "C++", "DSA", "Azure", "Resume Review", "Mock Interviews"],
      linkedinUrl: "https://linkedin.com/in/priya-patil",
    },
    {
      fullName: "Rohit Deshmukh",
      email: "rohit.deshmukh@amazon.alumni.com",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      company: "Amazon",
      designation: "SDE-2 (AWS)",
      graduationYear: 2020,
      experienceYears: 4,
      department: "Information Technology",
      bio: "AWS Commerce Platform SDE-2. Guided 30+ juniors into top tech companies. Can help with Amazon Leadership Principles and Coding rounds.",
      expertise: ["AWS", "Java", "Distributed Systems", "Amazon LPs", "Technical Interviews"],
      linkedinUrl: "https://linkedin.com/in/rohit-deshmukh",
    },
    {
      fullName: "Ananya Kulkarni",
      email: "ananya.kulkarni@barclays.alumni.com",
      avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
      company: "Barclays",
      designation: "Quantitative Tech Lead",
      graduationYear: 2022,
      experienceYears: 2,
      department: "Computer Engineering",
      bio: "FinTech specialist at Barclays Global Service Centre. Passionate about helping students crack FinTech and Core Engineering roles.",
      expertise: ["FinTech", "Python", "SQL", "Machine Learning", "Resume Strategy"],
      linkedinUrl: "https://linkedin.com/in/ananya-kulkarni",
    },
    {
      fullName: "Siddharth Joshi",
      email: "siddharth.joshi@tcs.alumni.com",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      company: "TCS Digital",
      designation: "Full Stack Engineer",
      graduationYear: 2023,
      experienceYears: 1,
      department: "Electronics & Telecommunication",
      bio: "PCCOER 2023 ENTC graduate. Cracked TCS Digital & multiple campus offers. Ready to share complete campus placement strategies with junior batches.",
      expertise: ["Full Stack", "React", "Node.js", "Campus Placements", "Aptitude"],
      linkedinUrl: "https://linkedin.com/in/siddharth-joshi",
    },
    {
      fullName: "Tanvi Shinde",
      email: "tanvi.shinde@google.alumni.com",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      company: "Google",
      designation: "Cloud Solutions Architect",
      graduationYear: 2019,
      experienceYears: 5,
      department: "Computer Engineering",
      bio: "Alumni from 2019 batch. Helping students with Google interview loops, cloud certifications, and career roadmaps.",
      expertise: ["Google Cloud", "Kubernetes", "Architecture", "Interview Coaching"],
      linkedinUrl: "https://linkedin.com/in/tanvi-shinde",
    },
    {
      fullName: "Shashank Pawar",
      email: "shashank.pawar@fox.alumni.com",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      company: "FOX",
      designation: "Software Engineer",
      graduationYear: 2022,
      experienceYears: 2,
      department: "Computer Engineering",
      bio: "PCCOER 2022 CE graduate working at FOX Corporation on media streaming platforms. Can guide students on breaking into media-tech and product engineering companies.",
      expertise: ["Java", "Microservices", "Media Tech", "System Design", "Interview Prep"],
      linkedinUrl: "https://linkedin.com/in/shashank-pawar",
    },
    {
      fullName: "Alisha Mehta",
      email: "alisha.mehta@hpe.alumni.com",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      company: "HPE",
      designation: "Cloud & Infrastructure Engineer",
      graduationYear: 2021,
      experienceYears: 3,
      department: "Information Technology",
      bio: "Working at Hewlett Packard Enterprise (HPE) on cloud infrastructure solutions. Passionate about helping students get into core IT and cloud roles.",
      expertise: ["Cloud Infrastructure", "Linux", "Networking", "HPE GreenLake", "Resume Review"],
      linkedinUrl: "https://linkedin.com/in/alisha-mehta",
    },
    {
      fullName: "Pavan Kulkarni",
      email: "pavan.kulkarni@capgemini.alumni.com",
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
      company: "Capgemini",
      designation: "Associate Consultant",
      graduationYear: 2023,
      experienceYears: 1,
      department: "Mechanical Engineering",
      bio: "PCCOER 2023 Mech grad who switched into IT at Capgemini. Cracked off-campus placements. Can help non-CS students transition to software roles.",
      expertise: ["Python", "Aptitude", "Off-Campus Strategy", "Core to IT Switch", "Communication"],
      linkedinUrl: "https://linkedin.com/in/pavan-kulkarni",
    },
    {
      fullName: "Yash Desai",
      email: "yash.desai@tcs.alumni.com",
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
      company: "TCS",
      designation: "Systems Engineer",
      graduationYear: 2024,
      experienceYears: 0,
      department: "Electronics & Telecommunication",
      bio: "Recent PCCOER 2024 ENTC pass-out at TCS. Freshly cleared TCS NQT and ninja interviews. Best person to help current final year and pre-final year students with TCS prep.",
      expertise: ["TCS NQT Prep", "Aptitude", "Verbal Ability", "Campus Placement Tips", "Coding Rounds"],
      linkedinUrl: "https://linkedin.com/in/yash-desai",
    },
    {
      fullName: "Saket Ghatge",
      email: "saket.ghatge@cognizant.alumni.com",
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
      company: "Cognizant",
      designation: "Programmer Analyst",
      graduationYear: 2023,
      experienceYears: 1,
      department: "Computer Engineering",
      bio: "PCCOER 2023 CE graduate now working at Cognizant. Cleared Cognizant GenC Next and multiple MNC drives. Ready to guide students on service-based company placements.",
      expertise: ["GenC Next Prep", "Aptitude", "SQL", "Java Basics", "Communication Skills"],
      linkedinUrl: "https://linkedin.com/in/saket-ghatge",
    },
  ];

  for (const m of sampleMentors) {
    let user = await UserModel.findOne({ email: m.email });
    if (!user) {
      user = await UserModel.create({
        email: m.email,
        passwordHash: hashedPassword,
        fullName: m.fullName,
        avatarUrl: m.avatarUrl,
        role: "mentor",
      });
      await MentorProfileModel.create({
        userId: user._id,
        graduationYear: m.graduationYear,
        company: m.company,
        designation: m.designation,
        experienceYears: m.experienceYears,
        bio: m.bio,
        linkedinUrl: m.linkedinUrl,
        expertise: m.expertise,
        department: m.department,
        approved: true,
      });

      // Add upcoming availability slots
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0);

      const slotEnd = new Date(tomorrow);
      slotEnd.setMinutes(slotEnd.getMinutes() + 45);

      await AvailabilitySlotModel.create({
        mentorId: user._id,
        startTime: tomorrow,
        endTime: slotEnd,
        isBooked: false,
      });

      console.log(`Created Mentor: ${m.fullName} (${m.company}) - ${m.email}`);
    }
  }

  console.log("\n--- SEED COMPLETED ---");
  console.log("Admin account: placement@pcoer.in | Password: admin123");
  console.log("Student account: student@pcoer.in | Password: password123");
  console.log("Mentor accounts: (Password for all: password123)");
  console.log("  - priya.patil@microsoft.alumni.com (Microsoft)");
  console.log("  - rohit.deshmukh@amazon.alumni.com (Amazon)");
  console.log("  - ananya.kulkarni@barclays.alumni.com (Barclays)");
  console.log("  - siddharth.joshi@tcs.alumni.com (TCS Digital)");
  console.log("  - tanvi.shinde@google.alumni.com (Google)");
  console.log("  - shashank.pawar@fox.alumni.com (FOX)");
  console.log("  - alisha.mehta@hpe.alumni.com (HPE)");
  console.log("  - pavan.kulkarni@capgemini.alumni.com (Capgemini)");
  console.log("  - yash.desai@tcs.alumni.com (TCS)");
  console.log("  - saket.ghatge@cognizant.alumni.com (Cognizant)");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
