/**
 * Firestore Database Service
 * Replaces Prisma/PostgreSQL with Google Firestore
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Lazy-loaded Firestore instance
let _db: Firestore | null = null;
let _initializationError: Error | null = null;

function initializeFirebase(): Firestore {
  if (_db) return _db;
  if (_initializationError) throw _initializationError;

  try {
    if (getApps().length === 0) {
      // Check for service account credentials
      let serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const projectId = process.env.GOOGLE_CLOUD_PROJECT;

      // Resolve relative paths
      if (serviceAccountPath && !path.isAbsolute(serviceAccountPath)) {
        serviceAccountPath = path.resolve(process.cwd(), serviceAccountPath);
      }

      if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
        // Local development with service account file
        console.log('[Firestore] Loading credentials from:', serviceAccountPath);
        const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
        const serviceAccount = JSON.parse(serviceAccountContent);
        initializeApp({
          credential: cert(serviceAccount),
          projectId: projectId || serviceAccount.project_id,
        });
      } else if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        // Alternative: Service account as JSON string in env
        console.log('[Firestore] Loading credentials from JSON env');
        const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        initializeApp({
          credential: cert(serviceAccount),
          projectId: projectId || serviceAccount.project_id,
        });
      } else if (projectId) {
        // Cloud Run - uses default credentials (ADC)
        initializeApp({
          projectId: projectId,
        });
      } else {
        _initializationError = new Error('Firestore credentials not configured. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_JSON');
        throw _initializationError;
      }
    }

    // Get Firestore instance with custom database ID
    const databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';
    _db = getFirestore(databaseId);
    return _db;
  } catch (error) {
    _initializationError = error as Error;
    throw error;
  }
}

// Getter for Firestore instance
function getDb(): Firestore {
  return initializeFirebase();
}

// Create a proxy for lazy loading
export const db = new Proxy({} as Firestore, {
  get(_, prop) {
    if (prop === 'then' || prop === 'toJSON' || typeof prop === 'symbol') {
      return undefined;
    }
    try {
      const instance = getDb();
      const value = (instance as unknown as Record<string | symbol, unknown>)[prop];
      return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(instance) : value;
    } catch (error) {
      console.error('[Firestore Proxy] Error accessing property:', prop, error);
      throw error;
    }
  }
});

export { FieldValue, Timestamp };

// ============================================
// Collection Names
// ============================================
export const Collections = {
  USERS: 'users',
  API_TOKENS: 'api_tokens',
  USER_PLANS: 'user_plans',
  API_USAGE: 'api_usage',
  DEBUG_LOGS: 'debug_logs',
  EBAY_ACCOUNTS: 'ebay_accounts',
} as const;

// ============================================
// Type Definitions
// ============================================

// User Roles as const object for better Turbopack compatibility
export const UserRoles = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;
export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];

// Log Levels as const object
export const LogLevels = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
} as const;
export type LogLevel = (typeof LogLevels)[keyof typeof LogLevels];

export interface User {
  id: string;
  email: string;
  password: string;
  name?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiTokenPermissions {
  endpoints: string[];
  rateLimit: number;
  ebayAccountIds?: string[];  // Optional: restrict token to specific eBay accounts
  [key: string]: unknown;
}

export interface ApiToken {
  id: string;
  name: string;
  token: string;
  userId: string;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  lastUsedAt?: Date;
  permissions: ApiTokenPermissions;
  updatedAt: Date;
  isDeleted: boolean;
}

export interface UserPlan {
  id: string;
  userId: string;
  planName: string;
  monthlyApiLimit: number;
  allowedEndpoints: string[];
  isActive: boolean;
  startedAt: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiUsage {
  id: string;
  userId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface DebugLog {
  id: string;
  userId?: string;
  level: string;
  message: string;
  context?: Record<string, unknown>;
  category?: string;
  metadata?: Record<string, unknown>;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
  ip?: string;
  timestamp: Date;
  createdAt?: Date;
  expiresAt?: Date;
}

export interface EbayAccount {
  id: string;
  userId: string;
  ebayUserId: string;
  ebayUsername?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  tokenType: string;
  scopes: string[];
  userSelectedScopes: string[];
  status: string;
  environment: 'sandbox' | 'production';
  friendlyName?: string;
  tags: string[];
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a unique ID
 */
export function generateId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Serialize data for Firestore (convert Date objects)
 */
