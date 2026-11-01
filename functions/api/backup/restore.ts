import { Env, jsonResponse, errorResponse, corsHeaders, authenticateUser } from '../_utils';

/**
 * POST /api/backup/restore
 * Cloudflare Pages Functions - D1 Database Full Restore
 * กู้คืนข้อมูลจาก JSON payload สู่ Cloudflare D1
 */
export const onRequestOptions = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestPost = async (context: { env: Env; request: Request }) => {
  const db = context.env.DB;
  if (!db) {
    return errorResponse('Cloudflare D1 Binding (env.DB) is not attached', 500);
  }

  // Check admin rights if user session is present
  const user = await authenticateUser(context.request, context.env);
  if (user && user.role !== 'admin' && user.role !== 'superadmin') {
    return errorResponse('คุณไม่มีสิทธิ์ระดับผู้ดูแลระบบในการกู้คืนฐานข้อมูล', 403);
  }

  try {
    const body = await context.request.json() as any;
    const payload = body?.payload;

    if (!payload || !payload.data) {
      return errorResponse('โครงสร้างไฟล์สำรองข้อมูลชำรุดหรือไม่ถูกต้อง', 400);
    }

    const data = payload.data;
    let totalRestored = 0;

    // Single record tables
    if (data.school_info && typeof data.school_info === 'object') {
      const info = data.school_info;
      await db.prepare(
        `INSERT INTO school_info (id, school_name, affiliation, address, phone, email, updated_at)
         VALUES ('main', ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET 
           school_name = excluded.school_name,
           affiliation = excluded.affiliation,
           address = excluded.address,
           phone = excluded.phone,
           email = excluded.email,
           updated_at = datetime('now')`
      ).bind(
        info.schoolName || info.school_name || 'โรงเรียนบ้านนารี',
        info.affiliation || '',
        info.address || '',
        info.phone || '',
        info.email || ''
      ).run();
      totalRestored++;
    }

    if (data.school_settings && typeof data.school_settings === 'object') {
      const settings = data.school_settings;
      await db.prepare(
        `INSERT INTO school_settings (id, central_folder_id, central_folder_name, updated_at)
         VALUES ('main', ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           central_folder_id = excluded.central_folder_id,
           central_folder_name = excluded.central_folder_name,
           updated_at = datetime('now')`
      ).bind(
        settings.centralFolderId || settings.central_folder_id || '',
        settings.centralFolderName || settings.central_folder_name || ''
      ).run();
      totalRestored++;
    }

    // Multi-row collections: staff
    if (Array.isArray(data.staff)) {
      for (const item of data.staff) {
        if (!item.id || !item.name) continue;
        await db.prepare(
          `INSERT INTO staff (id, prefix, name, position, academic_rank, department, role_category, email, phone, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             position = excluded.position,
             department = excluded.department,
             role_category = excluded.role_category,
             updated_at = datetime('now')`
        ).bind(
          item.id,
          item.prefix || '',
          item.name,
          item.position || 'ครู',
          item.academicRank || item.academic_rank || '',
          item.department || 'กลุ่มสาระการเรียนรู้',
          item.roleCategory || item.role_category || 'teacher',
          item.email || '',
          item.phone || ''
        ).run();
        totalRestored++;
      }
    }

    // Multi-row collections: news
    if (Array.isArray(data.news)) {
      for (const item of data.news) {
        if (!item.id || !item.title) continue;
        await db.prepare(
          `INSERT INTO news (id, title, category, department, summary, content, cover_image, author_name, author_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT(id) DO UPDATE SET
             title = excluded.title,
             category = excluded.category,
             content = excluded.content,
             cover_image = excluded.cover_image,
             updated_at = datetime('now')`
        ).bind(
          item.id,
          item.title,
          item.category || 'ข่าวประชาสัมพันธ์',
          item.department || 'ฝ่ายบริหารทั่วไป',
          item.summary || '',
          item.content || item.title,
          item.coverImage || item.cover_image || '',
          item.authorName || item.author_name || 'Admin',
          item.authorId || item.author_id || 'system',
          item.createdAt || item.created_at || new Date().toISOString()
        ).run();
        totalRestored++;
      }
    }

    // Multi-row collections: public_documents
    if (Array.isArray(data.public_documents)) {
      for (const item of data.public_documents) {
        if (!item.id || !item.title) continue;
        await db.prepare(
          `INSERT INTO public_documents (id, title, category, academic_year_be, pdf_url, pdf_file_name, author_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             title = excluded.title,
             category = excluded.category,
             pdf_url = excluded.pdf_url,
             updated_at = datetime('now')`
        ).bind(
          item.id,
          item.title,
          item.category || 'academic',
          item.academicYearBE || item.academic_year_be || 2568,
          item.pdfUrl || item.pdf_url || '',
          item.pdfFileName || item.pdf_file_name || 'document.pdf',
          item.authorId || item.author_id || 'system',
          item.createdAt || item.created_at || new Date().toISOString()
        ).run();
        totalRestored++;
      }
    }

    return jsonResponse({
      success: true,
      totalRestored,
      message: `กู้คืนข้อมูลเข้าสู่ Cloudflare D1 เรียบร้อยแล้ว (${totalRestored} รายการ)`,
    });
  } catch (error: any) {
    return errorResponse('Restore failed: ' + error?.message, 500);
  }
};
