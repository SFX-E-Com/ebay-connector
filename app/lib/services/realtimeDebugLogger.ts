import {
  db,
  Collections,
  DebugLog,
  LogLevels,
  createDoc,
  queryDocs,
  generateId
} from './firestore';
import type { LogLevel } from './firestore';
import { EventEmitter } from 'events';

export interface DebugLogData {
  level: LogLevel;
  category: string;
  message: string;
  metadata?: Record<string, unknown>;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
  ip?: string;
  userId?: string;
}

// Event emitter for real-time notifications
class DebugEventEmitter extends EventEmitter { }
const debugEvents = new DebugEventEmitter();

export class RealtimeDebugLogger {
  /**
   * Log a message to the database and emit real-time event
   */
  static async log(data: DebugLogData): Promise<DebugLog | null> {
    try {
      const logEntry = await createDoc<DebugLog>(Collections.DEBUG_LOGS, {
        id: generateId(),
        level: data.level,
        category: data.category,
        message: data.message,
        metadata: data.metadata,
        method: data.method,
        url: data.url,
        statusCode: data.statusCode,
        duration: data.duration,
        userAgent: data.userAgent,
        ip: data.ip,
        userId: data.userId,
        timestamp: new Date(),
        createdAt: new Date(),
      });

      // Emit real-time event for SSE subscribers
      debugEvents.emit('newLog', logEntry);

      return logEntry;
    } catch (error) {
      console.error('Error logging to database:', error);
      return null;
    }
  }

  /**
   * Log an info message
   */
  static async info(category: string, message: string, metadata?: Record<string, unknown>, additionalData?: Partial<DebugLogData>): Promise<DebugLog | null> {
    return await this.log({
      level: 'INFO',
      category,
      message,
      metadata,
      ...additionalData,
    });
  }

  /**
   * Log a debug message
   */
  static async debug(category: string, message: string, metadata?: Record<string, unknown>, additionalData?: Partial<DebugLogData>): Promise<DebugLog | null> {
    return await this.log({
      level: 'DEBUG',
      category,
      message,
      metadata,
      ...additionalData,
    });
  }

  /**
   * Log a warning message
   */
  static async warn(category: string, message: string, metadata?: Record<string, unknown>, additionalData?: Partial<DebugLogData>): Promise<DebugLog | null> {
    return await this.log({
      level: 'WARN',
      category,
      message,
      metadata,
      ...additionalData,
    });
  }

  /**
   * Log an error message
   */
  static async error(category: string, message: string, metadata?: Record<string, unknown>, additionalData?: Partial<DebugLogData>): Promise<DebugLog | null> {
    return await this.log({
      level: 'ERROR',
      category,
      message,
      metadata,
      ...additionalData,
    });
  }

  /**
   * Get recent logs from database
   */
  static async getLogs(limit: number = 100, since?: Date): Promise<DebugLog[]> {
    try {
      const conditions: Array<{ field: string; op: FirebaseFirestore.WhereFilterOp; value: unknown }> = [];

      if (since) {
        conditions.push({ field: 'createdAt', op: '>=', value: since });
      }

      const logs = await queryDocs<DebugLog>(
        Collections.DEBUG_LOGS,
        conditions,
        {
          orderBy: { field: 'createdAt', direction: 'desc' },
          limit
        }
      );

      return logs.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error fetching logs from database:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time log events
   */
  static onNewLog(callback: (log: DebugLog) => void): () => void {
    debugEvents.on('newLog', callback);

    // Return unsubscribe function
    return () => {
      debugEvents.off('newLog', callback);
    };
  }

  /**
   * Clear all logs
   */
  static async clearAllLogs(): Promise<void> {
    try {
      // Get all logs and delete them in batches
      const logsSnapshot = await db.collection(Collections.DEBUG_LOGS).get();

      const batch = db.batch();
      logsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      // Emit clear event
      debugEvents.emit('logsCleared');
    } catch (error) {
      console.error('Error clearing all logs:', error);
    }
  }

  /**
   * Subscribe to logs cleared events
   */
  static onLogsCleared(callback: () => void): () => void {
    debugEvents.on('logsCleared', callback);

    // Return unsubscribe function
    return () => {
      debugEvents.off('logsCleared', callback);
    };
  }

  /**
   * Clean up old logs (keep only last N days)
   */
  static async cleanupOldLogs(daysToKeep: number = 7): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Query logs older than cutoff date
      const oldLogsSnapshot = await db.collection(Collections.DEBUG_LOGS)
        .where('createdAt', '<', cutoffDate)
        .get();

      // Delete in batches (Firestore limit is 500 per batch)
      const batchSize = 500;
      const docs = oldLogsSnapshot.docs;

      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = db.batch();
        const chunk = docs.slice(i, i + batchSize);

        chunk.forEach(doc => {
          batch.delete(doc.ref);
        });

        await batch.commit();
      }
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
    }
  }
}

// Re-export LogLevel and LogLevels for compatibility
export { LogLevels } from './firestore';
export type { LogLevel } from './firestore';

export default RealtimeDebugLogger;