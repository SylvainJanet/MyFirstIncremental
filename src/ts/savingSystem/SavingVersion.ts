/* eslint-disable @typescript-eslint/no-magic-numbers */
export enum SavingVersion {
  "0.0.0" = 0,
  "0.0.1" = 1,
  "0.0.2" = 2,
  "0.1.0" = 3,
  "0.1.1" = 4,
  "0.2.0" = 5,
  "1.0.0" = 6,
}

export const getSavingVersionDisplay = (nbr: number): string => {
  for (const key in SavingVersion) {
    if (Object.prototype.hasOwnProperty.call(SavingVersion, key)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const check = SavingVersion[key]!;
      if (Number.isInteger(check) && Number.parseInt(check, 10) === nbr) {
        return key;
      }
    }
  }
  return "";
};

export const getSavingVersionNbr = (display: string): SavingVersion => {
  for (const key in SavingVersion) {
    if (Object.prototype.hasOwnProperty.call(SavingVersion, key)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const obj = SavingVersion[key]!;
      if (key === display && Number.isInteger(obj)) {
        return SavingVersion[key as keyof typeof SavingVersion];
      }
    }
  }
  return NaN;
};
