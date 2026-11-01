import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

// Ensure active database ID is passed to Vite client
process.env.VITE_FIREBASE_DATABASE_ID = 'ai-studio-bannareeschoolv2-815a30b2-8e41-4fc7-940b-ce136fae275e';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '.d1_dev_store.json');

const app = express();

// Parse CLI arguments (--port <num>, --host <addr>) and environment variables
const args = process.argv.slice(2);
function getArg(name: string, fallback: string): string {
  const flag = `--${name}`;
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return fallback;
}

const host = getArg('host', process.env.HOST || '0.0.0.0');
// AI Studio requires the dev server to run on port 3000.
// Do not use process.env.PORT in development because container environment sets PORT=8080 (which is in use by container proxy).
const port = parseInt(
  getArg('port', process.env.NODE_ENV === 'production' && process.env.PORT ? process.env.PORT : '3000'),
  10
);

app.use(express.json({ limit: '10mb' }));

// In-memory development store matching Cloudflare D1 tables
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
  initialMediaItems,
} from './src/data/initialData';

const devStore: Record<string, any[]> = {
  school_info: [{ ...initialSchoolInfo, id: 'main' }],
  staff: [...initialStaff],
  board_members: [...initialBoardMembers],
  news: [...initialNews],
  gallery_albums: [...initialGallery],
  video_gallery: [...initialVideos],
  public_documents: [...initialPublicDocuments],
  post_categories: [...initialCategories],
  media_library: [...initialMediaItems],
  school_settings: [{ ...initialDriveSettings, id: 'main' }],
  site_stats: [{ id: 'counter', totalVisits: 1250, todayVisits: 45 }],
  system_roles: [{ id: 'roles', superAdminEmail: 'director@bnr.ac.th', adminEmails: ['director@bnr.ac.th', 'engine@bnr.ac.th'] }],
  users: [
    {
      uid: 'superadmin_director',
      email: 'director@bnr.ac.th',
      displayName: 'ผู้อำนวยการโรงเรียน (Super Admin)',
      photoURL: '',
      role: 'superadmin',
      department: 'กลุ่มงานบริหารและอำนวยการ',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  inbox_messages: [],
  backup_audit_logs: [
    {
      id: 'log_init',
      timestamp: new Date().toISOString(),
      action: 'SYSTEM_INIT',
      actionLabel: 'เตรียมพร้อมระบบสำรองข้อมูล D1',
      performedByEmail: 'director@bnr.ac.th',
      performedByName: 'ผู้อำนวยการโรงเรียน (Super Admin)',
      status: 'SUCCESS',
      details: 'ระบบสำรองข้อมูลเชื่อมต่อ Cloudflare D1 เรียบร้อย 15 ตารางข้อมูล',
      recordCount: 15,
    }
  ]
};

function loadDevStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      for (const key of Object.keys(parsed)) {
        devStore[key] = parsed[key];
      }
      console.log('Loaded devStore from .d1_dev_store.json');
    }
  } catch (err) {
    console.warn('Could not load .d1_dev_store.json:', err);
  }
}

function saveDevStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(devStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save .d1_dev_store.json:', err);
  }
}

// Load persisted state on server startup
loadDevStore();

let devSessionUser: any = {
  uid: 'superadmin_director',
  email: 'director@bnr.ac.th',
  displayName: 'ผู้อำนวยการโรงเรียน (Super Admin)',
  photoURL: '',
  role: 'superadmin',
  department: 'กลุ่มงานบริหารและอำนวยการ',
  status: 'active',
};

// --- Dev Auth Endpoints ---
app.get('/api/auth/me', (req: Request, res: Response) => {
  res.json({
    authenticated: true,
    user: devSessionUser,
    role: devSessionUser?.role || 'superadmin',
    token: 'dev_mock_token_123',
  });
});

app.post('/api/auth/google', (req: Request, res: Response) => {
  res.json({
    success: true,
    token: 'dev_mock_token_123',
    user: devSessionUser,
  });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out' });
});

// --- Dev Seed Endpoint ---
app.post('/api/seed', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Seeded', seeded: true });
});

// --- Dev Stats Endpoint ---
app.get('/api/stats/hit', (req: Request, res: Response) => {
  const stat = devStore.site_stats[0] || { totalVisits: 1, todayVisits: 1 };
  res.json(stat);
});

