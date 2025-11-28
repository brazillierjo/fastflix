/**
 * Basic Zustand Store Tests
 * Simple unit tests for the centralized state management
 */

import { useFastFlixStore } from '@/store';

describe('FastFlix Store Basic Tests', () => {
  it('should initialize with default search state', () => {
    const state = useFastFlixStore.getState();

    expect(state.isSearching).toBe(false);
    expect(state.currentQuery).toBe('');
    expect(state.results).toBeNull();
    expect(state.error).toBeNull();
  });

  it('should have required state properties', () => {
    const state = useFastFlixStore.getState();

    expect(typeof state.isSearching).toBe('boolean');
    expect(typeof state.currentQuery).toBe('string');
    expect(typeof state.language).toBe('string');
    expect(typeof state.country).toBe('string');
    expect(typeof state.monthlyPromptCount).toBe('number');
    expect(typeof state.isSubscribed).toBe('boolean');
    expect(typeof state.isLoading).toBe('boolean');
  });

  it('should have required action methods', () => {
    const state = useFastFlixStore.getState();

    expect(typeof state.setQuery).toBe('function');
    expect(typeof state.setSearching).toBe('function');
    expect(typeof state.clearSearch).toBe('function');
    expect(typeof state.setLanguage).toBe('function');
    expect(typeof state.setCountry).toBe('function');
    expect(typeof state.toggleFavorite).toBe('function');
    expect(typeof state.toggleWatchlist).toBe('function');
  });

  it('should update search query', () => {
    const store = useFastFlixStore;

    store.getState().setQuery('test query');

    const state = store.getState();
    expect(state.currentQuery).toBe('test query');

    // Clean up
    store.getState().clearSearch();
  });

  it('should update language', () => {
    const store = useFastFlixStore;

    store.getState().setLanguage('fr');

    const state = store.getState();
    expect(state.language).toBe('fr');

    // Reset to default
    store.getState().setLanguage('en');
  });
});
