import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';

describe('标签查询API', () => {
  describe('POST /api/tags/query', () => {
    it('应该验证缺少标签ID列表', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({}),
      } as unknown as NextRequest;

      const response = await import('./route').POST(mockRequest);
      
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.message).toContain('缺少标签ID列表');
    });

    it('应该验证标签ID数组格式', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ tagIds: 'not-array' }),
      } as unknown as NextRequest;

      const response = await import('./route').POST(mockRequest);
      
      expect(response.status).toBe(400);
    });

    it('应该处理AND逻辑查询', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          tagIds: [1, 2],
          logic: 'AND',
        }),
      } as unknown as NextRequest;

      const response = await import('./route').POST(mockRequest);
      
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('list');
      expect(body.data).toHaveProperty('pagination');
    });

    it('应该处理OR逻辑查询', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          tagIds: [1, 2],
          logic: 'OR',
        }),
      } as unknown as NextRequest;

      const response = await import('./route').POST(mockRequest);
      
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('应该支持筛选条件', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          tagIds: [1],
          dataObjectId: 1,
          source: 'manual',
          appliedBy: 1,
        }),
      } as unknown as NextRequest;

      const response = await import('./route').POST(mockRequest);
      
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/tags/query', () => {
    it('应该验证缺少标签ID', async () => {
      const mockRequest = {
        url: 'http://localhost/api/tags/query',
      } as unknown as NextRequest;

      const response = await import('./route').GET(mockRequest);
      
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.message).toContain('缺少标签ID');
    });

    it('应该返回单个标签的应用列表', async () => {
      const mockRequest = {
        url: 'http://localhost/api/tags/query?tagId=1&page=1&pageSize=10',
      } as unknown as NextRequest;

      const response = await import('./route').GET(mockRequest);
      
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('list');
      expect(body.data).toHaveProperty('pagination');
    });
  });
});