app.post('/api/stats/hit', (req: Request, res: Response) => {
  const stat = devStore.site_stats[0] || { id: 'counter', totalVisits: 0, todayVisits: 0 };
  stat.totalVisits = (stat.totalVisits || 0) + 1;
  stat.todayVisits = (stat.todayVisits || 0) + 1;
  devStore.site_stats[0] = stat;
  saveDevStore();
  res.json(stat);
});

// --- Dev Inbox Endpoints ---
app.get('/api/inbox', (req: Request, res: Response) => {
  res.json(devStore.inbox_messages);
});

app.post('/api/inbox', (req: Request, res: Response) => {
  const msg = {
    id: `msg-${Date.now()}`,
    ...req.body,
    status: 'new',
    createdAt: new Date().toISOString(),
  };
  devStore.inbox_messages.unshift(msg);
  saveDevStore();
  res.json({ success: true, id: msg.id });
});

app.put('/api/inbox', (req: Request, res: Response) => {
  const { id, status, directorNotes } = req.body;
  const target = devStore.inbox_messages.find((m) => m.id === id);
  if (target) {
    if (status) target.status = status;
    if (directorNotes !== undefined) target.directorNotes = directorNotes;
    target.updatedAt = new Date().toISOString();
  }
  saveDevStore();
  res.json({ success: true });
});

app.delete('/api/inbox', (req: Request, res: Response) => {
  const id = req.query.id as string;
  devStore.inbox_messages = devStore.inbox_messages.filter((m) => m.id !== id);
  saveDevStore();
  res.json({ success: true });
});

// --- Dev Generic Data Endpoints (:table and :table/:id) ---
app.get('/api/data/:table', (req: Request, res: Response) => {
  const table = req.params.table;
  const list = devStore[table] || [];
  res.json(list);
});

app.post('/api/data/:table', (req: Request, res: Response) => {
  const table = req.params.table;
  if (!devStore[table]) devStore[table] = [];

  const body = req.body;
  const id = body.id || `item_${Date.now()}`;
  const payload = { ...body, id, updatedAt: new Date().toISOString() };

  const idx = devStore[table].findIndex((item) => item.id === id);
  if (idx >= 0) {
    devStore[table][idx] = { ...devStore[table][idx], ...payload };
  } else {
    devStore[table].push(payload);
  }

  saveDevStore();
  res.json({ success: true, data: payload });
});

