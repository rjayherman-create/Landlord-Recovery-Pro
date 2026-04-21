export interface StateRequirement {
  name: string;
  noticeDays: number | string;
  depositReturnDays: number;
  smallClaimsLimit: number;
  noticeNotes?: string;
  depositNotes?: string;
}

export const STATE_REQUIREMENTS: Record<string, StateRequirement> = {
  AL: { name: "Alabama",        noticeDays: 7,  depositReturnDays: 35,  smallClaimsLimit: 6000,  depositNotes: "Must be returned within 35 days of move-out or lease termination." },
  AK: { name: "Alaska",         noticeDays: 7,  depositReturnDays: 14,  smallClaimsLimit: 10000, depositNotes: "14 days if tenant gives proper notice; 30 days otherwise." },
  AZ: { name: "Arizona",        noticeDays: 5,  depositReturnDays: 14,  smallClaimsLimit: 3500  },
  AR: { name: "Arkansas",       noticeDays: 3,  depositReturnDays: 60,  smallClaimsLimit: 5000  },
  CA: { name: "California",     noticeDays: 3,  depositReturnDays: 21,  smallClaimsLimit: 12500, depositNotes: "Security deposit cannot exceed 2 months' rent for unfurnished units.", noticeNotes: "Many cities (LA, San Francisco, Oakland) have just-cause eviction requirements." },
  CO: { name: "Colorado",       noticeDays: 10, depositReturnDays: 60,  smallClaimsLimit: 7500  },
  CT: { name: "Connecticut",    noticeDays: 3,  depositReturnDays: 30,  smallClaimsLimit: 5000  },
  DE: { name: "Delaware",       noticeDays: 5,  depositReturnDays: 20,  smallClaimsLimit: 15000 },
  FL: { name: "Florida",        noticeDays: 3,  depositReturnDays: 15,  smallClaimsLimit: 8000,  depositNotes: "Must provide written notice of intention to impose claims within 30 days of move-out." },
  GA: { name: "Georgia",        noticeDays: "Immediate — dispossessory warrant may be filed same day", depositReturnDays: 30, smallClaimsLimit: 15000, noticeNotes: "No statutory notice period for nonpayment; landlord may file dispossessory immediately." },
  HI: { name: "Hawaii",         noticeDays: 5,  depositReturnDays: 14,  smallClaimsLimit: 5000  },
  ID: { name: "Idaho",          noticeDays: 3,  depositReturnDays: 21,  smallClaimsLimit: 5000  },
  IL: { name: "Illinois",       noticeDays: 5,  depositReturnDays: 30,  smallClaimsLimit: 10000, noticeNotes: "Chicago has additional requirements under the RLTO; check city-specific rules." },
  IN: { name: "Indiana",        noticeDays: 10, depositReturnDays: 45,  smallClaimsLimit: 10000 },
  IA: { name: "Iowa",           noticeDays: 3,  depositReturnDays: 30,  smallClaimsLimit: 6500  },
  KS: { name: "Kansas",         noticeDays: 3,  depositReturnDays: 30,  smallClaimsLimit: 4000  },
  KY: { name: "Kentucky",       noticeDays: 7,  depositReturnDays: 30,  smallClaimsLimit: 2500  },
  LA: { name: "Louisiana",      noticeDays: 5,  depositReturnDays: 30,  smallClaimsLimit: 5000  },
  ME: { name: "Maine",          noticeDays: 7,  depositReturnDays: 30,  smallClaimsLimit: 6000  },
  MD: { name: "Maryland",       noticeDays: 30, depositReturnDays: 45,  smallClaimsLimit: 5000,  noticeNotes: "Notice requirements vary by county; check local court rules." },
  MA: { name: "Massachusetts",  noticeDays: 14, depositReturnDays: 30,  smallClaimsLimit: 7000,  depositNotes: "Landlord must pay interest on deposit. Wrongful withholding can result in triple damages." },
  MI: { name: "Michigan",       noticeDays: 7,  depositReturnDays: 30,  smallClaimsLimit: 6500  },
  MN: { name: "Minnesota",      noticeDays: 14, depositReturnDays: 21,  smallClaimsLimit: 15000 },
  MS: { name: "Mississippi",    noticeDays: 3,  depositReturnDays: 45,  smallClaimsLimit: 3500  },
  MO: { name: "Missouri",       noticeDays: 3,  depositReturnDays: 30,  smallClaimsLimit: 5000  },
  MT: { name: "Montana",        noticeDays: 3,  depositReturnDays: 30,  smallClaimsLimit: 7000  },
  NE: { name: "Nebraska",       noticeDays: 7,  depositReturnDays: 14,  smallClaimsLimit: 3600  },
  NV: { name: "Nevada",         noticeDays: 7,  depositReturnDays: 30,  smallClaimsLimit: 10000 },
  NH: { name: "New Hampshire",  noticeDays: 7,  depositReturnDays: 30,  smallClaimsLimit: 10000 },
  NJ: { name: "New Jersey",     noticeDays: 30, depositReturnDays: 30,  smallClaimsLimit: 5000,  depositNotes: "Landlord must pay tenant interest on deposit held more than 1 year.", noticeNotes: "Must serve a written notice and allow cure before filing eviction." },
  NM: { name: "New Mexico",     noticeDays: 3,  depositReturnDays: 30,  smallClaimsLimit: 10000 },
  NY: { name: "New York",       noticeDays: 14, depositReturnDays: 14,  smallClaimsLimit: 5000,  noticeNotes: "Since 2019 HSTPA, a 14-day rent demand notice is required before filing eviction for nonpayment." },
  NC: { name: "North Carolina", noticeDays: 10, depositReturnDays: 30,  smallClaimsLimit: 10000 },
  ND: { name: "North Dakota",   noticeDays: 3,  depositReturnDays: 30,  smallClaimsLimit: 15000 },
  OH: { name: "Ohio",           noticeDays: 3,  depositReturnDays: 30,  smallClaimsLimit: 6000  },
  OK: { name: "Oklahoma",       noticeDays: 5,  depositReturnDays: 30,  smallClaimsLimit: 10000 },
  OR: { name: "Oregon",         noticeDays: 10, depositReturnDays: 31,  smallClaimsLimit: 10000, noticeNotes: "Many cities have just-cause eviction ordinances; verify local rules." },
  PA: { name: "Pennsylvania",   noticeDays: 10, depositReturnDays: 30,  smallClaimsLimit: 12000 },
  RI: { name: "Rhode Island",   noticeDays: 5,  depositReturnDays: 20,  smallClaimsLimit: 2500  },
  SC: { name: "South Carolina", noticeDays: 5,  depositReturnDays: 30,  smallClaimsLimit: 7500  },
  SD: { name: "South Dakota",   noticeDays: 3,  depositReturnDays: 14,  smallClaimsLimit: 12000 },
  TN: { name: "Tennessee",      noticeDays: 14, depositReturnDays: 60,  smallClaimsLimit: 25000 },
  TX: { name: "Texas",          noticeDays: 3,  depositReturnDays: 30,  smallClaimsLimit: 20000, noticeNotes: "Landlord must make written demand before filing small claims." },
  UT: { name: "Utah",           noticeDays: 3,  depositReturnDays: 30,  smallClaimsLimit: 11000 },
  VT: { name: "Vermont",        noticeDays: 14, depositReturnDays: 14,  smallClaimsLimit: 5000  },
  VA: { name: "Virginia",       noticeDays: 5,  depositReturnDays: 45,  smallClaimsLimit: 5000  },
  WA: { name: "Washington",     noticeDays: 14, depositReturnDays: 21,  smallClaimsLimit: 10000, noticeNotes: "14-Day Pay or Vacate notice required; many cities have additional tenant protections." },
  WV: { name: "West Virginia",  noticeDays: 5,  depositReturnDays: 60,  smallClaimsLimit: 10000 },
  WI: { name: "Wisconsin",      noticeDays: 5,  depositReturnDays: 21,  smallClaimsLimit: 10000 },
  WY: { name: "Wyoming",        noticeDays: 3,  depositReturnDays: 30,  smallClaimsLimit: 6000  },
  DC: { name: "Washington D.C.",noticeDays: 30, depositReturnDays: 45,  smallClaimsLimit: 10000, noticeNotes: "DC has strong tenant protections; always verify current local law." },
};

export const STATES_WITH_REQUIREMENTS = Object.keys(STATE_REQUIREMENTS).sort();
