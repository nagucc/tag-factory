import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';

describe('标签导出API', () => {
  describe('POST /api/tags/export', () => {
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

    it('应该支持CSV格式导出', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          tagIds: [1],
          exportFormat: 'csv',
        }),
      } as unknown as NextRequest;

      const response = await import('./route').POST(mockRequest);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/csv');
    });

    it('应该支持Excel格式导出', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          tagIds: [1],
          exportFormat: 'excel',
        }),
      } as unknown as NextRequest;

      const response = await import('./route').POST(mockRequest);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('spreadsheetml');
    });

    it('应该支持AND逻辑导出', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          tagIds: [1, 2],
          logic: 'AND',
          exportFormat: 'csv',
        }),
      } as unknown as NextRequest;

      const response = await import('./route').POST(mockRequest);
      
      expect(response.status).toBe(200);
    });

    it('应该支持OR逻辑导出', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          tagIds: [1, 2],
          logic: 'OR',
          exportFormat: 'csv',
        }),
      } as unknown as NextRequest;

      const response = await import('./route').POST(mockRequest);
      
      expect(response.status).toBe(200);
    });

    it('应该支持筛选条件导出', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          tagIds: [1],
          dataObjectId: 1,
          source: 'manual',
          appliedBy: 1,
          appliedAtFrom: '2026-01-01',
          appliedAtTo: '2026-01-31',
          exportFormat: 'csv',
        }),
      } as unknown as NextRequest;

      const response = await import('./route').POST(mockRequest);
      
      expect(response.status).toBe(200);
    });

    it('应该支持自定义导出字段', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          tagIds: [1],
          exportFormat: 'csv',
          fields: ['dataObjectName', 'tagNames', 'appliedAt'],
        }),
      } as unknown as NextRequest;

      const response = await import('./route').POST(mockRequest);
      
      expect(response.status).toBe(200);
    });

    it('应该默认为预览模式', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          tagIds: [1],
        }),
      } as unknown as NextRequest;

      const response = await import('./route').POST(mockRequest);
      
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('count');
      expect(body.data).toHaveProperty('preview');
    });

    it('应该返回正确的文件下载头', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          tagIds: [1, 2, 3],
          exportFormat: 'csv',
        }),
      } as unknown as NextRequest;

      const response = await import('./route').POST(mockRequest);
      
      const contentDisposition = response.headers.get('Content-Disposition');
      expect(contentDisposition).toContain('attachment');
      expect(contentDisposition).toContain('filename');
    });
  });
});
