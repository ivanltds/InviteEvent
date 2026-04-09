import { GET } from '../route';
import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

const mockExecute = jest.fn();
const mockMaxResults = jest.fn(() => ({ execute: mockExecute }));
const mockSortBy = jest.fn(() => ({ max_results: mockMaxResults }));
const mockExpression = jest.fn(() => ({ sort_by: mockSortBy }));

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    search: {
      expression: () => mockExpression(),
    },
    api: {
      resources: jest.fn(),
    }
  },
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      data,
      status: init?.status || 200,
    })),
  },
}));

describe('API Hero Images', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar lista de imagens do Cloudinary', async () => {
    mockExecute.mockResolvedValue({
      resources: [{ secure_url: 'url1.jpg' }, { secure_url: 'url2.jpg' }],
    });

    const response: any = await GET();

    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(2);
  });

  test('deve tentar busca por prefixo se search falhar', async () => {
    mockExecute.mockResolvedValue({ resources: [] });
    (cloudinary.api.resources as jest.Mock).mockResolvedValue({
      resources: [{ secure_url: 'prefix1.jpg' }],
    });

    const response: any = await GET();
    expect(response.data).toHaveLength(1);
  });

  test('deve retornar lista vazia em caso de erro', async () => {
    mockExecute.mockRejectedValue(new Error('Fail'));
    const response: any = await GET();
    expect(response.status).toBe(200);
    expect(response.data).toEqual([]);
  });
});
