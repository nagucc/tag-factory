import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';

describe('标签统计API', () => {
  describe('GET /api/tags/stats', () => {
    it('应该验证缺少统计类型参数', async () => {
      const mockRequest = {
        url: 'http://localhost/api/tags/stats',
      } as unknown as NextRequest;

      const response = await import('./route').GET(mockRequest);
      
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.message).toContain('统计类型参数');
    });

    it('应该返回使用统计', async () => {
      const mockRequest = {
        url: 'http://localhost/api/tags/stats?type=usage&groupBy=tag',
      } as unknown as NextRequest;

      const response = await import('./route').GET(mockRequest);
      
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('type', 'usage');
      expect(body.data).toHaveProperty('results');
    });

    it('应该返回分布统计', async () => {
      const mockRequest = {
        url: 'http://localhost/api/tags/stats?type=distribution&groupBy=tag',
      } as unknown as NextRequest;

      const response = await import('./route').GET(mockRequest);
      
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('type', 'distribution');
    });

    it('应该返回趋势统计（7天）', async () => {
      const mockRequest = {
        url: 'http://localhost/api/tags/stats?type=trends&period=7days',
      } as unknown as NextRequest;

      const response = await import('./route').GET(mockRequest);
      
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('type', 'trends');
    });

    it('应该返回趋势统计（30天）', async () => {
      const mockRequest = {
        url: 'http://localhost/api/tags/stats?type=trends&period=30days',
      } as unknown as NextRequest;

      const response = await import('./route').GET(mockRequest);
      
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('应该返回共现分析', async () => {
      const mockRequest = {
        url: 'http://localhost/api/tags/stats?type=cooccurrence&minCooccurrence=2',
      } as unknown as NextRequest;

      const response = await import('./route').GET(mockRequest);
      
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('type', 'cooccurrence');
    });

    it('应该拒绝不支持的统计类型', async () => {
      const mockRequest = {
        url: 'http://localhost/api/tags/stats?type=invalid',
      } as unknown as NextRequest;

      const response = await import('./route').GET(mockRequest);
      
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    it('应该支持时间范围筛选', async () => {
      const mockRequest = {
        url: 'http://localhost/api/tags/stats?type=usage&startDate=2026-01-01&endDate=2026-01-31',
      } as unknown as NextRequest;

      const response = await import('./route').GET(mockRequest);
      
      expect(response.status).toBe(200);
    });

    it('应该支持按数据对象筛选', async () => {
      const mockRequest = {
        url: 'http://localhost/api/tags/stats?type=usage&dataObjectId=1',
      } as unknown as NextRequest;

      const response = await import('./route').GET(mockRequest);
      
      expect(response.status).toBe(200);
    });

    it('应该支持分组类型（按来源）', async () => {
      const mockRequest = {
        url: 'http://localhost/api/tags/stats?type=usage&groupBy=source',
      } as unknown as NextRequest;

      const response = await import('./route').GET(mockRequest);
      
      expect(response.status).toBe(200);
    });

    it('应该支持分组类型（按数据对象）', async () => {
      const mockRequest = {
        url: 'http://localhost/api/tags/stats?type=usage&groupBy=dataObject',
      } as unknown as NextRequest;

      const response = await import('./route').GET(mockRequest);
      
      expect(response.status).toBe(200);
    });
  });
});
