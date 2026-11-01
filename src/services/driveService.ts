import { DriveFileItem, SchoolDepartment, SCHOOL_DEPARTMENTS, DriveFolderConfig } from '../types';
import { getAccessToken } from '../firebase';

function formatDriveErrorMessage(errorData: any, status: number): string {
  const message = errorData?.error?.message || `HTTP error ${status}`;
  if (status === 403 && (message.toLowerCase().includes('insufficient') || message.toLowerCase().includes('scope'))) {
    return 'สิทธิ์การเข้าถึง Google Drive ไม่เพียงพอ (Insufficient scopes) — กรุณากดปุ่ม "เชื่อมต่อสิทธิ์ Google Drive" เพื่ออนุญาตสิทธิ์';
  }
  if (status === 401) {
    return 'โทเคน Google Drive หมดอายุหรือไม่ถูกต้อง — กรุณากดปุ่ม "เชื่อมต่อสิทธิ์ Google Drive" เพื่อต่ออายุ';
  }
  return `Google Drive API: ${message}`;
}

export async function fetchDriveFiles(searchQuery?: string, folderId?: string): Promise<DriveFileItem[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('กรุณาลงชื่อเข้าใช้ด้วย Google Account เพื่อเชื่อมต่อ Google Drive');
  }

  let q = "trashed = false";
  if (folderId && folderId.trim() && !folderId.startsWith('http')) {
    // If querying specific folder
    q += ` and '${folderId.trim()}' in parents`;
  }

  if (searchQuery && searchQuery.trim()) {
    q += ` and name contains '${searchQuery.trim().replace(/'/g, "\\'")}'`;
  }

  const fields = 'files(id,name,mimeType,webViewLink,webContentLink,size,modifiedTime,thumbnailLink,iconLink)';
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=50&q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&orderBy=modifiedTime desc&supportsAllDrives=true&includeItemsFromAllDrives=true`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const formattedMsg = formatDriveErrorMessage(errorData, response.status);

      // Auth errors must not be swallowed or retried
      if (response.status === 403 || response.status === 401) {
        throw new Error(formattedMsg);
      }

      // If querying a specific folder fails (e.g. 404), return empty array to maintain strict path isolation
      if (folderId) {
        return [];
      }
      throw new Error(formattedMsg);
    }

    const data = await response.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      iconLink: f.iconLink,
      webViewLink: f.webViewLink,
      webContentLink: f.webContentLink,
      size: f.size ? formatFileSize(parseInt(f.size, 10)) : undefined,
      modifiedTime: f.modifiedTime,
      thumbnailLink: f.thumbnailLink
    }));
  } catch (err: any) {
    if (folderId && !err.message?.includes('Insufficient') && !err.message?.includes('สิทธิ์') && !err.message?.includes('หมดอายุ')) {
      return [];
    }
    throw err;
  }
}

export async function fetchDriveFolderImages(folderInput: string): Promise<{ id: string; name: string; url: string; thumbnailUrl: string }[]> {
  const cleanId = extractFolderId(folderInput);
  if (!cleanId) {
    throw new Error('กรุณาระบุลิงก์หรือรหัสโฟลเดอร์ Google Drive');
  }

  const token = await getAccessToken();
  if (!token) {
    throw new Error('กรุณาลงชื่อเข้าใช้ด้วย Google Account ก่อนดึงรูปภาพจาก Google Drive');
  }

  const q = `'${cleanId}' in parents and mimeType contains 'image/' and trashed = false`;
  const fields = 'files(id,name,mimeType,thumbnailLink,webContentLink,webViewLink)';
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=100&q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&orderBy=createdTime asc&supportsAllDrives=true&includeItemsFromAllDrives=true`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error?.message || `HTTP ${response.status}`;
      throw new Error(`ไม่สามารถเข้าถึงโฟลเดอร์ Google Drive ได้: ${message} (กรุณาตรวจสอบว่าโฟลเดอร์แชร์สิทธิ์แล้ว)`);
    }

    const data = await response.json();
    const files = data.files || [];

    if (files.length === 0) {
      return [];
    }

    return files.map((f: any) => ({
      id: f.id,
      name: f.name,
      url: `https://lh3.googleusercontent.com/d/${f.id}=w1600`,
      thumbnailUrl: f.thumbnailLink || `https://drive.google.com/thumbnail?id=${f.id}&sz=w400`
    }));
  } catch (err: any) {
    console.error('Error fetching drive folder images:', err);
    throw err;
  }
}


