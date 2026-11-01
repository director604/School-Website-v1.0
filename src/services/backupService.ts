/**
 * Cloudflare D1 Backup & Restore Service
 * บริการสำรองและกู้คืนฐานข้อมูล Cloudflare D1 (15 ตาราง)
 * จัดเก็บไฟล์สำรองข้อมูล JSON บน Google Drive อัตโนมัติ (Google Drive API via GIS OAuth 2.0)
 * ตัดการเชื่อมต่อ Firebase 100% - ไม่กินโควต้า Firebase ใดๆ ทั้งสิ้น
 */

import { getAccessToken, getAuthHeaders } from './googleAuth';
import { 
  extractFolderId, 
  findDriveFolderByName, 
  createDriveFolder, 
  uploadDriveFile, 
  extractDriveFileId, 
  formatFileSize 
} from './driveService';
import { DriveFileItem } from '../types';

export interface BackupMetadata {
  version: string;
  engine: string;
  database: string;
  databaseId: string;
  app: string;
  schoolName: string;
  backupTimestamp: string;
  academicYearBE: number;
  createdByEmail: string;
  createdByName: string;
  totalTables: number;
  totalRecords: number;
}

export interface BackupPayload {
  metadata: BackupMetadata;
  data: {
    school_info?: any;
    staff?: any[];
    board_members?: any[];
    news?: any[];
    gallery_albums?: any[];
    gallery?: any[]; // For backwards compatibility
    video_gallery?: any[];
    public_documents?: any[];
    post_categories?: any[];
    media_library?: any[];
    school_settings?: any;
    site_stats?: any;
    inbox_messages?: any[];
    system_roles?: any;
    users?: any[];
    backup_audit_logs?: any[];
  };
}

export interface BackupAuditLog {
  id?: string;
  timestamp: string;
  action: 'BACKUP_CREATE' | 'BACKUP_RESTORE' | 'BACKUP_DELETE' | 'SYSTEM_INIT';
  actionLabel: string;
  performedByEmail: string;
  performedByName: string;
  driveFileId?: string;
  driveFileName?: string;
  status: 'SUCCESS' | 'FAILED';
  details: string;
  recordCount?: number;
}

const BACKUP_FOLDER_NAME = '00_ระบบสำรองข้อมูล_โรงเรียนบ้านนารี';
const D1_DB_NAME = 'bannaree-db';
const D1_DB_ID = '56fe1149-9b8f-4ef9-8e8e-2d3d7bda91f4';

/**
 * Find or auto-create the backup folder on Google Drive
 */
export async function findOrCreateBackupFolder(centralFolderId: string): Promise<{ id: string; name: string; webViewLink?: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาลงชื่อเข้าใช้ Google Drive ก่อนดำเนินการ');

  const cleanCentralId = extractFolderId(centralFolderId);

  if (cleanCentralId) {
    const existing = await findDriveFolderByName(cleanCentralId, BACKUP_FOLDER_NAME);
    if (existing) {
      return { 
        id: existing.id, 
        name: existing.name, 
        webViewLink: existing.webViewLink || `https://drive.google.com/drive/folders/${existing.id}` 
      };
    }

    // Auto create inside central folder
    const created = await createDriveFolder(cleanCentralId, BACKUP_FOLDER_NAME);
    return { 
      id: created.id, 
      name: created.name, 
      webViewLink: created.webViewLink || `https://drive.google.com/drive/folders/${created.id}` 
    };
  }

  // Fallback to Drive Root
  const globalExisting = await findDriveFolderByName('root', BACKUP_FOLDER_NAME);
  if (globalExisting) {
    return { 
      id: globalExisting.id, 
      name: globalExisting.name, 
      webViewLink: globalExisting.webViewLink || `https://drive.google.com/drive/folders/${globalExisting.id}` 
    };
  }

  const createdRoot = await createDriveFolder('root', BACKUP_FOLDER_NAME);
  return { 
    id: createdRoot.id, 
    name: createdRoot.name, 
    webViewLink: createdRoot.webViewLink || `https://drive.google.com/drive/folders/${createdRoot.id}` 
  };
}

/**
 * Fetch list of JSON backup files from Google Drive backup folder
 */
export async function fetchDriveBackupsList(centralFolderId: string): Promise<DriveFileItem[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาลงชื่อเข้าใช้ Google Drive เพื่อดูรายการสำรองข้อมูล');

  const backupFolder = await findOrCreateBackupFolder(centralFolderId);
  const q = `'${backupFolder.id}' in parents and (name contains 'backup_bannaree_' or name contains '.json') and trashed = false`;
  const fields = 'files(id,name,mimeType,webViewLink,webContentLink,size,modifiedTime,iconLink)';
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=50&q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&orderBy=createdTime desc&supportsAllDrives=true&includeItemsFromAllDrives=true`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Drive API error ${response.status}`);
  }

  const data = await response.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    webViewLink: f.webViewLink,
    webContentLink: f.webContentLink,
    size: f.size ? formatFileSize(parseInt(f.size, 10)) : 'ไม่ระบุ',
    modifiedTime: f.modifiedTime
  }));
}

