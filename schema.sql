-- =============================================================================
-- Cloudflare D1 (SQLite) Schema for Ban Naree School Web Application
-- โครงสร้างฐานข้อมูลโรงเรียนบ้านนารี (สพป.ชัยภูมิ เขต 1) สำหรับ Cloudflare D1
-- =============================================================================

-- 1. ตารางข้อมูลพื้นฐานสถานศึกษา (School Profile & Homepage Configurations)
CREATE TABLE IF NOT EXISTS school_info (
  id TEXT PRIMARY KEY DEFAULT 'main',
  school_name TEXT NOT NULL,
  school_name_en TEXT,
  school_id_code TEXT,
  affiliation TEXT,
  motto TEXT,
  philosophy TEXT,
  vision TEXT,
  mission TEXT DEFAULT '[]',          -- JSON Array: ["ข้อ 1", "ข้อ 2", ...]
  goals TEXT DEFAULT '[]',            -- JSON Array: ["เป้าหมาย 1", ...]
  history TEXT,
  identity TEXT,
  uniqueness TEXT,
  colors TEXT,
  tree TEXT,
  director_name TEXT,
  director_position TEXT,
  director_rank TEXT,
  director_quote_title TEXT,
  director_message TEXT,
  director_image_url TEXT,
  hero_image_url TEXT,
  hero_tagline TEXT,
  hero_badge_title TEXT,
  hero_badge_subtitle TEXT,
  safety_stat_percent TEXT,
  safety_stat_label TEXT,
  urgent_ticker_enabled INTEGER DEFAULT 0,
  urgent_ticker_label TEXT,
  urgent_ticker_text TEXT,
  urgent_ticker_link TEXT,
  pillars_title TEXT,
  pillars_subtitle TEXT,
  educational_pillars TEXT DEFAULT '[]', -- JSON Array of EducationalPillar
  governance_title TEXT,
  governance_subtitle TEXT,
  governance_desc TEXT,
  governance_cards TEXT DEFAULT '[]',    -- JSON Array of GovernanceCardItem
  quick_links_title TEXT,
  quick_links_subtitle TEXT,
  quick_links TEXT DEFAULT '[]',         -- JSON Array of QuickLinkItem
  contact_strip_title TEXT,
  contact_strip_desc TEXT,
  contact_strip_button_drive TEXT,
  contact_strip_button_map TEXT,
  video_section_title TEXT,
  video_section_subtitle TEXT,
  video_section_max_items INTEGER DEFAULT 6,
  sections_visibility TEXT DEFAULT '{}', -- JSON Object of HomepageSectionVisibility
  address TEXT,
  phone TEXT,
  email TEXT,
  facebook_url TEXT,
  google_map_embed_url TEXT,
  student_count INTEGER DEFAULT 0,
  teacher_count INTEGER DEFAULT 0,
  classroom_count INTEGER DEFAULT 0,
  updated_at TEXT,
  updated_by TEXT
);

-- 2. ตารางบุคลากรทางการศึกษา (Staff Directory)
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  prefix TEXT,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  academic_rank TEXT,
  department TEXT NOT NULL,
  role_category TEXT NOT NULL CHECK(role_category IN ('executive', 'teacher', 'support')),
  email TEXT,
  phone TEXT,
  education TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_staff_sort_order ON staff(sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department);

-- 3. ตารางคณะกรรมการสถานศึกษาและเครือข่ายผู้ปกครอง (Board Members)
CREATE TABLE IF NOT EXISTS board_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  board_type TEXT NOT NULL CHECK(board_type IN ('basic_education', 'parents_network')),
  role_in_board TEXT NOT NULL,
  representation TEXT,
  occupation TEXT,
  phone TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_board_members_type ON board_members(board_type, sort_order ASC);

-- 4. ตารางข่าวสารและประกาศโรงเรียน (News & Announcements)
CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  department TEXT,
  summary TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  author_name TEXT,
  author_id TEXT NOT NULL,
  drive_file_id TEXT,
  drive_file_name TEXT,
  drive_file_url TEXT,
  published INTEGER DEFAULT 1,
  pinned INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_pinned ON news(pinned DESC, created_at DESC);

