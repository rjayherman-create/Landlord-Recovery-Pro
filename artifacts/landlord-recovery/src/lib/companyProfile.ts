export const COMPANY_PROFILE_KEY = "landlord_recovery_company_profile";

export interface CompanyProfile {
  filingAsLLC: boolean;
  landlordName: string;
  landlordCompany: string;
  landlordAddress: string;
  landlordEmail: string;
  landlordPhone: string;
}

export function loadCompanyProfile(): CompanyProfile | null {
  try {
    const raw = localStorage.getItem(COMPANY_PROFILE_KEY);
    return raw ? (JSON.parse(raw) as CompanyProfile) : null;
  } catch {
    return null;
  }
}

export function saveCompanyProfile(profile: CompanyProfile): void {
  localStorage.setItem(COMPANY_PROFILE_KEY, JSON.stringify(profile));
}