app.get('/api/data/:table/:id', (req: Request, res: Response) => {
  const { table, id } = req.params;
  const item = (devStore[table] || []).find((i) => i.id === id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

app.put('/api/data/:table/:id', (req: Request, res: Response) => {
  const { table, id } = req.params;
  if (!devStore[table]) devStore[table] = [];
  const idx = devStore[table].findIndex((i) => i.id === id);
  if (idx >= 0) {
    devStore[table][idx] = { ...devStore[table][idx], ...req.body, id, updatedAt: new Date().toISOString() };
  } else {
    devStore[table].push({ ...req.body, id, updatedAt: new Date().toISOString() });
  }
  saveDevStore();
  res.json({ success: true });
});

app.delete('/api/data/:table/:id', (req: Request, res: Response) => {
  const { table, id } = req.params;
  if (devStore[table]) {
    devStore[table] = devStore[table].filter((i) => i.id !== id);
  }
  saveDevStore();
  res.json({ success: true });
});

// --- Cloudflare D1 Native Backup & Restore Endpoints ---
app.get('/api/backup/export', (req: Request, res: Response) => {
  const allTables = [
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

  let totalRecords = 0;
  const backupData: Record<string, any> = {};

  for (const table of allTables) {
    const rows = devStore[table] || [];
    if (table === 'school_info' || table === 'school_settings' || table === 'site_stats' || table === 'system_roles') {
      backupData[table] = rows[0] || null;
      if (rows[0]) totalRecords++;
    } else {
      backupData[table] = [...rows];
      totalRecords += rows.length;
    }
  }

  const payload = {
    metadata: {
      version: '3.0-D1',
      engine: 'Cloudflare D1 (SQLite 3)',
      database: 'bannaree-db',
      database_id: '56fe1149-9b8f-4ef9-8e8e-2d3d7bda91f4',
      app: 'Ban Naree School Web Platform',
      schoolName: 'โรงเรียนบ้านนารี (สพป.ชัยภูมิ เขต 1)',
      backupTimestamp: new Date().toISOString(),
      academicYearBE: 2569,
      createdByEmail: devSessionUser?.email || 'director@bnr.ac.th',
      createdByName: devSessionUser?.displayName || 'ผู้อำนวยการโรงเรียน (Super Admin)',
      totalTables: allTables.length,
      totalRecords,
    },
    data: backupData,
  };

  res.json(payload);
});

app.post('/api/backup/restore', (req: Request, res: Response) => {
  const { payload } = req.body;
  if (!payload || !payload.data) {
    return res.status(400).json({ error: 'โครงสร้างไฟล์สำรองข้อมูลไม่ถูกต้อง' });
  }

  const data = payload.data;
  let totalRestored = 0;

  // Single-row tables
  if (data.school_info) {
    devStore.school_info = [{ ...data.school_info, id: 'main' }];
    totalRestored++;
  }
  if (data.school_settings) {
    devStore.school_settings = [{ ...data.school_settings, id: 'main' }];
    totalRestored++;
  }
  if (data.site_stats) {
    devStore.site_stats = [{ ...data.site_stats, id: 'counter' }];
    totalRestored++;
  }
  if (data.system_roles) {
    devStore.system_roles = [{ ...data.system_roles, id: 'roles' }];
    totalRestored++;
  }

  // Multi-row collections
  const multiTables = [
    { key: 'staff', target: 'staff' },
    { key: 'board_members', target: 'board_members' },
    { key: 'news', target: 'news' },
    { key: 'gallery_albums', target: 'gallery_albums' },
    { key: 'gallery', target: 'gallery_albums' }, // legacy compat
    { key: 'video_gallery', target: 'video_gallery' },
    { key: 'public_documents', target: 'public_documents' },
    { key: 'post_categories', target: 'post_categories' },
    { key: 'media_library', target: 'media_library' },
    { key: 'inbox_messages', target: 'inbox_messages' },
    { key: 'users', target: 'users' },
  ];

  for (const { key, target } of multiTables) {
    if (Array.isArray(data[key])) {
      if (!devStore[target]) devStore[target] = [];
      devStore[target] = [...data[key]];
      totalRestored += data[key].length;
    }
  }

  saveDevStore();
  res.json({ success: true, totalRestored, message: `กู้คืนข้อมูลสู่ Cloudflare D1 เรียบร้อย (${totalRestored} รายการ)` });
});

app.get('/api/backup/logs', (req: Request, res: Response) => {
  res.json(devStore.backup_audit_logs || []);
});

app.post('/api/backup/logs', (req: Request, res: Response) => {
  const log = {
    id: `log_${Date.now()}`,
    ...req.body,
    timestamp: req.body.timestamp || new Date().toISOString(),
  };
  if (!devStore.backup_audit_logs) devStore.backup_audit_logs = [];
  devStore.backup_audit_logs.unshift(log);
  res.json({ success: true, id: log.id });
});

// Cloudflare D1 Diagnostic & Connection Status Endpoint
app.get('/api/d1-status', (req: Request, res: Response) => {
  const allTables = [
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
    'user_sessions',
  ];

  const tableStats = allTables.map((name) => ({
    name,
    count: devStore[name]?.length || 0,
    status: 'ready',
  }));

  res.json({
    connected: true,
    database: 'bannaree-db',
    database_id: '56fe1149-9b8f-4ef9-8e8e-2d3d7bda91f4',
    binding: 'env.DB',
    engine: 'Cloudflare D1 (Serverless SQLite 3)',
    edge_region: 'Global Edge Network (Multi-Region Replicas)',
    tables_count: allTables.length,
    tables: allTables,
    table_stats: tableStats,
    sqlite_version: '3.45.1',
    ping_ms: Math.floor(Math.random() * 8) + 12,
    storage_kb: 221,
    storage_quota_gb: 5,
    rows_read_quota_limit: 5000000,
    rows_written_quota_limit: 100000,
    daily_quota_limit: 5000000,
    rows_read_used: 0,
    rows_written_used: 0,
    total_queries: 1,
    firebase_status: 'Disconnected (0 read/write)',
    timestamp: new Date().toISOString(),
  });
});

// In development, hook up Vite middlewares
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}`);
  });

  server.on('error', (err: any) => {
    console.error('Server error:', err);
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
