import { create } from 'zustand';
import type { Member, TimeSlot, TransportMode, ExpectedLocation, SelectedLocations, LocationStat } from '@/types';
import { getLocationKey } from '@/utils/calculation';

interface AppState {
  members: Member[];
  amapKey: string;
  amapSecurityCode: string;
  selectedTimeSlot: TimeSlot | null;
  selectedLocations: SelectedLocations;
  locationStats: LocationStat[];
  locationStatsCacheKey: string;

  addMember: () => void;
  removeMember: (id: string) => void;
  updateNickname: (id: string, nickname: string) => void;
  addTimeRecord: (memberId: string, date: string) => void;
  removeTimeRecord: (memberId: string, recordId: string) => void;
  updateTimeRecordPeriod: (memberId: string, recordId: string, period: 'morning' | 'afternoon' | 'evening', value: boolean) => void;
  toggleTimeRecordActive: (memberId: string, recordId: string) => void;
  setResidence: (memberId: string, location: { name: string; lng: number; lat: number } | null) => void;
  addExpectedLocation: (memberId: string, location: { name: string; lng: number; lat: number }) => void;
  removeExpectedLocation: (memberId: string, locationId: string) => void;
  toggleExpectedLocationActive: (memberId: string, locationId: string) => void;
  toggleTransportMode: (memberId: string, mode: TransportMode) => void;

  setAmapKey: (key: string) => void;
  setAmapSecurityCode: (code: string) => void;
  setSelectedTimeSlot: (slot: TimeSlot | null) => void;
  setPrimaryLocation: (location: ExpectedLocation | null) => void;
  toggleAlternativeLocation: (location: ExpectedLocation) => void;
  clearSelectedLocations: () => void;
  setLocationStats: (stats: LocationStat[], cacheKey: string) => void;
  importData: (data: { members: Member[]; amapKey?: string; amapSecurityCode?: string }) => void;
  resetAll: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

const STORAGE_KEY = 'gathering-helper-data';

function loadFromStorage(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const members: Member[] = (data.members || []).map((m: Member & { transportModes?: TransportMode[] }) => ({
        ...m,
        transportModes: m.transportModes && m.transportModes.length > 0
          ? m.transportModes
          : ['taxi', 'driving', 'cycling', 'transit'],
      }));
      return {
        members,
        amapKey: data.amapKey || '',
        amapSecurityCode: data.amapSecurityCode || '',
        selectedTimeSlot: data.selectedTimeSlot || null,
        selectedLocations: data.selectedLocations || { primary: null, alternatives: [] },
        locationStats: data.locationStats || [],
        locationStatsCacheKey: data.locationStatsCacheKey || '',
      };
    }
  } catch {
    // ignore
  }
  return {
    members: [],
    amapKey: '',
    amapSecurityCode: '',
    selectedTimeSlot: null,
    selectedLocations: { primary: null, alternatives: [] },
    locationStats: [],
    locationStatsCacheKey: '',
  };
}

function persist(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      members: state.members,
      amapKey: state.amapKey,
      amapSecurityCode: state.amapSecurityCode,
      selectedTimeSlot: state.selectedTimeSlot,
      selectedLocations: state.selectedLocations,
      locationStats: state.locationStats,
      locationStatsCacheKey: state.locationStatsCacheKey,
    }));
  } catch {
    // ignore
  }
}

const initial = loadFromStorage();

