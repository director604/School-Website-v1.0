export interface EducationalPillar {
  id?: string;
  title: string;
  desc: string;
  targetGrade: string;
  icon?: string;
}

export interface GovernanceCardItem {
  id: string;
  title: string;
  desc: string;
  buttonText: string;
  targetTab: string;
  icon?: string;
}

export interface QuickLinkItem {
  id: string;
  title: string;
  desc: string;
  url: string;
  icon?: string;
  badge?: string;
  color?: string;
  isExternal?: boolean;
}

export interface HomepageSectionVisibility {
  heroStats?: boolean;
  urgentTicker?: boolean;
  directorWelcome?: boolean;
  educationalPillars?: boolean;
  recentNews?: boolean;
  recentGallery?: boolean;
  videoGallery?: boolean;
  quickLinks?: boolean;
  communityGovernance?: boolean;
  contactStrip?: boolean;
}

export interface SchoolInfo {
  id?: string;
  schoolName: string;
  schoolNameEn: string;
  schoolIdCode: string;
  affiliation: string;
  motto: string;
  vision: string;
  mission: string[];
  goals: string[];
  history: string;
  identity: string;
  uniqueness: string;
  philosophy: string;
  colors: string;
  tree: string;
  directorName: string;
  directorPosition: string;
  directorRank: string;
  directorGreetingTitle?: string;
  directorQuoteTitle?: string;
  directorMessage: string;
  directorImageUrl: string;
  heroImageUrl?: string;
  heroTagline?: string;
  heroBadgeTitle?: string;
  heroBadgeSubtitle?: string;
  safetyStatPercent?: string;
  safetyStatLabel?: string;
  urgentTickerEnabled?: boolean;
  urgentTickerLabel?: string;
  urgentTickerText?: string;
  urgentTickerLink?: string;
  pillarsTitle?: string;
  pillarsSubtitle?: string;
  educationalPillars?: EducationalPillar[];
  governanceTitle?: string;
  governanceSubtitle?: string;
  governanceDesc?: string;
  governanceCards?: GovernanceCardItem[];
  quickLinksTitle?: string;
  quickLinksSubtitle?: string;
  quickLinks?: QuickLinkItem[];
  contactStripTitle?: string;
  contactStripDesc?: string;
  contactStripButtonDrive?: string;
  contactStripButtonMap?: string;
  videoSectionTitle?: string;
  videoSectionSubtitle?: string;
  videoSectionMaxItems?: number;
  sectionsVisibility?: HomepageSectionVisibility;
  address: string;
  phone: string;
  email: string;
  facebookUrl?: string;
  googleMapEmbedUrl?: string;
  studentCount: number;
  teacherCount: number;
  classroomCount: number;
  updatedAt?: string;
  updatedBy?: string;
}

export type StaffRoleCategory = 'executive' | 'teacher' | 'support';

export interface StaffMember {
  id: string;
  prefix: string;
  name: string;
  position: string;
  academicRank?: string;
  department: string;
  roleCategory: StaffRoleCategory;
  email?: string;
  phone?: string;
  education?: string;
  imageUrl?: string;
  order: number;
  updatedAt?: string;
}

export type BoardType = 'basic_education' | 'parents_network';

export interface BoardMember {
  id: string;
  name: string;
  boardType: BoardType;
  roleInBoard: string;
  representation?: string;
  occupation?: string;
  phone?: string;
  imageUrl?: string;
  order: number;
  updatedAt?: string;
}

export interface PostCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  count?: number;
  order?: number;
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  size?: string;
  mimeType: string;
  uploadedAt: string;
  source: 'upload' | 'drive' | 'asset';
  driveFileId?: string;
  driveFolderId?: string;
}

export type NewsCategory = 'news' | 'announcement' | 'procurement' | 'academic' | string;

export type SchoolDepartment = 'academic' | 'budget' | 'personnel' | 'general' | 'all';

export const SCHOOL_DEPARTMENTS: { id: SchoolDepartment; label: string; code: string }[] = [
  { id: 'academic', label: 'งานบริหารวิชาการ', code: '01' },
  { id: 'budget', label: 'งานบริหารงบประมาณและสินทรัพย์', code: '02' },
  { id: 'personnel', label: 'งานบริหารงานบุคคล', code: '03' },
  { id: 'general', label: 'งานบริหารทั่วไป', code: '04' }
];

export interface NewsPost {
  id: string;
  title: string;
  category: NewsCategory;
  department?: SchoolDepartment | string;
  summary: string;
  content: string;
  coverImage?: string;
  authorName: string;
  authorId: string;
  driveFileId?: string;
  driveFileName?: string;
  driveFileUrl?: string;
  published: boolean;
  pinned: boolean;
  createdAt: string;
  updatedAt?: string;
  views?: number;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  description: string;
  activityDate: string;
  coverImage: string;
  images: string[];
  driveFolderId?: string;
  driveFolderUrl?: string;
  authorId: string;
  authorName?: string;
  createdAt: string;
  updatedAt?: string;
}

export type UserRole = 'superadmin' | 'admin' | 'editor' | 'teacher' | 'guest';
export type UserStatus = 'active' | 'suspended';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role?: UserRole;
  department?: string;
  status?: UserStatus;
  [key: string]: any;
}

export type User = AppUser;

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  department?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminRecord {
  uid: string;
  email: string;
  grantedBy: string;
  createdAt: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  iconLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  size?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
}

export type DriveFolderCategory = 'academic' | 'budget' | 'personnel' | 'general' | 'gallery' | 'other';

export interface DriveFolderConfig {
  id: string;
  name: string;
  folderId: string;
  folderUrl: string;
  category: DriveFolderCategory;
  description?: string;
  yearBE?: number;
}

export interface VideoItem {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  youtubeId?: string;
  driveFileId?: string;
  driveFolderId?: string;
  duration?: string;
  category?: string;
  published: boolean;
  createdAt: string;
  updatedAt?: string;
  authorId?: string;
  authorName?: string;
  views?: number;
}

export type PublicDocumentCategory = 'academic' | 'budget' | 'personnel' | 'general' | 'sar' | 'other';

export interface PublicDocumentItem {
  id: string;
  title: string;
  category: PublicDocumentCategory;
  academicYearBE: number;
  pdfUrl: string;
  pdfFileName: string;
  fileSize?: string;
  source: 'upload' | 'drive';
  driveFileId?: string;
  driveFolderId?: string;
  published: boolean;
  downloads?: number;
  authorId: string;
  authorName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DriveSettings {
  id: string;
  centralFolderId: string;
  centralFolderName: string;
  centralFolderUrl: string;
  sharedDriveName?: string;
  allowPublicDownload: boolean;
  enableVideoGallery?: boolean;
  departmentFolders: DriveFolderConfig[];
  currentAcademicYear?: number;
  availableYears?: number[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface SiteStats {
  id?: string;
  totalVisits: number;
  todayVisits?: number;
  lastVisitedAt?: string;
  lastDate?: string;
  resetAt?: string;
  resetBy?: string;
  updatedAt?: string;
}

export type InboxMessageStatus = 'new' | 'in_progress' | 'replied' | 'archived';

export interface InboxMessage {
  id: string;
  senderName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: InboxMessageStatus;
  directorNotes?: string;
  createdAt: string;
  updatedAt?: string;
  repliedAt?: string;
}

export interface SystemRolesConfig {
  id?: string;
  superAdminEmail: string;
  adminEmails: string[];
  updatedAt?: string;
  updatedBy?: string;
}

