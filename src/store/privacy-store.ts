import { create } from 'zustand';
import { PrivacyState, PrivacyMode, PrivacyScore, ShadowWireConfig } from '@/types';

interface PrivacyStore extends PrivacyState {
  // Actions
  togglePrivacy: () => void;
  setPrivacyMode: (mode: PrivacyMode) => void;
  togglePublicView: () => void;
  setPrivacyScore: (score: PrivacyScore | null) => void;
  setShadowWireConfig: (config: ShadowWireConfig | null) => void;
  reset: () => void;
}

const initialState: PrivacyState = {
  isPrivacyEnabled: false,
  currentMode: 'external',
  showPublicView: true,
  privacyScore: null,
  shadowWireConfig: null,
};

export const usePrivacyStore = create<PrivacyStore>((set) => ({
  ...initialState,

  togglePrivacy: () =>
    set((state) => ({
      isPrivacyEnabled: !state.isPrivacyEnabled,
    })),

  setPrivacyMode: (mode) =>
    set({
      currentMode: mode,
    }),

  togglePublicView: () =>
    set((state) => ({
      showPublicView: !state.showPublicView,
    })),

  setPrivacyScore: (score) =>
    set({
      privacyScore: score,
    }),

  setShadowWireConfig: (config) =>
    set({
      shadowWireConfig: config,
    }),

  reset: () => set(initialState),
}));