-- 5. ตารางอัลบั้มภาพกิจกรรม (Gallery Albums)
CREATE TABLE IF NOT EXISTS gallery_albums (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  activity_date TEXT,
  cover_image TEXT NOT NULL,
  images TEXT NOT NULL DEFAULT '[]', -- JSON Array of string URLs
  drive_folder_id TEXT,
  drive_folder_url TEXT,
  author_id TEXT NOT NULL,
  author_name TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON gallery_albums(created_at DESC);

-- 6. ตารางคลังวิดีโอกิจกรรม (Video Gallery)
CREATE TABLE IF NOT EXISTS video_gallery (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  youtube_id TEXT,
  drive_file_id TEXT,
  drive_folder_id TEXT,
  duration TEXT,
  category TEXT,
  published INTEGER DEFAULT 1,
  views INTEGER DEFAULT 0,
  author_id TEXT,
  author_name TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON video_gallery(created_at DESC);

-- 7. ตารางเอกสารเผยแพร่และรายงาน SAR (School Public Documents & SAR Reports)
CREATE TABLE IF NOT EXISTS public_documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('academic', 'budget', 'personnel', 'general', 'sar', 'other')),
  academic_year_be INTEGER NOT NULL,
  pdf_url TEXT NOT NULL,
  pdf_file_name TEXT NOT NULL,
  file_size TEXT,
  source TEXT NOT NULL DEFAULT 'drive',
  drive_file_id TEXT,
  drive_folder_id TEXT,
  published INTEGER DEFAULT 1,
  downloads INTEGER DEFAULT 0,
  author_id TEXT NOT NULL,
  author_name TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_documents_year ON public_documents(academic_year_be DESC, category);

-- 8. ตารางหมวดหมู่ข่าวสาร (Post Categories)
CREATE TABLE IF NOT EXISTS post_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_categories_order ON post_categories(sort_order ASC);

-- 9. ตารางคลังสื่อกลาง (Central Media Library)
CREATE TABLE IF NOT EXISTS media_library (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  size TEXT,
  mime_type TEXT,
  source TEXT DEFAULT 'drive',
  drive_file_id TEXT,
  drive_folder_id TEXT,
  uploaded_at TEXT NOT NULL,
  uploaded_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_media_uploaded ON media_library(uploaded_at DESC);

-- 10. ตารางการตั้งค่าโฟลเดอร์ Google Drive และระบบกลาง (Drive & School Settings)
CREATE TABLE IF NOT EXISTS school_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  central_folder_id TEXT,
  central_folder_name TEXT,
  central_folder_url TEXT,
  shared_drive_name TEXT,
  allow_public_download INTEGER DEFAULT 1,
  enable_video_gallery INTEGER DEFAULT 1,
  department_folders TEXT DEFAULT '[]', -- JSON Array of DriveFolderConfig
  current_academic_year INTEGER,
  available_years TEXT DEFAULT '[]',     -- JSON Array of integers [2567, 2568, ...]
  updated_at TEXT,
  updated_by TEXT
);

-- 11. ตารางสถิติผู้เข้าชมเว็บไซต์ (Site Stats & Page Hit Counter)
CREATE TABLE IF NOT EXISTS site_stats (
  id TEXT PRIMARY KEY DEFAULT 'counter',
  total_visits INTEGER DEFAULT 0,
  today_visits INTEGER DEFAULT 0,
  last_visited_at TEXT,
  last_date TEXT,
  reset_at TEXT,
  reset_by TEXT,
  updated_at TEXT
);

-- 12. ตารางกล่องข้อความติดต่อโรงเรียน (School Inbox - สำหรับผู้อำนวยการ)
CREATE TABLE IF NOT EXISTS inbox_messages (
  id TEXT PRIMARY KEY,
  sender_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'in_progress', 'replied', 'archived')),
  director_notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  replied_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_inbox_created ON inbox_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inbox_status ON inbox_messages(status);

-- 13. ตารางกำหนดสิทธิ์ Super Admin และผู้ดูแลระบบ (System Roles Configuration)
CREATE TABLE IF NOT EXISTS system_roles (
  id TEXT PRIMARY KEY DEFAULT 'roles',
  super_admin_email TEXT NOT NULL DEFAULT 'director@bnr.ac.th',
  admin_emails TEXT DEFAULT '[]',       -- JSON Array of email strings
  updated_at TEXT,
  updated_by TEXT
);

-- 14. ตารางบัญชีผู้ใช้งานระบบ (User Profiles - Google OAuth)
CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,                 -- Google Sub ID หรือ Normalized Email
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  photo_url TEXT,
  role TEXT NOT NULL DEFAULT 'editor' CHECK(role IN ('superadmin', 'admin', 'editor', 'guest')),
  department TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
  created_at TEXT NOT NULL,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 15. ตาราง Session การล็อกอิน (Worker Session Tokens)
CREATE TABLE IF NOT EXISTS user_sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  expires_at INTEGER NOT NULL,          -- Unix timestamp (milliseconds หรือ seconds)
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);

-- 16. ตารางบันทึกประวัติการสำรองและกู้คืนข้อมูล (Backup & Restore Audit Logs)
CREATE TABLE IF NOT EXISTS backup_audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  action TEXT NOT NULL,
  action_label TEXT NOT NULL,
  performed_by_email TEXT NOT NULL,
  performed_by_name TEXT NOT NULL,
  drive_file_id TEXT,
  drive_file_name TEXT,
  status TEXT NOT NULL,
  details TEXT NOT NULL,
  record_count INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_backup_logs_timestamp ON backup_audit_logs(timestamp DESC);