export interface DriveFolderDetails {
  valid: boolean;
  id?: string;
  name?: string;
  webViewLink?: string;
  canAddChildren?: boolean;
  canDeleteChildren?: boolean;
  owners?: { displayName?: string; emailAddress?: string }[];
  error?: string;
}

export async function validateDriveFolder(folderId: string): Promise<DriveFolderDetails> {
  const token = await getAccessToken();
  if (!token) {
    return { valid: false, error: 'กรุณาเข้าสู่ระบบ Google Account ก่อนทดสอบ' };
  }

  try {
    const cleanId = extractFolderId(folderId);
    if (!cleanId) {
      return { valid: false, error: 'ไม่พบ Folder ID ที่ถูกต้อง' };
    }

    const url = `https://www.googleapis.com/drive/v3/files/${cleanId}?fields=id,name,mimeType,webViewLink,capabilities,owners`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { valid: false, error: formatDriveErrorMessage(err, response.status) };
    }

    const data = await response.json();
    return {
      valid: true,
      id: data.id,
      name: data.name,
      webViewLink: data.webViewLink,
      canAddChildren: data.capabilities?.canAddChildren,
      canDeleteChildren: data.capabilities?.canDeleteChildren,
      owners: data.owners
    };
  } catch (err: any) {
    return { valid: false, error: err.message || 'ไม่สามารถตรวจสอบโฟลเดอร์ได้' };
  }
}

export function extractFolderId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Check if user pasted a full Google Drive URL
  const match = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }
  return trimmed;
}

export function extractDriveFileId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Match /file/d/FILE_ID
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) return fileMatch[1];
  // Match id=FILE_ID
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];
  // Match /folders/FOLDER_ID
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) return folderMatch[1];
  return trimmed;
}

export async function uploadDriveFile(folderId: string, file: File): Promise<DriveFileItem> {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาลงชื่อเข้าใช้ Google Drive ก่อนอัปโหลดไฟล์');
  
  const cleanId = extractFolderId(folderId);
  if (!cleanId) throw new Error('ไม่พบรหัสโฟลเดอร์ปลายทาง');

  const boundary = '-------bannaree_boundary_' + Date.now();
  const metadata = {
    name: file.name,
    parents: [cleanId]
  };

  const metadataPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const fileHeaderPart = `--${boundary}\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;
  const endPart = `\r\n--${boundary}--`;

  const bodyBlob = new Blob([metadataPart, fileHeaderPart, file, endPart]);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,size,modifiedTime,thumbnailLink,iconLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: bodyBlob
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(formatDriveErrorMessage(errorData, response.status));
  }

  const f = await response.json();
  return {
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    iconLink: f.iconLink,
    webViewLink: f.webViewLink,
    webContentLink: f.webContentLink,
    size: f.size ? formatFileSize(parseInt(f.size, 10)) : undefined,
    modifiedTime: f.modifiedTime,
    thumbnailLink: f.thumbnailLink
  };
}

export async function updateDriveFileName(fileId: string, newName: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาลงชื่อเข้าใช้ Google Drive ก่อนแก้ไขชื่อไฟล์');

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: newName.trim() })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(formatDriveErrorMessage(errorData, response.status));
  }
}

export async function deleteDriveFile(fileId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('ไม่พบ Access Token สำหรับลบไฟล์');
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(formatDriveErrorMessage(errorData, response.status));
  }
}

export async function createDriveFolder(parentFolderId: string, folderName: string): Promise<DriveFileItem> {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาลงชื่อเข้าใช้ Google Drive ก่อนสร้างโฟลเดอร์');

  const cleanId = extractFolderId(parentFolderId);
  if (!cleanId) throw new Error('ไม่พบรหัสโฟลเดอร์ปลายทาง');

  const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,webViewLink,webContentLink,modifiedTime', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName.trim(),
      mimeType: 'application/vnd.google-apps.folder',
      parents: [cleanId]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(formatDriveErrorMessage(errorData, response.status));
  }

  const f = await response.json();
  return {
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    webViewLink: f.webViewLink,
    modifiedTime: f.modifiedTime
  };
}

export async function findDriveFolderByName(parentFolderId: string, name: string): Promise<DriveFileItem | null> {
  const token = await getAccessToken();
  if (!token) return null;
  const cleanId = extractFolderId(parentFolderId);
  if (!cleanId) return null;

  const q = `'${cleanId}' in parents and name = '${name.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,webViewLink,modifiedTime)&pageSize=1`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.files?.[0] || null;
  } catch {
    return null;
  }
}

export function getCurrentAcademicYearBE(): number {
  const now = new Date();
  const year = now.getFullYear();
  return year + 543;
}

