/**
 * Game by ID API Integration Tests
 * 
 * Tests GET, PUT, DELETE /api/games/[id] endpoints.
 * @jest-environment node
 */

import { createMocks } from 'node-mocks-http';
import handler from '../[id]';

// Mock Supabase client
jest.mock('../../../../utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    })),
  },
}));

describe('/api/games/[id] Endpoint', () => {
  const mockGame = {
    id: 'game-123',
    name: 'Test Game',
    mode: '10x10',
    status: 'open',
    config: {
      mode: '10x10',
      pricePerCell: 100,
      homeTeam: { id: 'home', name: 'Home Team', abbreviation: 'HOME' },
      awayTeam: { id: 'away', name: 'Away Team', abbreviation: 'AWAY' },
      sport: 'nfl',
    },
    scores: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    creator_id: 'user-1',
  };

  const mockCells = [
    { cell_index: 0, owner_id: null, owner_name: null, claimed_at: null },
    { cell_index: 1, owner_id: 'user-1', owner_name: 'John Doe', claimed_at: '2024-01-01T00:00:00Z' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================
  // GET /api/games/[id] Tests
  // ===========================================
  
  describe('GET /api/games/[id]', () => {
    it('should return a game by ID', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'game-123' },
      });

      const supabase = require('../../../../utils/supabaseClient').supabase;
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockGame,
          error: null,
        }),
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toHaveProperty('game');
      expect(responseData.game.id).toBe('game-123');
    });

    it('should return 404 for non-existent game', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'non-existent' },
      });

      const supabase = require('../../../../utils/supabaseClient').supabase;
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toContain('not found');
    });

    it('should return game with cells when includeCells is true', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'game-123', includeCells: 'true' },
      });

      const supabase = require('../../../../utils/supabaseClient').supabase;
      
      supabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockGame,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: mockCells,
            error: null,
          }),
        });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toHaveProperty('game');
      expect(responseData).toHaveProperty('cells');
      expect(responseData.cells.length).toBe(2);
    });

    it('should return 400 when ID is missing', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {},
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toContain('ID');
    });

    it('should handle database errors gracefully', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'game-123' },
      });

      const supabase = require('../../../../utils/supabaseClient').supabase;
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection error' },
        }),
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
    });
  });

  // ===========================================
  // PUT /api/games/[id] Tests
  // ===========================================
  
  describe('PUT /api/games/[id]', () => {
    it('should update game name', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'game-123' },
        body: { name: 'Updated Game Name' },
      });

      const supabase = require('../../../../utils/supabaseClient').supabase;
      
      supabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockGame,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { ...mockGame, name: 'Updated Game Name' },
            error: null,
          }),
        });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.game.name).toBe('Updated Game Name');
    });

    it('should update game status', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'game-123' },
        body: { status: 'locked' },
      });

      const supabase = require('../../../../utils/supabaseClient').supabase;
      
      supabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockGame,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { ...mockGame, status: 'locked' },
            error: null,
          }),
        });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should reject invalid status', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'game-123' },
        body: { status: 'invalid-status' },
      });

      const supabase = require('../../../../utils/supabaseClient').supabase;
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockGame,
          error: null,
        }),
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toContain('Invalid status');
    });

    it('should reject empty game name', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'game-123' },
        body: { name: '   ' },
      });

      const supabase = require('../../../../utils/supabaseClient').supabase;
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockGame,
          error: null,
        }),
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    it('should update scores', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'game-123' },
        body: { 
          scores: { 
            home: 21, 
            away: 14,
            quarter: 'final'
          } 
        },
      });

      const supabase = require('../../../../utils/supabaseClient').supabase;
      
      supabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockGame,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { 
              ...mockGame, 
              scores: { home: 21, away: 14, quarter: 'final' } 
            },
            error: null,
          }),
        });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should update config partially', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'game-123' },
        body: { 
          config: { 
            pricePerCell: 200 
          } 
        },
      });

      const supabase = require('../../../../utils/supabaseClient').supabase;
      
      supabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockGame,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockGame,
            error: null,
          }),
        });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should return 404 when updating non-existent game', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'non-existent' },
        body: { name: 'New Name' },
      });

      const supabase = require('../../../../utils/supabaseClient').supabase;
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
    });
  });

  // ===========================================
  // DELETE /api/games/[id] Tests
  // ===========================================
  
  describe('DELETE /api/games/[id]', () => {
    it('should soft delete game (mark as cancelled)', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'game-123' },
      });

      const supabase = require('../../../../utils/supabaseClient').supabase;
      
      supabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'game-123', status: 'open' },
            error: null,
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: null }),
        });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
    });

    it('should hard delete game when hard=true', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'game-123', hard: 'true' },
      });

      const supabase = require('../../../../utils/supabaseClient').supabase;
      
      supabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'game-123', status: 'open' },
            error: null,
          }),
        })
        .mockReturnValueOnce({
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: null }),
        })
        .mockReturnValueOnce({
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: null }),
        });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
    });

    it('should return 404 when deleting non-existent game', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'non-existent' },
      });

      const supabase = require('../../../../utils/supabaseClient').supabase;
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
    });

    it('should return 400 when ID is missing for delete', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        query: {},
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    it('should handle database errors during delete', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'game-123' },
      });

      const supabase = require('../../../../utils/supabaseClient').supabase;
      
      supabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'game-123', status: 'open' },
            error: null,
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ 
            error: { message: 'Delete failed' } 
          }),
        });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
    });
  });

  // ===========================================
  // CORS and Method Tests
  // ===========================================
  
  describe('CORS and Methods', () => {
    it('should set CORS headers', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'game-123' },
      });

      const supabase = require('../../../../utils/supabaseClient').supabase;
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockGame,
          error: null,
        }),
      });

      await handler(req, res);

      expect(res._getHeaders()['access-control-allow-origin']).toBe('*');
      expect(res._getHeaders()['access-control-allow-methods']).toBe('GET, PUT, DELETE, OPTIONS');
    });

    it('should handle OPTIONS preflight request', async () => {
      const { req, res } = createMocks({
        method: 'OPTIONS',
        query: { id: 'game-123' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should reject unsupported methods', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'game-123' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toContain('Method not allowed');
    });

    it('should reject PATCH method', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'game-123' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
    });
  });

  // ===========================================
  // Edge Cases
  // ===========================================
  
  describe('Edge Cases', () => {
    it('should handle special characters in ID', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'game-with-special-chars_123' },
      });

      const supabase = require('../../../../utils/supabaseClient').supabase;
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockGame, id: 'game-with-special-chars_123' },
          error: null,
        }),
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should handle empty update body', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'game-123' },
        body: {},
      });

      const supabase = require('../../../../utils/supabaseClient').supabase;
      
      supabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockGame,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockGame,
            error: null,
          }),
        });

      await handler(req, res);

      // Should still succeed (just updates timestamp)
      expect(res._getStatusCode()).toBe(200);
    });

    it('should handle multiple updates in sequence', async () => {
      const supabase = require('../../../../utils/supabaseClient').supabase;
      
      // First update
      const { req: req1, res: res1 } = createMocks({
        method: 'PUT',
        query: { id: 'game-123' },
        body: { name: 'First Update' },
      });

      supabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockGame,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { ...mockGame, name: 'First Update' },
            error: null,
          }),
        });

      await handler(req1, res1);
      expect(res1._getStatusCode()).toBe(200);

      // Second update
      const { req: req2, res: res2 } = createMocks({
        method: 'PUT',
        query: { id: 'game-123' },
        body: { status: 'locked' },
      });

      supabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { ...mockGame, name: 'First Update' },
            error: null,
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { ...mockGame, name: 'First Update', status: 'locked' },
            error: null,
          }),
        });

      await handler(req2, res2);
      expect(res2._getStatusCode()).toBe(200);
    });

    it('should handle cells query error gracefully', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'game-123', includeCells: 'true' },
      });

      const supabase = require('../../../../utils/supabaseClient').supabase;
      
      supabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockGame,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Cells query failed' },
          }),
        });

      await handler(req, res);

      // Should still return game, just without cells
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toHaveProperty('game');
    });
  });
});