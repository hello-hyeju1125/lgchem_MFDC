const STORAGE_KEY = 'lgchem_mfdc_answers';
const STORAGE_KEY_CURRENT_INDEX = 'lgchem_mfdc_current_index';
const STORAGE_KEY_SESSION_CODE = 'lgchem_mfdc_session_code';
const STORAGE_KEY_PARTICIPANT_NAME = 'lgchem_mfdc_participant_name';
const STORAGE_KEY_PARTICIPANT_EMAIL = 'lgchem_mfdc_participant_email';
const STORAGE_KEY_CLIENT_HASH = 'lgchem_mfdc_client_hash';

export interface Answers {
  [questionId: string]: number;
}

export const storage = {
  saveAnswers: (answers: Answers): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    }
  },

  loadAnswers: (): Answers => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    }
    return {};
  },

  saveCurrentIndex: (index: number): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CURRENT_INDEX, index.toString());
    }
  },

  loadCurrentIndex: (): number => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_CURRENT_INDEX);
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  },

  saveSessionCode: (sessionCode: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_SESSION_CODE, sessionCode);
    }
  },

  loadSessionCode: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY_SESSION_CODE);
    }
    return null;
  },

  saveParticipantInfo: (name: string, email: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PARTICIPANT_NAME, name);
      localStorage.setItem(STORAGE_KEY_PARTICIPANT_EMAIL, email);
    }
  },

  loadParticipantInfo: (): { name: string | null; email: string | null } => {
    if (typeof window !== 'undefined') {
      return {
        name: localStorage.getItem(STORAGE_KEY_PARTICIPANT_NAME),
        email: localStorage.getItem(STORAGE_KEY_PARTICIPANT_EMAIL),
      };
    }
    return { name: null, email: null };
  },

  getOrCreateClientHash: (): string => {
    if (typeof window !== 'undefined') {
      let hash = localStorage.getItem(STORAGE_KEY_CLIENT_HASH);
      if (!hash) {
        // 간단한 UUID v4 생성 (랜덤 UUID)
        hash = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
        localStorage.setItem(STORAGE_KEY_CLIENT_HASH, hash);
      }
      return hash;
    }
    return '';
  },

  clearAll: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY_CURRENT_INDEX);
      localStorage.removeItem(STORAGE_KEY_SESSION_CODE);
      // client_hash는 유지 (중복 제출 방지용)
    }
  },
};