/**
 * Download raw JSON file content from Google Drive
 */
export async function downloadDriveBackupJSON(fileId: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาลงชื่อเข้าใช้ Google Drive ก่อนกู้คืนข้อมูล');

  const cleanId = extractDriveFileId(fileId);
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${cleanId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `ไม่สามารถดาวน์โหลดไฟล์จาก Google Drive ได้ (${response.status})`);
  }

  return await response.text();
}

/**
 * Helper to fetch complete export data from Cloudflare D1
 */
export async function exportD1Database(userEmail: string, userName: string, academicYearBE: number = 2569): Promise<BackupPayload> {
  // First try the dedicated /api/backup/export endpoint
  try {
    const res = await fetch('/api/backup/export', {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const payload = await res.json();
      if (payload && payload.data) {
        return payload as BackupPayload;
      }
    }
  } catch (e) {
    console.warn('Dedicated /api/backup/export fallback, querying D1 data endpoints directly');
  }

  // Fallback: Query all D1 tables individually via /api/data/*
  const tables = [
    'school_info',
    'staff',
    'board_members',
    'news',
    'gallery_albums',
    'video_gallery',
    'public_documents',
    'post_categories',
    'media_library',
    'school_settings',
    'site_stats',
    'inbox_messages',
    'system_roles',
    'users',
    'backup_audit_logs',
  ];

  const backupData: Record<string, any> = {};
  let totalRecords = 0;

  for (const table of tables) {
    try {
      const res = await fetch(`/api/data/${table}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const rows = await res.json();
        if (table === 'school_info' || table === 'school_settings' || table === 'site_stats' || table === 'system_roles') {
          backupData[table] = Array.isArray(rows) ? rows[0] || null : rows;
          if (backupData[table]) totalRecords++;
        } else {
          backupData[table] = Array.isArray(rows) ? rows : [];
          totalRecords += (backupData[table] as any[]).length;
        }
      }
    } catch {
      backupData[table] = null;
    }
  }

  const nowIso = new Date().toISOString();
  return {
    metadata: {
      version: '3.0-D1',
      engine: 'Cloudflare D1 (SQLite 3)',
      database: D1_DB_NAME,
      databaseId: D1_DB_ID,
      app: 'Ban Naree School Web Platform',
      schoolName: 'โรงเรียนบ้านนารี (สพป.ชัยภูมิ เขต 1)',
      backupTimestamp: nowIso,
      academicYearBE,
      createdByEmail: userEmail,
      createdByName: userName,
      totalTables: tables.length,
      totalRecords,
    },
    data: backupData,
  };
}

/**
 * Create full backup JSON from Cloudflare D1 and save directly to Google Drive + log audit record in D1
 */
export async function createFullBackupToDrive(
  centralFolderId: string,
  userEmail: string,
  userName: string,
  academicYearBE: number = 2569
): Promise<{ driveFile: DriveFileItem; totalRecords: number }> {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาลงชื่อเข้าใช้ Google Drive ก่อนทำการสำรองข้อมูล');

  // 1. Fetch all data from Cloudflare D1
  const payload = await exportD1Database(userEmail, userName, academicYearBE);
  const totalRecords = payload.metadata?.totalRecords || 0;

  const nowIso = new Date().toISOString();
  const dateFormatted = nowIso.split('T')[0];
  const timeFormatted = nowIso.split('T')[1].slice(0, 5).replace(':', '');

  // 2. Build JSON File Blob
  const jsonStr = JSON.stringify(payload, null, 2);
  const fileName = `backup_bannaree_d1_${dateFormatted}_${timeFormatted}.json`;
  const fileBlob = new Blob([jsonStr], { type: 'application/json' });
  const fileObj = new File([fileBlob], fileName, { type: 'application/json' });

  // 3. Resolve / Create Backup Folder in Drive
  const backupFolder = await findOrCreateBackupFolder(centralFolderId);

  // 4. Upload File to Google Drive
  const uploadedFile = await uploadDriveFile(backupFolder.id, fileObj);

  // 5. Save Audit Log to Cloudflare D1
  await recordBackupAuditLog({
    timestamp: nowIso,
    action: 'BACKUP_CREATE',
    actionLabel: 'สำรองข้อมูล Cloudflare D1 สู่ Google Drive',
    performedByEmail: userEmail,
    performedByName: userName,
    driveFileId: uploadedFile.id,
    driveFileName: uploadedFile.name,
    status: 'SUCCESS',
    details: `สำรองข้อมูล Cloudflare D1 (${D1_DB_NAME}) สำเร็จ รวมทั้งสิ้น ${totalRecords} รายการข้อมูล`,
    recordCount: totalRecords
  });

  return { driveFile: uploadedFile, totalRecords };
}

/**
 * Restore Cloudflare D1 data from a parsed BackupPayload object
 */
export async function restoreBackupFromPayload(
  payload: BackupPayload,
  userEmail: string,
  userName: string,
  sourceLabel: string = 'Google Drive'
): Promise<{ totalRestored: number; metadata?: BackupMetadata }> {
  if (!payload || !payload.data) {
    throw new Error('ไฟล์สำรองข้อมูลไม่มีส่วนประกอบ "data" ที่ถูกต้อง');
  }

  // 1. Send payload to Cloudflare D1 restore endpoint
  let totalRestored = 0;
  try {
    const res = await fetch('/api/backup/restore', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ payload }),
    });

    if (res.ok) {
      const result = await res.json();
      totalRestored = result.totalRestored || 0;
    } else {
      throw new Error(`API Restore HTTP ${res.status}`);
    }
  } catch (err: any) {
    // Fallback: Restore directly through /api/data/* endpoints
    const data = payload.data;
    if (data.school_info) {
      await fetch('/api/data/school_info', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data.school_info),
      }).catch(() => {});
      totalRestored++;
    }

    if (data.school_settings) {
      await fetch('/api/data/school_settings', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data.school_settings),
      }).catch(() => {});
      totalRestored++;
    }

    const multi = [
      { key: 'staff', table: 'staff' },
      { key: 'board_members', table: 'board_members' },
      { key: 'news', table: 'news' },
      { key: 'gallery_albums', table: 'gallery_albums' },
      { key: 'gallery', table: 'gallery_albums' },
      { key: 'video_gallery', table: 'video_gallery' },
      { key: 'public_documents', table: 'public_documents' },
      { key: 'post_categories', table: 'post_categories' },
      { key: 'media_library', table: 'media_library' },
      { key: 'inbox_messages', table: 'inbox_messages' },
    ];

    for (const { key, table } of multi) {
      const items = (data as any)[key];
      if (Array.isArray(items)) {
        for (const item of items) {
          await fetch(`/api/data/${table}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(item),
          }).catch(() => {});
          totalRestored++;
        }
      }
    }
  }

  // 2. Save Restore Audit Log to Cloudflare D1
  await recordBackupAuditLog({
    timestamp: new Date().toISOString(),
    action: 'BACKUP_RESTORE',
    actionLabel: `กู้คืนข้อมูลสู่ Cloudflare D1 (${sourceLabel})`,
    performedByEmail: userEmail,
    performedByName: userName,
    status: 'SUCCESS',
    details: `กู้คืนข้อมูลเข้าสู่ Cloudflare D1 (${D1_DB_NAME}) สำเร็จ รวมทั้งสิ้น ${totalRestored} รายการข้อมูล`,
    recordCount: totalRestored
  });

  return { totalRestored, metadata: payload.metadata };
}

