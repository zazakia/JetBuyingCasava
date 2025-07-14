import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { OfflineSyncService, type PendingOperation } from '../offlineSync';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    };
    removeItem: (key: string) => {
      delete store[key];
    };
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Supabase client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  update: vi.fn().mockResolvedValue({ data: null, error: null }),
  delete: vi.fn().mockResolvedValue({ data: null, error: null }),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({ data: [], error: null }),
} as unknown as SupabaseClient;

describe('OfflineSyncService', () => {
  let offlineSync: OfflineSyncService;
  
  beforeEach(() => {
    // Clear all mocks and localStorage before each test
    vi.clearAllMocks();
    localStorage.clear();
    
    // Create a new instance for each test
    offlineSync = new OfflineSyncService(mockSupabase);
  });
  
  afterEach(() => {
    // Clean up any intervals
    offlineSync.destroy();
  });
  
  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(offlineSync.getStatus().isOnline).toBe(true);
      expect(offlineSync.getStatus().isSyncing).toBe(false);
      expect(offlineSync.getStatus().pending).toBe(0);
    });
    
    it('should load queue from localStorage', () => {
      const testQueue: PendingOperation[] = [
        {
          id: 'test-1',
          table: 'test_table',
          operation: 'INSERT',
          data: { name: 'Test' },
          status: 'pending',
          retryCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      localStorage.setItem('offline_sync_queue', JSON.stringify(testQueue));
      
      const newSync = new OfflineSyncService(mockSupabase);
      expect(newSync.getQueue()).toHaveLength(1);
      expect(newSync.getStatus().pending).toBe(1);
    });
  });
  
  describe('Queue Operations', () => {
    it('should enqueue an operation', () => {
      const operationId = offlineSync.enqueue('test_table', 'INSERT', { name: 'Test' });
      
      expect(operationId).toBeDefined();
      expect(offlineSync.getQueue()).toHaveLength(1);
      expect(offlineSync.getStatus().pending).toBe(1);
    });
    
    it('should process queue when online', async () => {
      // Set up mock for successful insert
      const mockInsert = vi.fn().mockResolvedValue({ data: { id: '123' }, error: null });
      (mockSupabase.from as any).mockReturnValue({ insert: mockInsert });
      
      // Add an operation to the queue
      offlineSync.enqueue('test_table', 'INSERT', { name: 'Test' });
      
      // Process the queue
      await offlineSync.processQueue();
      
      // Verify the operation was processed
      expect(mockInsert).toHaveBeenCalledWith({ name: 'Test' });
      expect(offlineSync.getQueue()).toHaveLength(0);
      expect(offlineSync.getStatus().pending).toBe(0);
    });
    
    it('should retry failed operations', async () => {
      // First attempt fails, second succeeds
      const mockInsert = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: { id: '123' }, error: null });
      
      (mockSupabase.from as any).mockReturnValue({ insert: mockInsert });
      
      // Add an operation to the queue
      offlineSync.enqueue('test_table', 'INSERT', { name: 'Test' });
      
      // First attempt should fail and be retried
      await offlineSync.processQueue();
      expect(offlineSync.getQueue()).toHaveLength(1);
      
      // Second attempt should succeed
      await offlineSync.processQueue();
      expect(offlineSync.getQueue()).toHaveLength(0);
    });
  });
  
  describe('Conflict Resolution', () => {
    it('should resolve conflicts with server data', async () => {
      // Simulate a conflict
      const conflictError = new Error('Conflict');
      (conflictError as any).code = '23505'; // Unique violation
      
      const mockInsert = vi.fn()
        .mockRejectedValueOnce(conflictError)
        .mockResolvedValueOnce({ data: { id: '123' }, error: null });
      
      (mockSupabase.from as any).mockReturnValue({ 
        insert: mockInsert,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ 
          data: { id: '123', name: 'Server Value' }, 
          error: null 
        })
      });
      
      // Add an operation to the queue
      const opId = offlineSync.enqueue('test_table', 'INSERT', { name: 'Test' });
      
      // Process the queue (will fail with conflict)
      await offlineSync.processQueue();
      
      // Resolve the conflict
      await (offlineSync as any).resolveConflict(opId, { name: 'Resolved Value' });
      
      // Process again with resolved data
      await offlineSync.processQueue();
      
      // Verify the operation was processed with resolved data
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Resolved Value'
      }));
    });
  });
  
  describe('Offline Behavior', () => {
    it('should queue operations when offline', async () => {
      // Set offline
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      
      // Add an operation while offline
      offlineSync.enqueue('test_table', 'INSERT', { name: 'Offline Test' });
      
      // Should be in queue but not processed
      expect(offlineSync.getQueue()).toHaveLength(1);
      expect(offlineSync.getStatus().pending).toBe(1);
    });
    
    it('should process queue when coming back online', async () => {
      // Set offline and add an operation
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      offlineSync.enqueue('test_table', 'INSERT', { name: 'Offline Test' });
      
      // Set up mock for successful insert
      const mockInsert = vi.fn().mockResolvedValue({ data: { id: '123' }, error: null });
      (mockSupabase.from as any).mockReturnValue({ insert: mockInsert });
      
      // Go back online
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));
      
      // Wait for queue to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should have processed the operation
      expect(mockInsert).toHaveBeenCalled();
      expect(offlineSync.getQueue()).toHaveLength(0);
    });
  });
});