export function serializeForFirestore(data: Record<string, unknown>): Record<string, unknown> {
  const serialized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Date) {
      serialized[key] = value;
    } else if (Array.isArray(value)) {
      serialized[key] = value.map(item =>
        item instanceof Date ? item : (typeof item === 'object' && item !== null ? serializeForFirestore(item as Record<string, unknown>) : item)
      );
    } else if (typeof value === 'object' && value !== null) {
      serialized[key] = serializeForFirestore(value as Record<string, unknown>);
    } else {
      serialized[key] = value;
    }
  }

  return serialized;
}

/**
 * Deserialize data from Firestore (convert Timestamps to Dates)
 */
export function deserializeFromFirestore<T>(data: Record<string, unknown>): T {
  const deserialized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
      deserialized[key] = (value as { toDate: () => Date }).toDate();
    } else if (Array.isArray(value)) {
      deserialized[key] = value.map(item => {
        if (item && typeof item === 'object' && 'toDate' in item && typeof item.toDate === 'function') {
          return item.toDate();
        }
        return typeof item === 'object' && item !== null ? deserializeFromFirestore(item) : item;
      });
    } else if (typeof value === 'object' && value !== null) {
      deserialized[key] = deserializeFromFirestore(value as Record<string, unknown>);
    } else {
      deserialized[key] = value;
    }
  }

  return deserialized as T;
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Get a document by ID
 */
export async function getDoc<T>(collection: string, id: string): Promise<T | null> {
  const firestore = getDb();
  const doc = await firestore.collection(collection).doc(id).get();

  if (!doc.exists) {
    return null;
  }

  return deserializeFromFirestore<T>({ id: doc.id, ...doc.data() });
}

/**
 * Query documents with filters
 */
export async function queryDocs<T>(
  collection: string,
  filters: Array<{ field: string; op: FirebaseFirestore.WhereFilterOp; value: unknown }>,
  options?: {
    orderBy?: { field: string; direction: 'asc' | 'desc' };
    limit?: number;
    offset?: number;
  }
): Promise<T[]> {
  const firestore = getDb();
  let query: FirebaseFirestore.Query = firestore.collection(collection);

  for (const filter of filters) {
    query = query.where(filter.field, filter.op, filter.value);
  }

  if (options?.orderBy) {
    query = query.orderBy(options.orderBy.field, options.orderBy.direction);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.offset(options.offset);
  }

  const snapshot = await query.get();

  return snapshot.docs.map(doc => deserializeFromFirestore<T>({ id: doc.id, ...doc.data() }));
}

/**
 * Create a document
 */
export async function createDoc<T extends { id?: string }>(
  collection: string,
  data: Omit<T, 'id'> & { id?: string }
): Promise<T> {
  const firestore = getDb();
  const id = data.id || generateId();
  const now = new Date();

  const docData = serializeForFirestore({
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  });

  await firestore.collection(collection).doc(id).set(docData);

  return { ...docData, id } as unknown as T;
}

/**
 * Update a document
 */
export async function updateDoc<T>(
  collection: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  const firestore = getDb();
  const docData = serializeForFirestore({
    ...data,
    updatedAt: new Date(),
  });

  await firestore.collection(collection).doc(id).update(docData);
}

/**
 * Delete a document
 */
export async function deleteDoc(collection: string, id: string): Promise<void> {
  const firestore = getDb();
  await firestore.collection(collection).doc(id).delete();
}

/**
 * Count documents matching filters
 */
export async function countDocs(
  collection: string,
  filters: Array<{ field: string; op: FirebaseFirestore.WhereFilterOp; value: unknown }> = []
): Promise<number> {
  const firestore = getDb();
  let query: FirebaseFirestore.Query = firestore.collection(collection);

  for (const filter of filters) {
    query = query.where(filter.field, filter.op, filter.value);
  }

  const snapshot = await query.count().get();
  return snapshot.data().count;
}

/**
 * Batch delete documents
 */
export async function batchDelete(collection: string, ids: string[]): Promise<void> {
  const firestore = getDb();
  const batch = firestore.batch();

  for (const id of ids) {
    batch.delete(firestore.collection(collection).doc(id));
  }

  await batch.commit();
}

/**
 * Get all documents from a collection
 */
export async function getAllDocs<T>(
  collection: string,
  options?: {
    orderBy?: { field: string; direction: 'asc' | 'desc' };
    limit?: number;
  }
): Promise<T[]> {
  const firestore = getDb();
  let query: FirebaseFirestore.Query = firestore.collection(collection);

  if (options?.orderBy) {
    query = query.orderBy(options.orderBy.field, options.orderBy.direction);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => deserializeFromFirestore<T>({ id: doc.id, ...doc.data() }));
}