/**
 * Restore Cloudflare D1 data from Google Drive JSON backup file
 */
export async function restoreBackupFromDrive(
  fileId: string,
  userEmail: string,
  userName: string
): Promise<{ totalRestored: number; metadata?: BackupMetadata }> {
  // 1. Download JSON content from Google Drive
  const jsonContent = await downloadDriveBackupJSON(fileId);

  let payload: BackupPayload;
  try {
    payload = JSON.parse(jsonContent);
  } catch (e) {
    throw new Error('โครงสร้างไฟล์ JSON สำรองข้อมูลชำรุดหรือไม่ถูกต้อง');
  }

  return await restoreBackupFromPayload(payload, userEmail, userName, 'Google Drive');
}

/**
 * Record Backup Audit Log to Cloudflare D1 (`backup_audit_logs`)
 */
export async function recordBackupAuditLog(logItem: BackupAuditLog): Promise<void> {
  try {
    await fetch('/api/backup/logs', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(logItem),
    });
  } catch (err) {
    console.warn('Could not record backup audit log to D1:', err);
  }
}

/**
 * Fetch Audit Logs from Cloudflare D1
 */
export async function fetchBackupAuditLogs(): Promise<BackupAuditLog[]> {
  try {
    const res = await fetch('/api/backup/logs', {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const logs = await res.json();
      return Array.isArray(logs) ? logs : [];
    }
    return [];
  } catch (err) {
    console.warn('Error fetching backup audit logs from D1:', err);
    return [];
  }
}
