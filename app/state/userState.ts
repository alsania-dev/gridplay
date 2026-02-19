import { atom, selector } from 'recoil';
import { User } from '@supabase/supabase-js';

// User state
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export const userState = atom<UserProfile | null>({
  key: 'userState',
  default: null,
});

export const isAuthenticatedState = selector({
  key: 'isAuthenticatedState',
  get: ({ get }) => get(userState) !== null,
});

export const userNameState = selector({
  key: 'userNameState',
  get: ({ get }) => {
    const user = get(userState);
    return user?.name || user?.email?.split('@')[0] || 'User';
  },
});

// User stats state
export interface UserStats {
  totalBoards: number;
  totalSquares: number;
  totalWinnings: number;
  activeBoards: number;
}

export const userStatsState = atom<UserStats>({
  key: 'userStatsState',
  default: {
    totalBoards: 0,
    totalSquares: 0,
    totalWinnings: 0,
    activeBoards: 0,
  },
});

export default {
  userState,
  isAuthenticatedState,
  userNameState,
  userStatsState,
};