export interface AcademicYearSubfolderInfo {
  name: string;
  category: 'academic' | 'budget' | 'personnel' | 'general' | 'gallery';
  description: string;
}

export const STANDARD_ACADEMIC_SUBFOLDERS: AcademicYearSubfolderInfo[] = [
  {
    name: '01_งานบริหารวิชาการ',
    category: 'academic',
    description: 'หลักสูตรสถานศึกษา แผนการจัดการเรียนรู้ สื่อ นวัตกรรม และงานวัดผล'
  },
  {
    name: '02_งานบริหารงบประมาณและพัสดุ',
    category: 'budget',
    description: 'แผนปฏิบัติการประจำปี ประกาศจัดซื้อจัดจ้าง และงานบัญชีพัสดุ'
  },
  {
    name: '03_งานบริหารงานบุคคล',
    category: 'personnel',
    description: 'คำสั่งโรงเรียน การประเมินผลงาน สถิติวันลา และสวัสดิการครู'
  },
  {
    name: '04_งานบริหารทั่วไป',
    category: 'general',
    description: 'ข้อมูลสารสนเทศพื้นฐาน ระเบียบการรับนักเรียน และงานอาคารสถานที่'
  },
  {
    name: '05_คลังภาพกิจกรรมโรงเรียน',
    category: 'gallery',
    description: 'ภาพถ่ายกิจกรรม ประมวลภาพพิธีสำคัญ และสื่อมัลติมีเดียประจำปี'
  },
  {
    name: '06_คลังวีดีโอกิจกรรมโรงเรียน',
    category: 'gallery',
    description: 'คลิปวิดีโอกิจกรรม สื่อวีดีโอมัลติมีเดีย และวิดีโอประชาสัมพันธ์โรงเรียนประจำปี'
  }
];

export interface AcademicYearProvisionResult {
  yearBE: number;
  yearFolder: DriveFileItem;
  createdSubfolders: {
    configName: string;
    category: 'academic' | 'budget' | 'personnel' | 'general' | 'gallery';
    folder: DriveFileItem;
    isNew: boolean;
  }[];
  isYearFolderNew: boolean;
}

export async function provisionAcademicYearFolders(
  centralFolderId: string,
  yearBE: number,
  onProgress?: (message: string) => void
): Promise<AcademicYearProvisionResult> {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาลงชื่อเข้าใช้ Google Drive ก่อนดำเนินการ');

  const cleanCentralId = extractFolderId(centralFolderId);
  if (!cleanCentralId) throw new Error('ไม่พบรหัสโฟลเดอร์ส่วนกลางของโรงเรียน');

  const yearFolderName = `ปีการศึกษา ${yearBE}`;
  onProgress?.(`กำลังตรวจสอบโฟลเดอร์ "${yearFolderName}" ใน Google Drive ส่วนกลาง...`);

  let yearFolder = await findDriveFolderByName(cleanCentralId, yearFolderName);
  let isYearFolderNew = false;

  if (!yearFolder) {
    onProgress?.(`กำลังสร้างโฟลเดอร์หลัก "${yearFolderName}"...`);
    yearFolder = await createDriveFolder(cleanCentralId, yearFolderName);
    isYearFolderNew = true;
  } else {
    onProgress?.(`พบโฟลเดอร์ "${yearFolderName}" เดิมอยู่แล้ว กำลังตรวจสอบโฟลเดอร์ย่อย...`);
  }

  const results: AcademicYearProvisionResult['createdSubfolders'] = [];

  for (const item of STANDARD_ACADEMIC_SUBFOLDERS) {
    const subfolderName = `${item.name}_${yearBE}`;
    onProgress?.(`กำลังตรวจสอบโฟลเดอร์ย่อย "${subfolderName}"...`);

    let subfolder = await findDriveFolderByName(yearFolder.id, subfolderName);
    let isSubNew = false;

    if (!subfolder) {
      onProgress?.(`กำลังสร้างโฟลเดอร์ "${subfolderName}"...`);
      subfolder = await createDriveFolder(yearFolder.id, subfolderName);
      isSubNew = true;
    }

    results.push({
      configName: subfolderName,
      category: item.category,
      folder: subfolder,
      isNew: isSubNew
    });
  }

  onProgress?.(`จัดเตรียมโครงสร้างปีการศึกษา ${yearBE} เสร็จสมบูรณ์!`);

  return {
    yearBE,
    yearFolder,
    createdSubfolders: results,
    isYearFolderNew
  };
}

