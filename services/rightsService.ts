import { AssetRightsRecord, AssetRightsStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

const RIGHTS_STORAGE_KEY = 'app.asset.rights';

const loadFromStorage = (): AssetRightsRecord[] => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(RIGHTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AssetRightsRecord[];
  } catch (error) {
    console.warn('Failed to parse rights records', error);
    return [];
  }
};

const saveToStorage = (records: AssetRightsRecord[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(RIGHTS_STORAGE_KEY, JSON.stringify(records));
};

export const loadRightsRecords = (): AssetRightsRecord[] => loadFromStorage();

export const addRightsRecord = (
  data: Omit<AssetRightsRecord, 'id' | 'createdAt'>,
): AssetRightsRecord => {
  const record: AssetRightsRecord = {
    ...data,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  const current = loadFromStorage();
  const next = [record, ...current];
  saveToStorage(next);
  return record;
};

export const updateRightsStatus = (
  id: string,
  status: AssetRightsStatus,
): AssetRightsRecord | null => {
  const current = loadFromStorage();
  const next = current.map((record) =>
    record.id === id ? { ...record, status } : record,
  );
  saveToStorage(next);
  return next.find((record) => record.id === id) ?? null;
};

export const replaceRightsRecords = (records: AssetRightsRecord[]) => {
  saveToStorage(records);
};
