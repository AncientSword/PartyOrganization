export type Period = 'morning' | 'afternoon' | 'evening';

export type TransportMode = 'taxi' | 'driving' | 'cycling' | 'transit';

export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  taxi: '打车',
  driving: '驾车',
  cycling: '骑行',
  transit: '公共交通',
};

export interface TimeSlot {
  date: string; // YYYY-MM-DD
  period: Period;
}

export interface TimeRecord {
  id: string;
  date: string; // YYYY-MM-DD
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  active: boolean;
}

export interface Location {
  name: string;
  lng: number;
  lat: number;
}

export interface ExpectedLocation {
  id: string;
  name: string;
  lng: number;
  lat: number;
  active: boolean;
}

export interface Member {
  id: string;
  nickname: string;
  timeRecords: TimeRecord[];
  residence: Location | null;
  expectedLocations: ExpectedLocation[];
  transportModes: TransportMode[];
}

export interface RouteResult {
  memberNickname: string;
  origin: Location;
  destination: ExpectedLocation;
  taxi: { duration: number; cost: number } | null;
  driving: { duration: number; cost: number } | null;
  cycling: { duration: number; cost: number } | null;
  transit: { duration: number; cost: number } | null;
  bestMode: TransportMode;
  bestDuration: number; // minutes
  bestCost: number; // yuan
}

export interface LocationStat {
  location: ExpectedLocation;
  averageDuration: number; // minutes
  averageCost: number; // yuan
  details: RouteResult[];
  wantToGo: string[]; // nicknames of members who want to go
}

export interface SelectedLocations {
  primary: ExpectedLocation | null;
  alternatives: ExpectedLocation[]; // 2 items max
}

export interface TimeStatItem {
  date: string;
  period: Period;
  count: number;
  members: string[]; // nicknames
}

export const PERIOD_LABELS: Record<Period, string> = {
  morning: '上午',
  afternoon: '下午',
  evening: '晚上',
};

export const PERIOD_ORDER: Record<Period, number> = {
  morning: 0,
  afternoon: 1,
  evening: 2,
};