// Aliases conforming to standard naming conventions for external / production usage
export const uploadFileToDrive = uploadDriveFile;
export const fetchFilesFromDrive = fetchDriveFiles;
export const deleteFileFromDrive = deleteDriveFile;
export const createFolderInDrive = createDriveFolder;

export interface DiagnosticStep {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  durationMs?: number;
  data?: any;
}

export interface DiagnosticReport {
  overallSuccess: boolean;
  steps: DiagnosticStep[];
  timestamp: string;
  folderId: string;
  folderName?: string;
  testFileId?: string;
  errorSummary?: string;
}

export async function runDriveDiagnosticSuite(
  folderIdInput: string,
  onStepUpdate?: (steps: DiagnosticStep[]) => void
): Promise<DiagnosticReport> {
  const cleanFolderId = extractFolderId(folderIdInput);
  
  const steps: DiagnosticStep[] = [
    { id: 'auth', title: '1. ตรวจสอบสิทธิ์ Access Token & OAuth Scopes', status: 'pending' },
    { id: 'folder', title: '2. ตรวจสอบการเข้าถึงโฟลเดอร์ส่วนกลาง (Metadata Check)', status: 'pending' },
    { id: 'permission', title: '3. ตรวจสอบสิทธิ์การเขียน/แก้ไข (canAddChildren)', status: 'pending' },
    { id: 'create', title: '4. ทดสอบสร้างไฟล์ทดสอบ (CREATE / Upload Test)', status: 'pending' },
    { id: 'update', title: '5. ทดสอบแก้ไขชื่อไฟล์ทดสอบ (UPDATE / Rename Test)', status: 'pending' },
    { id: 'delete', title: '6. ทดสอบลบไฟล์ทดสอบออกจาก Drive (DELETE Test)', status: 'pending' }
  ];

  const update = (index: number, status: 'running' | 'success' | 'error', message?: string, duration?: number, data?: any) => {
    steps[index].status = status;
    if (message) steps[index].message = message;
    if (duration !== undefined) steps[index].durationMs = duration;
    if (data !== undefined) steps[index].data = data;
    if (onStepUpdate) onStepUpdate([...steps]);
  };

  let testFileId: string | undefined;
  let folderName: string | undefined;
  let overallSuccess = true;
  let errorSummary: string | undefined;

  // Step 1: Auth Token Check
  const t1 = performance.now();
  update(0, 'running', 'กำลังตรวจสอบโทเคนและการอนุญาตสิทธิ์ Drive...');
  const token = await getAccessToken();
  if (!token) {
    update(0, 'error', 'ไม่พบ Google OAuth Access Token (กรุณากดปุ่ม "เชื่อมต่อสิทธิ์ Google Drive" ก่อน)', Math.round(performance.now() - t1));
    return {
      overallSuccess: false,
      steps,
      timestamp: new Date().toISOString(),
      folderId: cleanFolderId,
      errorSummary: 'ไม่พบคีย์สิทธิ์การเข้าใช้งาน Google Drive'
    };
  }

  // Inspect token scopes via Google tokeninfo
  try {
    const tokenInfoRes = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
    if (tokenInfoRes.ok) {
      const tokenInfo = await tokenInfoRes.json();
      const scopeStr = tokenInfo.scope || '';
      if (!scopeStr.includes('drive')) {
        update(0, 'error', 'โทเคนปัจจุบันยังไม่มีสิทธิ์ Google Drive (Insufficient scopes) กรุณากดปุ่ม "เชื่อมต่อสิทธิ์ Google Drive ทันที" ด้านล่างเพื่ออนุญาตสิทธิ์', Math.round(performance.now() - t1));
        return {
          overallSuccess: false,
          steps,
          timestamp: new Date().toISOString(),
          folderId: cleanFolderId,
          errorSummary: 'โทเคนไม่มีสิทธิ์ Google Drive (Request had insufficient authentication scopes)'
        };
      }
    }
  } catch (e) {
    // Non-blocking fallback
  }

  update(0, 'success', 'เชื่อมต่อสิทธิ์ OAuth Token สำเร็จเรียบร้อย (มีสิทธิ์เข้าถึง Google Drive)', Math.round(performance.now() - t1));

  // Step 2: Folder Existence & Metadata
  const t2 = performance.now();
  update(1, 'running', `กำลังตรวจสอบโฟลเดอร์ ID: ${cleanFolderId}...`);
  if (!cleanFolderId) {
    update(1, 'error', 'ยังไม่ได้ระบุ Folder ID ส่วนกลาง', Math.round(performance.now() - t2));
    return {
      overallSuccess: false,
      steps,
      timestamp: new Date().toISOString(),
      folderId: '',
      errorSummary: 'ยังไม่ได้ระบุ Folder ID'
    };
  }

  const folderDetails = await validateDriveFolder(cleanFolderId);
  if (!folderDetails.valid) {
    update(1, 'error', `ไม่สามารถเข้าถึงโฟลเดอร์ได้: ${folderDetails.error}`, Math.round(performance.now() - t2));
    return {
      overallSuccess: false,
      steps,
      timestamp: new Date().toISOString(),
      folderId: cleanFolderId,
      errorSummary: folderDetails.error
    };
  }
  folderName = folderDetails.name;
  const ownerDesc = folderDetails.owners?.map(o => o.emailAddress || o.displayName).join(', ') || 'ไม่ระบุ';
  update(1, 'success', `พบโฟลเดอร์ "${folderName}" (เจ้าของ: ${ownerDesc})`, Math.round(performance.now() - t2), folderDetails);

  // Step 3: Check Capabilities
  const t3 = performance.now();
  update(2, 'running', 'กำลังตรวจสอบสิทธิ์การเขียนโฟลเดอร์...');
  if (folderDetails.canAddChildren === false) {
    update(2, 'error', `บัญชี Google นี้มีสิทธิ์เพียง "ผู้ดู (Viewer)" เท่านั้น ไม่สามารถเพิ่มไฟล์ได้ กรุณาตั้งค่าแชร์ใน Google Drive ให้มีสิทธิ์เป็น "ผู้แก้ไข (Editor)"`, Math.round(performance.now() - t3));
    overallSuccess = false;
    errorSummary = 'ไม่มีสิทธิ์เพิ่มไฟล์ในโฟลเดอร์ส่วนกลาง';
    return {
      overallSuccess: false,
      steps,
      timestamp: new Date().toISOString(),
      folderId: cleanFolderId,
      folderName,
      errorSummary
    };
  }
  update(2, 'success', 'ตรวจสอบสิทธิ์: บัญชีมีสิทธิ์เป็นผู้แก้ไข (Editor) สามารถเพิ่มและจัดการไฟล์ได้', Math.round(performance.now() - t3));

  // Step 4: Create File Test
  const t4 = performance.now();
  const testFileName = `bannaree_ping_test_${Date.now()}.txt`;
  update(3, 'running', `กำลังสร้างไฟล์ทดสอบ "${testFileName}" ในโฟลเดอร์...`);
  try {
    const boundary = '-------bannaree_diag_' + Date.now();
    const metadata = {
      name: testFileName,
      parents: [cleanFolderId],
      description: 'ไฟล์ทดสอบการเชื่อมต่อระบบโรงเรียนบ้านนารี'
    };
    const content = `Google Drive Connection Test OK - Ban Naree School\nTested at: ${new Date().toISOString()}\nFolder: ${folderName} (${cleanFolderId})`;

    const multipartBody =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${content}\r\n` +
      `--${boundary}--`;

    const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartBody
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${createRes.status}`);
    }

    const createdData = await createRes.json();
    testFileId = createdData.id;
    update(3, 'success', `สร้างไฟล์ทดสอบสำเร็จ (File ID: ${testFileId})`, Math.round(performance.now() - t4), createdData);
  } catch (err: any) {
    update(3, 'error', `สร้างไฟล์ล้มเหลว: ${err.message}`, Math.round(performance.now() - t4));
    return {
      overallSuccess: false,
      steps,
      timestamp: new Date().toISOString(),
      folderId: cleanFolderId,
      folderName,
      errorSummary: `สร้างไฟล์ล้มเหลว: ${err.message}`
    };
  }

  // Step 5: Update File Test
  const t5 = performance.now();
  update(4, 'running', `กำลังทดสอบแก้ไขชื่อและข้อมูลของไฟล์ ID: ${testFileId}...`);
  try {
    const updatedName = `[UPDATED]_${testFileName}`;
    const updateRes = await fetch(`https://www.googleapis.com/drive/v3/files/${testFileId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: updatedName,
        description: 'แก้ไขสำเร็จโดยระบบทดสอบ Ban Naree School'
      })
    });

    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${updateRes.status}`);
    }
    update(4, 'success', `แก้ไขข้อมูลไฟล์สำเร็จ (เปลี่ยนชื่อเป็น "${updatedName}")`, Math.round(performance.now() - t5));
  } catch (err: any) {
    update(4, 'error', `แก้ไขไฟล์ล้มเหลว: ${err.message}`, Math.round(performance.now() - t5));
    overallSuccess = false;
  }

  // Step 6: Delete File Test (Cleanup test artifact)
  const t6 = performance.now();
  update(5, 'running', `กำลังลบไฟล์ทดสอบ ${testFileId} ออกจาก Google Drive...`);
  try {
    const deleteRes = await fetch(`https://www.googleapis.com/drive/v3/files/${testFileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!deleteRes.ok && deleteRes.status !== 204) {
      const err = await deleteRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${deleteRes.status}`);
    }
    update(5, 'success', 'ลบไฟล์ทดสอบออกจาก Drive สำเร็จเรียบร้อย (ไม่ทิ้งไฟล์ขยะ)', Math.round(performance.now() - t6));
  } catch (err: any) {
    update(5, 'error', `ลบไฟล์ล้มเหลว: ${err.message}`, Math.round(performance.now() - t6));
    overallSuccess = false;
  }

  return {
    overallSuccess,
    steps,
    timestamp: new Date().toISOString(),
    folderId: cleanFolderId,
    folderName,
    testFileId,
    errorSummary: overallSuccess ? undefined : 'มีขั้นตอนการทดสอบที่ไม่ผ่าน'
  };
}

