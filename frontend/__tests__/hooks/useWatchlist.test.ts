/**
 * Tests for useWatchlist hook
 * Tests watchlist management functionality
 */

import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock dependencies
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    isAuthenticated: true,
    user: { id: 'user-123' },
  })),
}));

jest.mock('@/services/backend-api.service', () => ({
  backendAPIService: {
    getWatchlist: jest.fn(),
    addToWatchlist: jest.fn(),
    removeFromWatchlist: jest.fn(),
    checkInWatchlist: jest.fn(),
    refreshWatchlistProviders: jest.fn(),
  },
}));

// react-native mock is in __tests__/setup.ts

import { useAuth } from '@/contexts/AuthContext';
import { backendAPIService } from '@/services/backend-api.service';
import {
  useWatchlist,
  useIsInWatchlist,
  useWatchlistToggle,
  useWatchlistCount,
} from '@/hooks/useWatchlist';

// Create wrapper with QueryClient - uses global cleanup
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
  // Store for global cleanup
  global.testQueryClient = queryClient;

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useWatchlist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-123' },
    });
  });

  describe('useWatchlist hook', () => {
    it('should fetch watchlist when authenticated', async () => {
      const mockItems = [
        {
          id: 'item-1',
          tmdb_id: 603,
          title: 'The Matrix',
          media_type: 'movie',
        },
        {
          id: 'item-2',
          tmdb_id: 1399,
          title: 'Game of Thrones',
          media_type: 'tv',
        },
      ];

      (backendAPIService.getWatchlist as jest.Mock).mockResolvedValue({
        success: true,
        data: { items: mockItems, count: 2, mediaType: 'all' },
      });

      const { result } = renderHook(() => useWatchlist(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
      });

      expect(result.current.count).toBe(2);
      expect(result.current.items[0].title).toBe('The Matrix');
    });

    it('should not fetch when not authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      const { result } = renderHook(() => useWatchlist(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(backendAPIService.getWatchlist).not.toHaveBeenCalled();
      expect(result.current.items).toEqual([]);
    });

    it('should filter by media type', async () => {
      (backendAPIService.getWatchlist as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          items: [
            { id: 'item-1', tmdb_id: 603, title: 'Movie', media_type: 'movie' },
          ],
          count: 1,
          mediaType: 'movie',
        },
      });

      const { result } = renderHook(() => useWatchlist('movie'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      expect(backendAPIService.getWatchlist).toHaveBeenCalledWith('movie');
    });

    it('should handle add to watchlist', async () => {
      (backendAPIService.getWatchlist as jest.Mock).mockResolvedValue({
        success: true,
        data: { items: [], count: 0 },
      });

      (backendAPIService.addToWatchlist as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          item: { id: 'new-item', tmdb_id: 550, title: 'Fight Club' },
        },
      });

      const { result } = renderHook(() => useWatchlist(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.addToWatchlistAsync({
          tmdbId: 550,
          mediaType: 'movie',
          title: 'Fight Club',
          posterPath: '/fightclub.jpg',
          providers: [],
          country: 'FR',
        });
      });

      expect(backendAPIService.addToWatchlist).toHaveBeenCalled();
    });

    it('should handle remove from watchlist', async () => {
      (backendAPIService.getWatchlist as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          items: [{ id: 'item-1', tmdb_id: 603, title: 'Movie' }],
          count: 1,
        },
      });

      (backendAPIService.removeFromWatchlist as jest.Mock).mockResolvedValue({
        success: true,
        data: { deleted: true },
      });

      const { result } = renderHook(() => useWatchlist(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      await act(async () => {
        await result.current.removeFromWatchlistAsync('item-1');
      });

      expect(backendAPIService.removeFromWatchlist).toHaveBeenCalledWith(
        'item-1'
      );
    });

    it('should handle refresh providers', async () => {
      (backendAPIService.getWatchlist as jest.Mock).mockResolvedValue({
        success: true,
        data: { items: [], count: 0 },
      });

      (
        backendAPIService.refreshWatchlistProviders as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: { refreshed: 3, errors: 0 },
      });

      const { result } = renderHook(() => useWatchlist(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshProvidersAsync();
      });

      expect(backendAPIService.refreshWatchlistProviders).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (backendAPIService.getWatchlist as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'ERROR', message: 'Failed to fetch' },
      });

      const { result } = renderHook(() => useWatchlist(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toEqual([]);
    });
  });

  describe('useIsInWatchlist hook', () => {
    it('should check if item is in watchlist', async () => {
      (backendAPIService.checkInWatchlist as jest.Mock).mockResolvedValue({
        success: true,
        data: { inWatchlist: true, itemId: 'item-123' },
      });

      const { result } = renderHook(() => useIsInWatchlist(603, 'movie'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.inWatchlist).toBe(true);
      });

      expect(result.current.itemId).toBe('item-123');
    });

    it('should return false when not in watchlist', async () => {
      (backendAPIService.checkInWatchlist as jest.Mock).mockResolvedValue({
        success: true,
        data: { inWatchlist: false, itemId: null },
      });

      const { result } = renderHook(() => useIsInWatchlist(999, 'movie'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.inWatchlist).toBe(false);
      expect(result.current.itemId).toBeNull();
    });

    it('should not check when tmdbId is invalid', async () => {
      const { result } = renderHook(() => useIsInWatchlist(0, 'movie'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(backendAPIService.checkInWatchlist).not.toHaveBeenCalled();
    });

    it('should not check when not authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      const { result } = renderHook(() => useIsInWatchlist(603, 'movie'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(backendAPIService.checkInWatchlist).not.toHaveBeenCalled();
    });
  });

  describe('useWatchlistToggle hook', () => {
    it('should add item when not in watchlist', async () => {
      (backendAPIService.checkInWatchlist as jest.Mock).mockResolvedValue({
        success: true,
        data: { inWatchlist: false, itemId: null },
      });

      (backendAPIService.addToWatchlist as jest.Mock).mockResolvedValue({
        success: true,
        data: { item: { id: 'new-item' } },
      });

      const { result } = renderHook(
        () =>
          useWatchlistToggle(603, 'movie', {
            title: 'The Matrix',
            posterPath: '/matrix.jpg',
            providers: [],
            country: 'FR',
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.inWatchlist).toBe(false);

      await act(async () => {
        result.current.toggle();
      });

      await waitFor(() => {
        expect(backendAPIService.addToWatchlist).toHaveBeenCalled();
      });
    });

    it('should remove item when in watchlist', async () => {
      (backendAPIService.checkInWatchlist as jest.Mock).mockResolvedValue({
        success: true,
        data: { inWatchlist: true, itemId: 'existing-item' },
      });

      (backendAPIService.removeFromWatchlist as jest.Mock).mockResolvedValue({
        success: true,
        data: { deleted: true },
      });

      const { result } = renderHook(
        () =>
          useWatchlistToggle(603, 'movie', {
            title: 'The Matrix',
            posterPath: '/matrix.jpg',
            providers: [],
            country: 'FR',
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.inWatchlist).toBe(true);
      });

      await act(async () => {
        result.current.toggle();
      });

      await waitFor(() => {
        expect(backendAPIService.removeFromWatchlist).toHaveBeenCalledWith(
          'existing-item'
        );
      });
    });

    it('should track toggling state', async () => {
      (backendAPIService.checkInWatchlist as jest.Mock).mockResolvedValue({
        success: true,
        data: { inWatchlist: false, itemId: null },
      });

      // Slow add operation - use a controllable promise
      let resolveAdd: (value: any) => void;
      const addPromise = new Promise(resolve => {
        resolveAdd = resolve;
      });
      (backendAPIService.addToWatchlist as jest.Mock).mockReturnValue(
        addPromise
      );

      const { result } = renderHook(
        () =>
          useWatchlistToggle(603, 'movie', {
            title: 'Test',
            posterPath: '/test.jpg',
            providers: [],
            country: 'FR',
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.toggle();
      });

      // Wait for the toggling state to be true
      await waitFor(() => {
        expect(result.current.isToggling).toBe(true);
      });

      // Resolve the add operation
      await act(async () => {
        resolveAdd!({ success: true, data: { item: { id: 'new-item' } } });
      });

      await waitFor(() => {
        expect(result.current.isToggling).toBe(false);
      });
    });
  });

  describe('useWatchlistCount hook', () => {
    it('should return watchlist count', async () => {
      (backendAPIService.getWatchlist as jest.Mock).mockResolvedValue({
        success: true,
        data: { items: [], count: 5 },
      });

      const { result } = renderHook(() => useWatchlistCount(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.count).toBe(5);
      });
    });

    it('should return 0 when not authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      const { result } = renderHook(() => useWatchlistCount(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.count).toBe(0);
    });

    it('should return 0 on error', async () => {
      (backendAPIService.getWatchlist as jest.Mock).mockResolvedValue({
        success: false,
        error: { message: 'Error' },
      });

      const { result } = renderHook(() => useWatchlistCount(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.count).toBe(0);
    });
  });
});
