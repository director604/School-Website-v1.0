/**
 * Endpoint: POST /api/seed
 * นำเข้าข้อมูลเริ่มต้นของโรงเรียนบ้านนารี (ข้อมูลโรงเรียน, ครู, กรรมการ, ข่าว, วิดีโอ, เอกสาร)
 * ลงสู่ Cloudflare D1 ในกรณีที่ตารางยังว่างอยู่
 */

import { Env, jsonResponse, errorResponse, corsHeaders } from './_utils';
import {
  initialSchoolInfo,
  initialStaff,
  initialBoardMembers,
  initialNews,
  initialGallery,
  initialVideos,
  initialPublicDocuments,
  initialCategories,
  initialDriveSettings,
} from '../../src/data/initialData';

export const onRequestOptions = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestPost = async (context: { env: Env }) => {
  const { env } = context;

  try {
    // 1. ตรวจสอบว่ามีข้อมูล school_info หรือยัง
    const existing = await env.DB.prepare('SELECT id FROM school_info WHERE id = ?')
      .bind('main')
      .first();

    if (existing) {
      return jsonResponse({ message: 'ฐานข้อมูลมีข้อมูลเริ่มต้นอยู่แล้ว', seeded: false });
    }

    console.log('Seeding initial data into Cloudflare D1...');

    // 2. Seed School Info
    await env.DB.prepare(
      `INSERT INTO school_info (
        id, school_name, school_name_en, school_id_code, affiliation, motto, philosophy, vision,
        mission, goals, history, identity, uniqueness, colors, tree, director_name, director_position,
        director_rank, director_quote_title, director_message, director_image_url, hero_image_url,
        hero_tagline, hero_badge_title, hero_badge_subtitle, safety_stat_percent, safety_stat_label,
        urgent_ticker_enabled, urgent_ticker_label, urgent_ticker_text, urgent_ticker_link,
        pillars_title, pillars_subtitle, educational_pillars, governance_title, governance_subtitle,
        governance_desc, governance_cards, quick_links_title, quick_links_subtitle, quick_links,
        contact_strip_title, contact_strip_desc, contact_strip_button_drive, contact_strip_button_map,
        video_section_title, video_section_subtitle, video_section_max_items, sections_visibility,
        address, phone, email, facebook_url, google_map_embed_url, student_count, teacher_count, classroom_count, updated_at
      ) VALUES (
        'main', ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`
    )
      .bind(
        initialSchoolInfo.schoolName,
        initialSchoolInfo.schoolNameEn,
        initialSchoolInfo.schoolIdCode,
        initialSchoolInfo.affiliation,
        initialSchoolInfo.motto,
        initialSchoolInfo.philosophy,
        initialSchoolInfo.vision,
        JSON.stringify(initialSchoolInfo.mission || []),
        JSON.stringify(initialSchoolInfo.goals || []),
        initialSchoolInfo.history,
        initialSchoolInfo.identity,
        initialSchoolInfo.uniqueness,
        initialSchoolInfo.colors,
        initialSchoolInfo.tree,
        initialSchoolInfo.directorName,
        initialSchoolInfo.directorPosition,
        initialSchoolInfo.directorRank,
        initialSchoolInfo.directorQuoteTitle || '',
        initialSchoolInfo.directorMessage,
        initialSchoolInfo.directorImageUrl,
        initialSchoolInfo.heroImageUrl || '',
        initialSchoolInfo.heroTagline || '',
        initialSchoolInfo.heroBadgeTitle || '',
        initialSchoolInfo.heroBadgeSubtitle || '',
        initialSchoolInfo.safetyStatPercent || '100%',
        initialSchoolInfo.safetyStatLabel || 'สถานศึกษาปลอดภัยและสุขอนามัย',
        initialSchoolInfo.urgentTickerEnabled ? 1 : 0,
        initialSchoolInfo.urgentTickerLabel || '',
        initialSchoolInfo.urgentTickerText || '',
        initialSchoolInfo.urgentTickerLink || '',
        initialSchoolInfo.pillarsTitle || '',
        initialSchoolInfo.pillarsSubtitle || '',
        JSON.stringify(initialSchoolInfo.educationalPillars || []),
        initialSchoolInfo.governanceTitle || '',
        initialSchoolInfo.governanceSubtitle || '',
        initialSchoolInfo.governanceDesc || '',
        JSON.stringify(initialSchoolInfo.governanceCards || []),
        initialSchoolInfo.quickLinksTitle || '',
        initialSchoolInfo.quickLinksSubtitle || '',
        JSON.stringify(initialSchoolInfo.quickLinks || []),
        initialSchoolInfo.contactStripTitle || '',
        initialSchoolInfo.contactStripDesc || '',
        initialSchoolInfo.contactStripButtonDrive || '',
        initialSchoolInfo.contactStripButtonMap || '',
        initialSchoolInfo.videoSectionTitle || '',
        initialSchoolInfo.videoSectionSubtitle || '',
        initialSchoolInfo.videoSectionMaxItems || 6,
        JSON.stringify(initialSchoolInfo.sectionsVisibility || {}),
        initialSchoolInfo.address,
        initialSchoolInfo.phone,
        initialSchoolInfo.email,
        initialSchoolInfo.facebookUrl || '',
        initialSchoolInfo.googleMapEmbedUrl || '',
        initialSchoolInfo.studentCount || 0,
        initialSchoolInfo.teacherCount || 0,
        initialSchoolInfo.classroomCount || 0,
        new Date().toISOString()
      )
      .run();

    // 3. Seed Staff Members
    for (const s of initialStaff) {
      await env.DB.prepare(
        `INSERT OR REPLACE INTO staff (id, prefix, name, position, academic_rank, department, role_category, email, phone, education, image_url, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          s.id,
          s.prefix,
          s.name,
          s.position,
          s.academicRank || '',
          s.department,
          s.roleCategory,
          s.email || '',
          s.phone || '',
          s.education || '',
          s.imageUrl || '',
          s.order || 0,
          new Date().toISOString()
        )
        .run();
    }

    // 4. Seed Board Members
    for (const b of initialBoardMembers) {
      await env.DB.prepare(
        `INSERT OR REPLACE INTO board_members (id, name, board_type, role_in_board, representation, occupation, phone, image_url, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          b.id,
          b.name,
          b.boardType,
          b.roleInBoard,
          b.representation || '',
          b.occupation || '',
          b.phone || '',
          b.imageUrl || '',
          b.order || 0,
          new Date().toISOString()
        )
        .run();
    }

    // 5. Seed News
    for (const n of initialNews) {
      await env.DB.prepare(
        `INSERT OR REPLACE INTO news (id, title, category, department, summary, content, cover_image, author_name, author_id, drive_file_id, drive_file_name, drive_file_url, published, pinned, views, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          n.id,
          n.title,
          n.category,
          n.department || 'academic',
          n.summary,
          n.content,
          n.coverImage || '',
          n.authorName,
          n.authorId || 'director@bnr.ac.th',
          n.driveFileId || '',
          n.driveFileName || '',
          n.driveFileUrl || '',
          n.published ? 1 : 0,
          n.pinned ? 1 : 0,
          n.views || 0,
          n.createdAt,
          new Date().toISOString()
        )
        .run();
    }

    // 6. Seed Gallery Albums
    for (const g of initialGallery) {
      await env.DB.prepare(
        `INSERT OR REPLACE INTO gallery_albums (id, title, description, activity_date, cover_image, images, drive_folder_id, drive_folder_url, author_id, author_name, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          g.id,
          g.title,
          g.description,
          g.activityDate,
          g.coverImage,
          JSON.stringify(g.images || []),
          g.driveFolderId || '',
          g.driveFolderUrl || '',
          g.authorId || 'director@bnr.ac.th',
          g.authorName || 'ฝ่ายบริหารและประชาสัมพันธ์',
          g.createdAt,
          new Date().toISOString()
        )
        .run();
    }

    // 7. Seed Videos
    for (const v of initialVideos) {
      await env.DB.prepare(
        `INSERT OR REPLACE INTO video_gallery (id, title, description, video_url, thumbnail_url, youtube_id, drive_file_id, drive_folder_id, duration, category, published, views, author_id, author_name, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          v.id,
          v.title,
          v.description || '',
          v.videoUrl,
          v.thumbnailUrl || '',
          v.youtubeId || '',
          v.driveFileId || '',
          v.driveFolderId || '',
          v.duration || '',
          v.category || 'กิจกรรมโรงเรียน',
          v.published ? 1 : 0,
          v.views || 0,
          v.authorId || 'director@bnr.ac.th',
          v.authorName || 'ฝ่ายบริหาร',
          v.createdAt,
          new Date().toISOString()
        )
        .run();
    }

    // 8. Seed Public Documents
    for (const p of initialPublicDocuments) {
      await env.DB.prepare(
        `INSERT OR REPLACE INTO public_documents (id, title, category, academic_year_be, pdf_url, pdf_file_name, file_size, source, drive_file_id, drive_folder_id, published, downloads, author_id, author_name, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          p.id,
          p.title,
          p.category,
          p.academicYearBE,
          p.pdfUrl,
          p.pdfFileName,
          p.fileSize || '1.5 MB',
          p.source || 'drive',
          p.driveFileId || '',
          p.driveFolderId || '',
          p.published ? 1 : 0,
          p.downloads || 0,
          p.authorId || 'director@bnr.ac.th',
          p.authorName || 'ฝ่ายบริหารงานวิชาการ',
          p.createdAt,
          new Date().toISOString()
        )
        .run();
    }

    // 9. Seed Categories
    for (const c of initialCategories) {
      await env.DB.prepare(
        `INSERT OR REPLACE INTO post_categories (id, name, slug, description, color, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(c.id, c.name, c.slug, c.description || '', c.color || '#3b82f6', c.order || 0)
        .run();
    }

    // 10. Seed Drive Settings & System Roles
    await env.DB.prepare(
      `INSERT OR REPLACE INTO school_settings (id, central_folder_id, central_folder_name, central_folder_url, shared_drive_name, allow_public_download, enable_video_gallery, department_folders, current_academic_year, available_years, updated_at, updated_by)
       VALUES ('main', ?, ?, ?, ?, 1, 1, ?, 2568, ?, ?, 'director@bnr.ac.th')`
    )
      .bind(
        initialDriveSettings.centralFolderId,
        initialDriveSettings.centralFolderName,
        initialDriveSettings.centralFolderUrl,
        initialDriveSettings.sharedDriveName || '',
        JSON.stringify(initialDriveSettings.departmentFolders || []),
        JSON.stringify(initialDriveSettings.availableYears || [2568, 2567, 2566]),
        new Date().toISOString()
      )
      .run();

    await env.DB.prepare(
      `INSERT OR REPLACE INTO system_roles (id, super_admin_email, admin_emails, updated_at, updated_by)
       VALUES ('roles', 'director@bnr.ac.th', '["director@bnr.ac.th", "engine@bnr.ac.th"]', ?, 'system')`
    )
      .bind(new Date().toISOString())
      .run();

    return jsonResponse({ success: true, message: 'นำเข้าข้อมูลเริ่มต้นสู่ Cloudflare D1 สำเร็จเรียบร้อย', seeded: true });
  } catch (error: any) {
    console.error('Seed error:', error);
    return errorResponse('เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ' + error?.message, 500);
  }
};