export function formatFileSize(bytes: number): string {
  if (isNaN(bytes) || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileCategoryIcon(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'doc';
  if (mimeType.includes('spreadsheet') || mimeType.includes('sheet') || mimeType.includes('excel')) return 'sheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'slide';
  if (mimeType.includes('image')) return 'image';
  if (mimeType.includes('folder')) return 'folder';
  return 'file';
}

export interface DriveFolderItem {
  id: string;
  name: string;
  modifiedTime?: string;
}

export async function fetchDriveSubfolders(parentFolderId: string): Promise<DriveFolderItem[]> {
  const cleanId = extractFolderId(parentFolderId);
  if (!cleanId) return [];

  const token = await getAccessToken();
  if (!token) return [];

  const q = `'${cleanId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const fields = 'files(id,name,modifiedTime)';
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=100&q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&orderBy=name asc&supportsAllDrives=true&includeItemsFromAllDrives=true`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      modifiedTime: f.modifiedTime
    }));
  } catch (err) {
    console.warn('Error fetching drive subfolders:', err);
    return [];
  }
}

export async function findYearGalleryFolder(parentFolderId: string, yearBE: number): Promise<{ id: string; name: string } | null> {
  const cleanId = extractFolderId(parentFolderId);
  const targetYearStr = String(yearBE);
  const targetNamePrefix = `05_คลังภาพกิจกรรมโรงเรียน_${yearBE}`;

  const token = await getAccessToken();
  if (!token) return null;

  // 1. Inspect cleanId details if provided
  if (cleanId) {
    try {
      const details = await validateDriveFolder(cleanId);
      if (details.valid && details.name) {
        const dName = details.name;

        // Case A: cleanId itself IS already the 05_คลังภาพกิจกรรม folder
        if (dName.includes('05_') || (dName.includes('คลังภาพ') && !dName.includes('ปีการศึกษา'))) {
          return { id: cleanId, name: details.name };
        }

        // Case B: Look inside cleanId subfolders
        const subfolders = await fetchDriveSubfolders(cleanId);

        // B1: Direct subfolder matching 05_คลังภาพ...
        const directGallery = subfolders.find(f => 
          f.name.includes(targetNamePrefix) || 
          (f.name.includes('05_') && f.name.includes('คลังภาพ')) ||
          (f.name.includes('คลังภาพ') && f.name.includes(targetYearStr))
        );
        if (directGallery) {
          return { id: directGallery.id, name: directGallery.name };
        }

        // B2: If cleanId contains "ปีการศึกษา" (or a subfolder is named "ปีการศึกษา 2569"), go 1 level deeper
        const yearSub = subfolders.find(f => 
          f.name.includes(`ปีการศึกษา ${targetYearStr}`) || 
          f.name.includes(targetYearStr) ||
          f.name.includes('ปีการศึกษา')
        );

        if (yearSub) {
          const yearSubs = await fetchDriveSubfolders(yearSub.id);
          const galleryInYear = yearSubs.find(f => 
            f.name.includes('05_') || 
            f.name.includes('คลังภาพ')
          );
          if (galleryInYear) {
            return { id: galleryInYear.id, name: galleryInYear.name };
          }
        }

        // B3: If subfolders exist inside cleanId and none are department folders (01_, 02_, etc.), treat cleanId as the gallery folder
        if (subfolders.length > 0 && !subfolders.some(f => f.name.includes('01_') || f.name.includes('02_') || f.name.includes('03_'))) {
          return { id: cleanId, name: details.name || targetNamePrefix };
        }
      }
    } catch (e) {
      console.warn('Error inspecting parentFolderId in findYearGalleryFolder:', e);
    }
  }

  // 2. Global search across Drive for folder named "05_คลังภาพกิจกรรมโรงเรียน_2569" or "คลังภาพกิจกรรม"
  try {
    const q = `mimeType = 'application/vnd.google-apps.folder' and (name contains '05_' or name contains 'คลังภาพ' or name contains '${targetYearStr}') and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?pageSize=50&q=${encodeURIComponent(q)}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      const files = data.files || [];
      
      const exactMatch = files.find((f: any) => 
        f.name.includes(targetNamePrefix) || 
        (f.name.includes('คลังภาพ') && f.name.includes(targetYearStr)) ||
        f.name.includes('05_คลังภาพ')
      );
      if (exactMatch) {
        return { id: exactMatch.id, name: exactMatch.name };
      }

      const generalMatch = files.find((f: any) => f.name.includes('คลังภาพ'));
      if (generalMatch) {
        return { id: generalMatch.id, name: generalMatch.name };
      }
    }
  } catch (e) {
    console.warn('Global year folder search warning:', e);
  }

  // 3. Fallback: If cleanId was passed, return it
  if (cleanId) {
    return { id: cleanId, name: targetNamePrefix };
  }

  return null;
}

export async function findYearVideoFolder(parentFolderId: string, yearBE: number): Promise<{ id: string; name: string } | null> {
  const cleanId = extractFolderId(parentFolderId);
  const targetYearStr = String(yearBE);
  const targetNamePrefix = `06_คลังวีดีโอกิจกรรมโรงเรียน_${yearBE}`;

  const token = await getAccessToken();
  if (!token) return null;

  if (cleanId) {
    try {
      const details = await validateDriveFolder(cleanId);
      if (details.valid && details.name) {
        const dName = details.name;
        
        // Case A: cleanId itself IS already the 06_ video folder
        if (dName.includes('06_') && (dName.includes('วีดีโอ') || dName.includes('วิดีโอ'))) {
          return { id: cleanId, name: details.name };
        }

        const subfolders = await fetchDriveSubfolders(cleanId);
        
        // Case B: Direct subfolder match inside cleanId
        const directVideo = subfolders.find(f => 
          f.name.includes(targetNamePrefix) || 
          (f.name.includes('06_') && (f.name.includes('วีดีโอ') || f.name.includes('วิดีโอ')))
        );
        if (directVideo) {
          return { id: directVideo.id, name: directVideo.name };
        }

        // Case C: Drill down into Year Folder ("ปีการศึกษา 2569")
        const yearSub = subfolders.find(f => 
          f.name.includes(`ปีการศึกษา ${targetYearStr}`) || 
          f.name.includes(targetYearStr) ||
          f.name.includes('ปีการศึกษา')
        );

        if (yearSub) {
          const yearSubs = await fetchDriveSubfolders(yearSub.id);
          const videoInYear = yearSubs.find(f => 
            f.name.includes('06_') || 
            f.name.includes('วีดีโอ') ||
            f.name.includes('วิดีโอ')
          );
          if (videoInYear) {
            return { id: videoInYear.id, name: videoInYear.name };
          }

          // Auto-create inside existing Year Folder if missing
          try {
            const created = await createDriveFolder(yearSub.id, targetNamePrefix);
            return { id: created.id, name: created.name };
          } catch (e) {
            console.warn('Could not auto-create video folder inside year folder:', e);
          }
        }

        // Case D: If central folder is the parent and we didn't find the year sub, 
        // check if central is named after the year
        if (dName.includes(targetYearStr) || dName.includes('ปีการศึกษา')) {
          // Try to create 06_ inside it directly
          try {
            const created = await createDriveFolder(cleanId, targetNamePrefix);
            return { id: created.id, name: created.name };
          } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('Error in findYearVideoFolder:', e);
    }
  }

  // Global search fallback (last resort)
  try {
    const q = `mimeType = 'application/vnd.google-apps.folder' and name contains '${targetNamePrefix}' and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?pageSize=10&q=${encodeURIComponent(q)}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      if (data.files?.[0]) {
        return { id: data.files[0].id, name: data.files[0].name };
      }
    }
  } catch (e) {}

  return null;
}

