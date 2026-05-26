/**
 * Games API Integration Tests
 * 
 * Tests GET /api/games and POST /api/games endpoints.
 * @jest-environment node
 */

import { createMocks } from 'node-mocks-http';
import handler from '../games';

// Mock Supabase client
jest.mock('../../../utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
    })),
  },
}));

describe('/api/games Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================
  // GET /api/games Tests
  // ===========================================
  
  describe('GET /api/games', () => {
    it('should return list of games with default pagination', async () => {
      const mockGames = [
        {
          id: 'game-1',
          name: 'Test Game 1',
          mode: '10x10',
          status: 'open',
          config: { entryFee: 100 },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          creator_id: 'user-1',
        },
        {
          id: 'game-2',
          name: 'Test Game 2',
          mode: '5x5',
          status: 'locked',
          config: { entryFee: 50 },
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          creator_id: 'user-2',
        },
      ];

      const { req, res } = createMocks({
        method: 'GET',
        query: {},
      });

      // Mock the Supabase response
      const supabase = require('../../../utils/supabaseClient').supabase;
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockGames,
          error: null,
          count: 2,
        }),
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toHaveProperty('games');
      expect(responseData).toHaveProperty('total');
      expect(responseData).toHaveProperty('page');
      expect(responseData).toHaveProperty('pageSize');
    });

    it('should filter games by status', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { status: 'open' },
      });

      const supabase = require('../../../utils/supabaseClient').supabase;
      const mockEq = jest.fn().mockReturnThis();
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: mockEq,
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      });

      await handler(req, res);

      expect(mockEq).toHaveBeenCalledWith('status', 'open');
    });

    it('should filter games by mode', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { mode: '10x10' },
      });

      const supabase = require('../../../utils/supabaseClient').supabase;
      const mockEq = jest.fn().mockReturnThis();
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: mockEq,
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      });

      await handler(req, res);

      expect(mockEq).toHaveBeenCalledWith('mode', '10x10');
    });

    it('should handle custom pagination parameters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '2', pageSize: '10' },
      });

      const supabase = require('../../../utils/supabaseClient').supabase;
      const mockRange = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: mockRange,
      });

      await handler(req, res);

      // Range should be (page-1)*pageSize to (page-1)*pageSize + pageSize - 1
      // For page 2, pageSize 10: range should be 10-19
      expect(mockRange).toHaveBeenCalledWith(10, 19);
    });

    it('should limit pageSize to maximum of 100', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { pageSize: '200' },
      });

      const supabase = require('../../../utils/supabaseClient').supabase;
      const mockRange = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: mockRange,
      });

      await handler(req, res);

      // Should be capped at 100
      expect(mockRange).toHaveBeenCalledWith(0, 99);
    });

    it('should handle database errors gracefully', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {},
      });

      const supabase = require('../../../utils/supabaseClient').supabase;
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
          count: null,
        }),
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toHaveProperty('error');
    });

    it('should return empty array when no games found', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {},
      });

      const supabase = require('../../../utils/supabaseClient').supabase;
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.games).toEqual([]);
      expect(responseData.total).toBe(0);
    });
  });

  // ===========================================
  // POST /api/games Tests
  // ===========================================
  
  describe('POST /api/games', () => {
    const validGamePayload = {
      name: 'Test Game',
      mode: '10x10',
      config: {
        homeTeam: { id: 'home', name: 'Home Team', abbreviation: 'HOME' },
        awayTeam: { id: 'away', name: 'Away Team', abbreviation: 'AWAY' },
        entryFee: 100,
        sport: 'nfl',
      },
    };

    it('should create a new game with valid data', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: validGamePayload,
      });

      const supabase = require('../../../utils/supabaseClient').supabase;
      
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'game-new',
            name: 'Test Game',
            mode: '10x10',
            status: 'draft',
            config: validGamePayload.config,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            creator_id: null,
          },
          error: null,
        }),
      }).mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toHaveProperty('game');
      expect(responseData.game.name).toBe('Test Game');
    });

    it('should reject request without game name', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...validGamePayload,
          name: '',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toContain('name');
    });

    it('should reject request without game mode', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...validGamePayload,
          mode: undefined,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toContain('mode');
    });

    it('should reject invalid game mode', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...validGamePayload,
          mode: 'invalid-mode',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toContain('mode');
    });

    it('should reject request without config', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'Test Game',
          mode: '10x10',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toContain('configuration');
    });

    it('should reject request without teams', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'Test Game',
          mode: '10x10',
          config: {
            entryFee: 100,
          },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toContain('team');
    });

    it('should reject request without valid entry fee', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: 'Test Game',
          mode: '10x10',
          config: {
            ...validGamePayload.config,
            entryFee: 0,
          },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toContain('entry fee');
    });

    it('should trim game name whitespace', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...validGamePayload,
          name: '  Test Game  ',
        },
      });

      const supabase = require('../../../utils/supabaseClient').supabase;
      const mockInsert = jest.fn().mockReturnThis();
      
      supabase.from.mockReturnValueOnce({
        insert: mockInsert,
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'game-new',
            name: 'Test Game',
            mode: '10x10',
            status: 'draft',
            config: validGamePayload.config,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            creator_id: null,
          },
          error: null,
        }),
      }).mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      await handler(req, res);

      // Check that insert was called with trimmed name
      expect(mockInsert).toHaveBeenCalled();
      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.name).toBe('Test Game');
    });

    it('should handle database errors during creation', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: validGamePayload,
      });

      const supabase = require('../../../utils/supabaseClient').supabase;
      
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toHaveProperty('error');
    });
  });

  // ===========================================
  // CORS and Method Tests
  // ===========================================
  
  describe('CORS and Methods', () => {
    it('should set CORS headers', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {},
      });

      const supabase = require('../../../utils/supabaseClient').supabase;
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      });

      await handler(req, res);

      expect(res._getHeaders()['access-control-allow-origin']).toBe('*');
      expect(res._getHeaders()['access-control-allow-methods']).toBe('GET, POST, OPTIONS');
    });

    it('should handle OPTIONS preflight request', async () => {
      const { req, res } = createMocks({
        method: 'OPTIONS',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should reject unsupported methods', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toContain('Method not allowed');
    });

    it('should reject PUT method', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
    });

    it('should reject PATCH method', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
    });
  });

  // ===========================================
  // Edge Cases
  // ===========================================
  
  describe('Edge Cases', () => {
    it('should handle malformed JSON body', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: 'not-json',
      });

      // This would typically be handled by Next.js body parser
      // but we test our handler's robustness
      await handler(req, res);

      // Should either error or handle gracefully
      expect([400, 500]).toContain(res._getStatusCode());
    });

    it('should handle very long game names', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ...validGamePayload,
          name: 'A'.repeat(500),
        },
      });

      const supabase = require('../../../utils/supabaseClient').supabase;
      
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'game-new',
            name: 'A'.repeat(500),
            mode: '10x10',
            status: 'draft',
            config: validGamePayload.config,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            creator_id: null,
          },
          error: null,
        }),
      }).mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      await handler(req, res);

      // Should accept (database might truncate)
      expect(res._getStatusCode()).toBe(201);
    });

    it('should handle negative page number', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '-1' },
      });

      const supabase = require('../../../utils/supabaseClient').supabase;
      const mockRange = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: mockRange,
      });

      await handler(req, res);

      // Should default to page 1
      expect(mockRange).toHaveBeenCalledWith(0, 19);
    });

    it('should handle non-numeric page number', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { page: 'abc' },
      });

      const supabase = require('../../../utils/supabaseClient').supabase;
      const mockRange = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: mockRange,
      });

      await handler(req, res);

      // Should default to page 1
      expect(mockRange).toHaveBeenCalledWith(0, 19);
    });
  });
});