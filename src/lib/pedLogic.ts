// PED 2014/68/EU - Annex II classification logic
// Reference: Guida_PED_FluidGroup_IT.pdf

export const DANGEROUS_H_CODES: ReadonlyArray<string> = (() => {
  const set = new Set<string>();
  // H200-H225
  for (let i = 200; i <= 225; i++) set.add(`H${i}`);
  // H270, H271, H272, H280, H281, H290
  ["H270", "H271", "H272", "H280", "H281", "H290"].forEach((c) => set.add(c));
  // H300-H310
  for (let i = 300; i <= 310; i++) set.add(`H${i}`);
  // H330, H331, H340, H350, H360, H361, H370, H371, H400, H410
  ["H330", "H331", "H340", "H350", "H360", "H361", "H370", "H371", "H400", "H410"].forEach((c) => set.add(c));
  return Array.from(set);
})();

const DANGEROUS_SET = new Set(DANGEROUS_H_CODES);

export const H_CODE_REGEX = /^H\d{3}$/;

export function validateHCode(code: string): boolean {
  return H_CODE_REGEX.test(code.trim().toUpperCase());
}

export interface ClassificationInput {
  hCodes: string[];           // already normalized uppercase
  flashPoint: number | null;  // °C, null if not declared
  tMin: number | null;
  tMax: number | null;
  /** Optional override: set of H codes considered dangerous (Gruppo 1) per DB */
  dangerousCodes?: Set<string>;
}

export interface ClassificationResult {
  baseGroup: 1 | 2;
  finalGroup: 1 | 2;
  art13Applied: boolean;
  determiningCodes: string[];
  reasonKey:
    | "h_dangerous"
    | "h226_art13"
    | "h226_safe"
    | "fp_missing_cautious"
    | "fp_le_tmax"
    | "fp_gt_tmax"
    | "no_danger";
  reasonParams: Record<string, string | number>;
}

export function classify(input: ClassificationInput): ClassificationResult {
  const codes = input.hCodes.map((c) => c.trim().toUpperCase()).filter(Boolean);
  const dangerSet = input.dangerousCodes ?? DANGEROUS_SET;
  const dangerous = codes.filter((c) => dangerSet.has(c));
  const hasH226 = codes.includes("H226");
  const fp = input.flashPoint;
  const tmax = input.tMax;

  // Phase 2: any dangerous H code => Group 1 directly
  if (dangerous.length > 0) {
    return {
      baseGroup: 1,
      finalGroup: 1,
      art13Applied: false,
      determiningCodes: Array.from(new Set(dangerous)),
      reasonKey: "h_dangerous",
      reasonParams: { codes: dangerous.join(", ") },
    };
  }

  // H226 special rule: Group 1 if Tmax >= FP, else Group 2
  if (hasH226) {
    if (fp == null) {
      return {
        baseGroup: 2,
        finalGroup: 1,
        art13Applied: true,
        determiningCodes: ["H226"],
        reasonKey: "fp_missing_cautious",
        reasonParams: {},
      };
    }
    if (tmax != null && tmax >= fp) {
      return {
        baseGroup: 2,
        finalGroup: 1,
        art13Applied: true,
        determiningCodes: ["H226"],
        reasonKey: "h226_art13",
        reasonParams: { tmax, fp },
      };
    }
    return {
      baseGroup: 2,
      finalGroup: 2,
      art13Applied: false,
      determiningCodes: ["H226"],
      reasonKey: "h226_safe",
      reasonParams: { tmax: tmax ?? "-", fp },
    };
  }

  // Phase 3: no dangerous H code and no H226.
  // If the SDS declares H codes and none of them is a Group 1 code, the fluid is Group 2:
  // the Flash Point / Art. 13 rule applies only to flammability (H224-H227).
  if (codes.length > 0) {
    return {
      baseGroup: 2,
      finalGroup: 2,
      art13Applied: false,
      determiningCodes: [],
      reasonKey: "no_danger",
      reasonParams: {},
    };
  }

  // No H code declared at all: apply the cautionary principle when the Flash Point is missing.
  if (fp == null) {
    return {
      baseGroup: 2,
      finalGroup: 1,
      art13Applied: true,
      determiningCodes: [],
      reasonKey: "fp_missing_cautious",
      reasonParams: {},
    };
  }


  if (tmax != null && fp <= tmax) {
    return {
      baseGroup: 2,
      finalGroup: 1,
      art13Applied: true,
      determiningCodes: [],
      reasonKey: "fp_le_tmax",
      reasonParams: { tmax, fp },
    };
  }

  return {
    baseGroup: 2,
    finalGroup: 2,
    art13Applied: false,
    determiningCodes: [],
    reasonKey: "fp_gt_tmax",
    reasonParams: { tmax: tmax ?? "-", fp },
  };
}