export const useAppStore = create<AppState>((set) => ({
  members: initial.members || [],
  amapKey: initial.amapKey || '',
  amapSecurityCode: initial.amapSecurityCode || '',
  selectedTimeSlot: initial.selectedTimeSlot || null,
  selectedLocations: initial.selectedLocations || { primary: null, alternatives: [] },
  locationStats: initial.locationStats || [],
  locationStatsCacheKey: initial.locationStatsCacheKey || '',

  addMember: () => {
    set((state) => {
      const newMember: Member = {
        id: generateId(),
        nickname: `用户${state.members.length + 1}`,
        timeRecords: [],
        residence: null,
        expectedLocations: [],
        transportModes: ['taxi', 'driving', 'cycling', 'transit'],
      };
      const next = { ...state, members: [...state.members, newMember] };
      persist(next);
      return next;
    });
  },

  removeMember: (id) => {
    set((state) => {
      const next = { ...state, members: state.members.filter((m) => m.id !== id) };
      persist(next);
      return next;
    });
  },

  updateNickname: (id, nickname) => {
    set((state) => {
      const next = {
        ...state,
        members: state.members.map((m) => (m.id === id ? { ...m, nickname } : m)),
      };
      persist(next);
      return next;
    });
  },

  addTimeRecord: (memberId, date) => {
    set((state) => {
      const next = {
        ...state,
        members: state.members.map((m) =>
          m.id === memberId
            ? {
                ...m,
                timeRecords: [
                  ...m.timeRecords,
                  {
                    id: generateId(),
                    date,
                    morning: true,
                    afternoon: true,
                    evening: true,
                    active: true,
                  },
                ],
              }
            : m
        ),
      };
      persist(next);
      return next;
    });
  },

  removeTimeRecord: (memberId, recordId) => {
    set((state) => {
      const next = {
        ...state,
        members: state.members.map((m) =>
          m.id === memberId
            ? { ...m, timeRecords: m.timeRecords.filter((r) => r.id !== recordId) }
            : m
        ),
      };
      persist(next);
      return next;
    });
  },

  updateTimeRecordPeriod: (memberId, recordId, period, value) => {
    set((state) => {
      const next = {
        ...state,
        members: state.members.map((m) =>
          m.id === memberId
            ? {
                ...m,
                timeRecords: m.timeRecords.map((r) =>
                  r.id === recordId ? { ...r, [period]: value } : r
                ),
              }
            : m
        ),
      };
      persist(next);
      return next;
    });
  },

  toggleTimeRecordActive: (memberId, recordId) => {
    set((state) => {
      const next = {
        ...state,
        members: state.members.map((m) =>
          m.id === memberId
            ? {
                ...m,
                timeRecords: m.timeRecords.map((r) =>
                  r.id === recordId ? { ...r, active: !r.active } : r
                ),
              }
            : m
        ),
      };
      persist(next);
      return next;
    });
  },

  setResidence: (memberId, location) => {
    set((state) => {
      const next = {
        ...state,
        members: state.members.map((m) =>
          m.id === memberId ? { ...m, residence: location } : m
        ),
      };
      persist(next);
      return next;
    });
  },

  addExpectedLocation: (memberId, location) => {
    set((state) => {
      const next = {
        ...state,
        members: state.members.map((m) =>
          m.id === memberId
            ? {
                ...m,
                expectedLocations: [
                  ...m.expectedLocations,
                  { id: generateId(), ...location, active: true },
                ],
              }
            : m
        ),
      };
      persist(next);
      return next;
    });
  },

  removeExpectedLocation: (memberId, locationId) => {
    set((state) => {
      const next = {
        ...state,
        members: state.members.map((m) =>
          m.id === memberId
            ? { ...m, expectedLocations: m.expectedLocations.filter((l) => l.id !== locationId) }
            : m
        ),
      };
      persist(next);
      return next;
    });
  },

  toggleExpectedLocationActive: (memberId, locationId) => {
    set((state) => {
      const next = {
        ...state,
        members: state.members.map((m) =>
          m.id === memberId
            ? {
                ...m,
                expectedLocations: m.expectedLocations.map((l) =>
                  l.id === locationId ? { ...l, active: !l.active } : l
                ),
              }
            : m
        ),
      };
      persist(next);
      return next;
    });
  },

  toggleTransportMode: (memberId, mode) => {
    set((state) => {
      const next = {
        ...state,
        members: state.members.map((m) => {
          if (m.id !== memberId) return m;
          const hasMode = m.transportModes.includes(mode);
          const newModes = hasMode
            ? m.transportModes.filter((x) => x !== mode)
            : [...m.transportModes, mode];
          return { ...m, transportModes: newModes };
        }),
      };
      persist(next);
      return next;
    });
  },

  setAmapKey: (key) => {
    set((state) => {
      const next = { ...state, amapKey: key };
      persist(next);
      return next;
    });
  },

  setAmapSecurityCode: (code) => {
    set((state) => {
      const next = { ...state, amapSecurityCode: code };
      persist(next);
      return next;
    });
  },

  setSelectedTimeSlot: (slot) => {
    set((state) => {
      const next = { ...state, selectedTimeSlot: slot };
      persist(next);
      return next;
    });
  },

  setPrimaryLocation: (location) => {
    set((state) => {
      let newAlternatives = state.selectedLocations.alternatives;
      if (location) {
        const key = getLocationKey(location);
        newAlternatives = state.selectedLocations.alternatives.filter((l) => getLocationKey(l) !== key);
      }
      const next = {
        ...state,
        selectedLocations: { primary: location, alternatives: newAlternatives },
      };
      persist(next);
      return next;
    });
  },

  toggleAlternativeLocation: (location) => {
    set((state) => {
      const key = getLocationKey(location);
      const exists = state.selectedLocations.alternatives.some((l) => getLocationKey(l) === key);
      let newAlternatives: ExpectedLocation[];
      let newPrimary = state.selectedLocations.primary;

      if (exists) {
        newAlternatives = state.selectedLocations.alternatives.filter((l) => getLocationKey(l) !== key);
      } else {
        if (state.selectedLocations.primary && getLocationKey(state.selectedLocations.primary) === key) {
          newPrimary = null;
        }
        if (state.selectedLocations.alternatives.length >= 2) {
          newAlternatives = [...state.selectedLocations.alternatives.slice(1), location];
        } else {
          newAlternatives = [...state.selectedLocations.alternatives, location];
        }
      }
      const next = {
        ...state,
        selectedLocations: { primary: newPrimary, alternatives: newAlternatives },
      };
      persist(next);
      return next;
    });
  },

  clearSelectedLocations: () => {
    set((state) => {
      const next = {
        ...state,
        selectedLocations: { primary: null, alternatives: [] },
      };
      persist(next);
      return next;
    });
  },

  setLocationStats: (stats, cacheKey) => {
    set((state) => {
      const next = { ...state, locationStats: stats, locationStatsCacheKey: cacheKey };
      persist(next);
      return next;
    });
  },

  importData: (data) => {
    set((state) => {
      const next = {
        ...state,
        members: data.members,
        amapKey: data.amapKey || '',
        amapSecurityCode: data.amapSecurityCode || '',
        selectedTimeSlot: null,
        selectedLocations: { primary: null, alternatives: [] },
        locationStats: [],
        locationStatsCacheKey: '',
      };
      persist(next);
      return next;
    });
  },

  resetAll: () => {
    set((state) => {
      const next = {
        ...state,
        members: [],
        amapKey: '',
        amapSecurityCode: '',
        selectedTimeSlot: null,
        selectedLocations: { primary: null, alternatives: [] },
        locationStats: [],
        locationStatsCacheKey: '',
      };
      persist(next);
      return next;
    });
  },
}));
