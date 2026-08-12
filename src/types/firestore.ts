export type UserType = "candidate" | "company";

export type AppUser = {
  uid: string;
  email: string;
  fullName: string;
  userType: UserType;
  profileCompleted: boolean;
  profileImage?: string;
  phone?: string;
  phoneCountryCode?: string;
  address?: string;
  dob?: string;
  occupation?: string;
  country?: string;
  // candidate
  aboutMe?: string;
  skills?: string[];
  experienceYears?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  // company
  companyName?: string;
  industry?: string;
  website?: string;
  companySize?: string;
  foundedYear?: string;
  registrationNumber?: string;
  about?: string;
  companyLocation?: string;
  logoUrl?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type Job = {
  id: string;
  jobId?: string;
  companyId: string;
  companyName: string;
  logoUrl?: string;
  title: string;
  salary: string;
  location: string;
  type: string;
  priority?: string;
  category?: string;
  currency?: string;
  experience?: string;
  skills?: string[];
  description?: string;
  rolesAndResponsibilities?: string;
  attachmentUrl?: string;
  status?: string;
  applicantsCount?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ApplicationStatus =
  | "Under Review"
  | "Interview Scheduled"
  | "Hired"
  | "Rejected";

export type Application = {
  id: string;
  jobId: string;
  title: string;
  companyId: string;
  companyName: string;
  appliedAt?: unknown;
  resumeFile?: string;
  resumeUrl?: string;
  phone?: string;
  userId?: string;
  status?: ApplicationStatus;
  interviewDate?: string;
  interviewTime?: string;
  rejectionReason?: string;
  logoUrl?: string;
  location?: string;
  type?: string;
  salary?: string;
};

export type SavedJob = {
  id: string;
  jobId: string;
  companyId: string;
  title: string;
  companyName: string;
  location: string;
  type: string;
  salary: string;
  logoUrl?: string;
  description?: string;
  priority?: string;
  skills?: string[];
  timestamp?: unknown;
};
