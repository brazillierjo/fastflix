import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';
import type {
  MovieResult,
  StreamingProvider,
  Cast,
  CrewMember,
  DetailedInfo,
} from '@/services/backend-api.service';

export interface SwipeData {
  items: MovieResult[];
  providers: Record<number, StreamingProvider[]>;
  credits: Record<number, Cast[]>;
  crew: Record<number, CrewMember[]>;
  detailedInfo: Record<number, DetailedInfo>;
  source: 'search' | 'forYou' | 'feed';
}

interface SwipeDataContextType {
  swipeData: SwipeData | null;
  setSwipeData: (data: SwipeData) => void;
  clearSwipeData: () => void;
}

const SwipeDataContext = createContext<SwipeDataContextType>({
  swipeData: null,
  setSwipeData: () => {},
  clearSwipeData: () => {},
});

export function SwipeDataProvider({ children }: { children: ReactNode }) {
  const [swipeData, setSwipeDataState] = useState<SwipeData | null>(null);

  const setSwipeData = useCallback((data: SwipeData) => {
    setSwipeDataState(data);
  }, []);

  const clearSwipeData = useCallback(() => {
    setSwipeDataState(null);
  }, []);

  return (
    <SwipeDataContext.Provider
      value={{ swipeData, setSwipeData, clearSwipeData }}
    >
      {children}
    </SwipeDataContext.Provider>
  );
}

export function useSwipeData() {
  return useContext(SwipeDataContext);
}
