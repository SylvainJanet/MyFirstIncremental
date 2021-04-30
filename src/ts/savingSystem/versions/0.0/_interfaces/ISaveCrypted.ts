export interface ISaveCrypted {
  version: string;
  value1: string;
}

export const getSaveCrypted = (version: string, value1: string): ISaveCrypted => ({ version, value1 });