export async function findDepartmentFolder(
  centralFolderId: string,
  department: SchoolDepartment | string,
  yearBE: number,
  departmentFoldersFromSettings?: DriveFolderConfig[]
): Promise<{ id: string; name: string } | null> {
  const targetYearStr = String(yearBE);
  const cleanCentralId = extractFolderId(centralFolderId);

  // Map department / category slug to code and Thai label
  const deptInfo = SCHOOL_DEPARTMENTS.find(d => d.id === department);
  let deptCode = deptInfo?.code || '';
  let deptLabel = deptInfo?.label || '';

  if (!deptCode) {
    if (department === 'academic' || department === 'sar') {
      deptCode = '01';
      deptLabel = 'งานบริหารวิชาการ';
    } else if (department === 'budget') {
      deptCode = '02';
      deptLabel = 'งานบริหารงบประมาณและสินทรัพย์';
    } else if (department === 'personnel') {
      deptCode = '03';
      deptLabel = 'งานบริหารงานบุคคล';
    } else if (department === 'general' || department === 'other') {
      deptCode = '04';
      deptLabel = 'งานบริหารทั่วไป';
    } else {
      deptCode = '01';
      deptLabel = 'งานบริหารวิชาการ';
    }
  }

  const expectedFullName = `${deptCode}_${deptLabel}_${yearBE}`;

  // 1. Check departmentFoldersFromSettings
  if (departmentFoldersFromSettings && departmentFoldersFromSettings.length > 0) {
    const match = departmentFoldersFromSettings.find(
      f => f.category === department || 
           (deptCode && f.name.includes(deptCode)) ||
           f.name.toLowerCase().includes(department.toLowerCase())
    );
    if (match && match.folderId) {
      return { id: match.folderId, name: match.name };
    }
  }

  const token = await getAccessToken();
  if (!token) {
    if (cleanCentralId) return { id: cleanCentralId, name: expectedFullName };
    return null;
  }

  // 2. Search inside centralFolderId subfolders
  if (cleanCentralId) {
    try {
      const subfolders = await fetchDriveSubfolders(cleanCentralId);

      // Direct subfolder match with deptCode (e.g. 01_) or label and year
      const directDept = subfolders.find(f => 
        (deptCode && f.name.startsWith(`${deptCode}_`)) ||
        (f.name.includes(deptLabel) && f.name.includes(targetYearStr)) ||
        (deptCode && f.name.includes(deptCode) && f.name.includes(targetYearStr))
      );
      if (directDept) {
        return { id: directDept.id, name: directDept.name };
      }

      // Check inside "ปีการศึกษา 2569" subfolder if it exists inside central
      const yearSub = subfolders.find(f => f.name.includes(targetYearStr) || f.name.includes('ปีการศึกษา'));
      if (yearSub) {
        const yearSubs = await fetchDriveSubfolders(yearSub.id);
        const deptInYear = yearSubs.find(f => 
          (deptCode && f.name.startsWith(`${deptCode}_`)) ||
          (deptCode && f.name.includes(deptCode)) ||
          f.name.includes(deptLabel)
        );
        if (deptInYear) {
          return { id: deptInYear.id, name: deptInYear.name };
        }

        // Auto-create department folder inside year folder if missing
        try {
          const created = await createDriveFolder(yearSub.id, expectedFullName);
          return { id: created.id, name: created.name };
        } catch (e) {
          console.warn('Could not auto-create dept folder in year folder:', e);
        }
      }
    } catch (e) {
      console.warn('Error searching department subfolders:', e);
    }
  }

  // 3. Global search across Drive for folder matching code/label and year
  try {
    if (deptCode) {
      const q = `mimeType = 'application/vnd.google-apps.folder' and (name contains '${deptCode}_' or name contains '${deptLabel}') and trashed = false`;
      const url = `https://www.googleapis.com/drive/v3/files?pageSize=30&q=${encodeURIComponent(q)}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const files = data.files || [];
        const match = files.find((f: any) => 
          (f.name.includes(deptCode) && f.name.includes(targetYearStr)) ||
          f.name.includes(expectedFullName)
        ) || files.find((f: any) => f.name.startsWith(`${deptCode}_`));

        if (match) {
          return { id: match.id, name: match.name };
        }
      }
    }
  } catch (e) {
    console.warn('Global search for department folder failed:', e);
  }

  // 4. Auto-create department folder under centralFolderId if missing
  if (cleanCentralId && token) {
    try {
      const created = await createDriveFolder(cleanCentralId, expectedFullName);
      return { id: created.id, name: created.name };
    } catch (e) {
      console.warn('Could not auto-create dept folder under central folder:', e);
    }
  }

  // Fallback
  if (cleanCentralId) {
    return { id: cleanCentralId, name: expectedFullName };
  }

  return null;
}
