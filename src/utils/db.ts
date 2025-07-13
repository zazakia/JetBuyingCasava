import { getSupabaseClient } from './supabase';
import type { Database } from '../types/supabase';
import { v4 as uuidv4 } from 'uuid';

type QueryFunction<T> = () => Promise<{
  data: T | null;
  error: any;
  status: number;
  statusText: string;
}>;

type PostgrestResponse<T> = {
  data: T | null;
  error: any;
  status: number;
  statusText: string;
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Executes a database query with retry logic for transient failures
 */
async function withRetry<T>(
  queryFn: QueryFunction<T>,
  options: { maxRetries?: number; retryDelay?: number } = {}
): Promise<{ data: T | null; error: any }> {
  const maxRetries = options.maxRetries ?? MAX_RETRIES;
  const retryDelay = options.retryDelay ?? RETRY_DELAY;
  
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error, status, statusText } = await queryFn();
      
      // If no error, return the result immediately
      if (!error) {
        return { data, error: null };
      }
      
      // If it's a network error or rate limit, retry
      if (isTransientError(status, error)) {
        lastError = error;
        
        // Calculate exponential backoff with jitter
        const backoff = Math.min(
          retryDelay * Math.pow(2, attempt - 1) * (0.7 + 0.6 * Math.random()),
          30000 // Max 30 seconds
        );
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, backoff));
          continue;
        }
      }
      
      // For non-transient errors or after max retries, return the error
      return { 
        data: null, 
        error: new Error(`Database error (${status}): ${statusText || error.message}`) 
      };
      
    } catch (error) {
      lastError = error;
      
      // Only retry on network errors
      if (isNetworkError(error) && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        continue;
      }
      
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown database error') 
      };
    }
  }
  
  return { 
    data: null, 
    error: lastError instanceof Error ? lastError : new Error('Max retries reached') 
  };
}

/**
 * Check if an error is transient and can be retried
 */
function isTransientError(status: number, error: any): boolean {
  // Network errors (handled in catch block)
  if (isNetworkError(error)) return true;
  
  // Rate limiting (429) or server errors (5xx)
  if (status === 429 || (status >= 500 && status < 600)) {
    return true;
  }
  
  // Specific Supabase errors that can be retried
  const retryableMessages = [
    'connection error',
    'connection timeout',
    'network error',
    'rate limit',
    'too many requests',
    'service unavailable',
    'bad gateway',
    'gateway timeout',
  ];
  
  const errorMessage = String(error?.message || '').toLowerCase();
  return retryableMessages.some(msg => errorMessage.includes(msg));
}

/**
 * Check if an error is a network error
 */
function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  // Standard fetch network errors
  if (error instanceof TypeError && 
      (error.message.includes('Failed to fetch') || 
       error.message.includes('NetworkError'))) {
    return true;
  }
  
  // Connection refused, etc.
  if (error.message && 
      (error.message.includes('ECONNREFUSED') ||
       error.message.includes('ENOTFOUND') ||
       error.message.includes('ETIMEDOUT') ||
       error.message.includes('ECONNRESET'))) {
    return true;
  }
  
  return false;
}

/**
 * Execute a query with retry logic and error handling
 */
export async function executeQuery<T = any>(
  queryFn: QueryFunction<T>,
  options: { maxRetries?: number; retryDelay?: number } = {}
): Promise<{ data: T | null; error: Error | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { 
      data: null, 
      error: new Error('Database client not initialized') 
    };
  }
  
  // Generate a unique ID for this query for logging
  const queryId = uuidv4().substring(0, 8);
  const startTime = performance.now();
  
  try {
    console.debug(`[DB] Query ${queryId} started`);
    
    const result = await withRetry<T>(queryFn, options);
    const duration = Math.round(performance.now() - startTime);
    
    if (result.error) {
      console.error(`[DB] Query ${queryId} failed after ${duration}ms:`, result.error);
    } else {
      console.debug(`[DB] Query ${queryId} completed in ${duration}ms`);
    }
    
    return result;
    
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[DB] Query ${queryId} failed after ${duration}ms:`, error);
    
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error(errorMessage) 
    };
  }
}

/**
 * Helper function to execute a select query
 */
export async function select<T = any>(
  table: keyof Database['public']['Tables'],
  columns: string = '*',
  filter: Record<string, any> = {},
  options: { limit?: number; orderBy?: string; ascending?: boolean } = {}
): Promise<{ data: T[] | null; error: Error | null }> {
  return executeQuery<T[]>(async (): Promise<PostgrestResponse<T[]>> => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Database client not initialized');
    
    const query = client
      .from(table as string)
      .select(columns, { count: 'exact' });
    
    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined) {
        query.eq(key, value);
      }
    });
    
    // Apply options
    if (options.limit) {
      query.limit(options.limit);
    }
    
    if (options.orderBy) {
      query.order(options.orderBy, { ascending: options.ascending ?? true });
    }
    
    const result = await query;
    return {
      data: result.data as T[],
      error: result.error,
      status: result.status,
      statusText: result.statusText
    };
  });
}

/**
 * Helper function to insert a record
 */
export async function insert<T = any>(
  table: keyof Database['public']['Tables'],
  data: Partial<T>,
  options: { returning?: string } = { returning: '*' }
): Promise<{ data: T | null; error: Error | null }> {
  return executeQuery<T>(async () => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Database client not initialized');
    
    return client
      .from(table as string)
      .insert(data as any)
      .select(options.returning)
      .single();
  });
}

/**
 * Helper function to update a record
 */
export async function update<T = any>(
  table: keyof Database['public']['Tables'],
  id: string,
  data: Partial<T>,
  options: { returning?: string } = { returning: '*' }
): Promise<{ data: T | null; error: Error | null }> {
  return executeQuery<T>(async () => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Database client not initialized');
    
    return client
      .from(table as string)
      .update(data as any)
      .eq('id', id)
      .select(options.returning)
      .single();
  });
}

/**
 * Helper function to delete a record
 */
export async function remove<T = any>(
  table: keyof Database['public']['Tables'],
  id: string
): Promise<{ data: T | null; error: Error | null }> {
  return executeQuery<T>(async () => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Database client not initialized');
    
    return client
      .from(table as string)
      .delete()
      .eq('id', id)
      .select()
      .single();
  });
}

/**
 * Execute a transaction with multiple operations
 */
export async function transaction<T = any>(
  operations: (() => Promise<{ data: T | null; error: Error | null }>)[]
): Promise<{ data: T[] | null; error: Error | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { 
      data: null, 
      error: new Error('Database client not initialized') 
    };
  }
  
  const results: T[] = [];
  
  try {
    // Start a transaction
    const { error } = await client.rpc('begin');
    
    if (error) throw error;
    
    // Execute all operations
    for (const operation of operations) {
      const result = await operation();
      
      if (result.error) {
        // Rollback on error
        await client.rpc('rollback');
        return { data: null, error: result.error };
      }
      
      if (result.data) {
        results.push(result.data);
      }
    }
    
    // Commit the transaction
    await client.rpc('commit');
    
    return { data: results, error: null };
    
  } catch (error) {
    // Ensure we rollback on any unhandled errors
    try {
      await client.rpc('rollback');
    } catch (e) {
      console.error('Rollback error:', e);
    }
    
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Transaction failed') 
    };
  }
}
