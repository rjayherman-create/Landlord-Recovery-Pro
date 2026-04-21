export type FieldType = "text" | "number" | "date" | "textarea" | "state";

export interface TemplateField {
  key: string;
  label: string;
  placeholder?: string;
  type: FieldType;
  required?: boolean;
}

export interface DocumentTemplate {
  id: string;
  title: string;
  subtitle: string;
  category: "notices" | "demand_letters" | "deposit" | "termination";
  description: string;
  states?: string[];
  fields: TemplateField[];
  body: string;
}

export const CATEGORIES = [
  { id: "all", label: "All Documents" },
  { id: "notices", label: "Pay or Quit Notices" },
  { id: "demand_letters", label: "Demand Letters" },
  { id: "deposit", label: "Security Deposit" },
  { id: "termination", label: "Lease Termination" },
] as const;

const COMMON_PARTY_FIELDS: TemplateField[] = [
  { key: "landlord_name", label: "Landlord / Property Owner Name", placeholder: "John Smith", type: "text", required: true },
  { key: "landlord_address", label: "Landlord Mailing Address", placeholder: "123 Main St, Brooklyn, NY 11201", type: "text", required: true },
  { key: "tenant_name", label: "Tenant Full Name", placeholder: "Jane Doe", type: "text", required: true },
  { key: "property_address", label: "Rental Property Address", placeholder: "456 Oak Ave, Unit 2B, Brooklyn, NY 11215", type: "text", required: true },
];

export const documentTemplates: DocumentTemplate[] = [
  {
    id: "5-day-notice",
    title: "5-Day Notice to Pay Rent or Quit",
    subtitle: "Most common unpaid rent notice",
    category: "notices",
    description: "Formally demands rent payment within 5 days or the tenant must vacate. Required first step before eviction in most states.",
    states: ["NY", "IL", "OH", "GA", "NC"],
    fields: [
      ...COMMON_PARTY_FIELDS,
      { key: "rent_amount", label: "Total Rent Owed ($)", placeholder: "2400.00", type: "number", required: true },
      { key: "months_description", label: "Months Covered", placeholder: "March and April 2025", type: "text", required: true },
      { key: "due_date", label: "Original Rent Due Date", placeholder: "March 1, 2025", type: "text", required: true },
      { key: "notice_date", label: "Date of This Notice", placeholder: "April 21, 2025", type: "date", required: true },
      { key: "pay_by_date", label: "Pay-By Deadline (5 days from notice)", placeholder: "April 26, 2025", type: "date", required: true },
      { key: "state", label: "State", type: "state", required: true },
    ],
    body: `5-DAY NOTICE TO PAY RENT OR QUIT

Date: {{notice_date}}
State: {{state}}

TO: {{tenant_name}}
Property Address: {{property_address}}

FROM: {{landlord_name}}
{{landlord_address}}

NOTICE IS HEREBY GIVEN that you are in default of your rental agreement for the above-described premises. You are indebted to the undersigned for unpaid rent as follows:

    Rent Owed: \${{rent_amount}}
    Period Covered: {{months_description}}
    Original Due Date: {{due_date}}

YOU ARE HEREBY REQUIRED to pay the above-stated amount in full OR vacate and surrender possession of the said premises on or before:

    DEADLINE: {{pay_by_date}}

If you fail to pay the full amount owed or vacate the premises by the deadline stated above, legal proceedings will be instituted against you to recover possession of the premises, declare the rental agreement forfeited, and seek a money judgment for all rent due, together with court costs and attorney's fees as permitted by law.

If you have already paid the amount stated above, please disregard this notice and provide proof of payment immediately.

___________________________
{{landlord_name}}
Landlord / Property Owner
Date Served: {{notice_date}}

NOTE: This notice must be served in accordance with the laws of {{state}}. Consult your local court clerk for proper service procedures.`,
  },

  {
    id: "3-day-notice",
    title: "3-Day Notice to Pay Rent or Quit",
    subtitle: "For California, Florida, Texas and others",
    category: "notices",
    description: "Shorter notice period required before eviction proceedings. Commonly used in CA, FL, TX, PA, and NJ.",
    states: ["CA", "FL", "TX", "NJ", "PA"],
    fields: [
      ...COMMON_PARTY_FIELDS,
      { key: "rent_amount", label: "Total Rent Owed ($)", placeholder: "1800.00", type: "number", required: true },
      { key: "months_description", label: "Months Covered", placeholder: "April 2025", type: "text", required: true },
      { key: "notice_date", label: "Date of This Notice", type: "date", required: true },
      { key: "pay_by_date", label: "Pay-By Deadline (3 days from notice)", type: "date", required: true },
      { key: "state", label: "State", type: "state", required: true },
    ],
    body: `3-DAY NOTICE TO PAY RENT OR QUIT

Date: {{notice_date}}
State: {{state}}

TO: {{tenant_name}}
Property Address: {{property_address}}

FROM: {{landlord_name}}
{{landlord_address}}

PLEASE TAKE NOTICE that the rent on your rental unit, located at {{property_address}}, is past due and unpaid as follows:

    Total Amount Due: \${{rent_amount}}
    Period: {{months_description}}

YOU ARE HEREBY REQUIRED to pay the total amount of \${{rent_amount}} in full within THREE (3) DAYS from service of this notice, or on or before {{pay_by_date}}, OR to vacate and surrender the premises.

If you fail to comply with this notice, your tenancy will be terminated and legal proceedings will be commenced against you to recover possession of the premises, a money judgment for past-due rent, and all costs and attorneys' fees as allowed by the laws of {{state}}.

___________________________
{{landlord_name}}
Landlord / Property Owner
Date Served: {{notice_date}}`,
  },

  {
    id: "14-day-notice",
    title: "14-Day Notice to Pay Rent or Quit",
    subtitle: "For New Jersey and similar states",
    category: "notices",
    description: "Required in NJ and some other states before commencing eviction for nonpayment of rent.",
    states: ["NJ"],
    fields: [
      ...COMMON_PARTY_FIELDS,
      { key: "rent_amount", label: "Total Rent Owed ($)", placeholder: "1500.00", type: "number", required: true },
      { key: "months_description", label: "Months / Period Covered", placeholder: "March and April 2025", type: "text", required: true },
      { key: "notice_date", label: "Date of This Notice", type: "date", required: true },
      { key: "pay_by_date", label: "Pay-By Deadline", type: "date", required: true },
    ],
    body: `NOTICE TO QUIT FOR NONPAYMENT OF RENT
(14-Day Notice — New Jersey)

Date: {{notice_date}}

TO: {{tenant_name}}
Premises: {{property_address}}

FROM: {{landlord_name}}
{{landlord_address}}

PLEASE TAKE NOTICE that you are hereby required to pay the rent now due and in arrears in the amount of \${{rent_amount}} for the period of {{months_description}}, or remove from and deliver up possession of the premises which you hold as tenant.

The total amount due is: \${{rent_amount}}

You are required to pay this amount OR vacate the premises within FOURTEEN (14) DAYS from the date of service of this notice, on or before {{pay_by_date}}.

In the event of your failure to pay such rent or to remove from said premises within the time above specified, your landlord will institute summary dispossess proceedings against you for recovery of said premises, as provided by law.

___________________________
{{landlord_name}}
Landlord
Date: {{notice_date}}`,
  },

  {
    id: "10-day-lease-violation",
    title: "10-Day Notice to Cure Lease Violation or Quit",
    subtitle: "For lease violations other than non-payment",
    category: "notices",
    description: "Notifies a tenant of a specific lease violation and gives them 10 days to correct it or face eviction.",
    fields: [
      ...COMMON_PARTY_FIELDS,
      { key: "violation_description", label: "Specific Lease Violation", placeholder: "Unauthorized pet in violation of the no-pets clause in Section 12 of the lease agreement", type: "textarea", required: true },
      { key: "lease_clause", label: "Applicable Lease Clause / Section", placeholder: "Section 12 — No Pets", type: "text" },
      { key: "notice_date", label: "Date of This Notice", type: "date", required: true },
      { key: "cure_by_date", label: "Cure-By Deadline (10 days)", type: "date", required: true },
      { key: "state", label: "State", type: "state", required: true },
    ],
    body: `10-DAY NOTICE TO CURE OR QUIT

Date: {{notice_date}}
State: {{state}}

TO: {{tenant_name}}
Property Address: {{property_address}}

FROM: {{landlord_name}}
{{landlord_address}}

PLEASE TAKE NOTICE that you are in violation of the terms and conditions of your rental agreement for the premises described above. The nature of the violation is as follows:

VIOLATION:
{{violation_description}}

APPLICABLE LEASE PROVISION: {{lease_clause}}

YOU ARE HEREBY REQUIRED to remedy the above-described violation within TEN (10) DAYS from service of this notice, on or before {{cure_by_date}}.

If you fail to remedy the violation within the time specified, your tenancy will be terminated and legal proceedings will be commenced against you to recover possession of the premises and for damages as permitted by the laws of {{state}}.

If you have already corrected the violation, please disregard this notice and contact the landlord immediately with written confirmation.

___________________________
{{landlord_name}}
Landlord / Property Owner
Date: {{notice_date}}`,
  },

  {
    id: "demand-unpaid-rent",
    title: "Demand Letter — Unpaid Rent",
    subtitle: "Pre-litigation formal demand",
    category: "demand_letters",
    description: "Formal written demand for unpaid rent before filing in small claims court. Demonstrates good faith and strengthens your legal position.",
    fields: [
      ...COMMON_PARTY_FIELDS,
      { key: "tenant_mailing_address", label: "Tenant Current Mailing Address", placeholder: "789 New St, Queens, NY 11101", type: "text", required: true },
      { key: "total_owed", label: "Total Amount Owed ($)", placeholder: "7200.00", type: "number", required: true },
      { key: "monthly_rent", label: "Monthly Rent ($)", placeholder: "2400.00", type: "number", required: true },
      { key: "months_count", label: "Number of Months Unpaid", placeholder: "3", type: "number", required: true },
      { key: "period_covered", label: "Months Covered", placeholder: "January, February, March 2025", type: "text", required: true },
      { key: "move_out_date", label: "Move-Out / Vacate Date", placeholder: "March 31, 2025", type: "text" },
      { key: "letter_date", label: "Date of This Letter", type: "date", required: true },
      { key: "response_deadline", label: "Response Deadline (10 days recommended)", type: "date", required: true },
      { key: "state", label: "State", type: "state", required: true },
    ],
    body: `{{letter_date}}

{{landlord_name}}
{{landlord_address}}

RE: FORMAL DEMAND FOR PAYMENT OF UNPAID RENT
    Property: {{property_address}}

{{tenant_name}}
{{tenant_mailing_address}}

Dear {{tenant_name}},

This letter serves as a formal written demand for payment of unpaid rent owed to me as your former landlord for the rental property located at {{property_address}}, {{state}}.

AMOUNT DUE AND OWING:

    Monthly Rent Rate:    \${{monthly_rent}} per month
    Months Unpaid:        {{months_count}} months ({{period_covered}})
    TOTAL AMOUNT DUE:     \${{total_owed}}

Despite previous notices and requests for payment, the above amount remains due and unpaid. Your tenancy at the above property ended on {{move_out_date}}.

DEMAND FOR PAYMENT: You are hereby demanded to pay the total sum of \${{total_owed}} within TEN (10) DAYS of the date of this letter — on or before {{response_deadline}}.

Payment should be made by cashier's check or money order made payable to {{landlord_name}} and delivered to the address above, or by electronic transfer if previously agreed upon.

Be advised that if this amount is not paid in full by the deadline stated above, I intend to file a claim against you in Small Claims Court for the full amount owed, plus court costs and any other recoverable expenses permitted under {{state}} law.

This letter may be submitted as evidence of your failure to respond to a good-faith demand for payment.

Sincerely,

___________________________
{{landlord_name}}
Landlord / Property Owner

Sent via Certified Mail, Return Receipt Requested`,
  },

  {
    id: "demand-property-damage",
    title: "Demand Letter — Property Damage",
    subtitle: "Recover costs for damage beyond normal wear",
    category: "demand_letters",
    description: "Formal demand for compensation for property damage caused by a tenant beyond normal wear and tear.",
    fields: [
      ...COMMON_PARTY_FIELDS,
      { key: "tenant_mailing_address", label: "Tenant Current Mailing Address", placeholder: "789 New St, Queens, NY 11101", type: "text", required: true },
      { key: "move_out_date", label: "Tenant Move-Out Date", placeholder: "March 31, 2025", type: "text", required: true },
      { key: "damage_description", label: "Description of Damages", placeholder: "Holes in drywall in bedroom and living room, broken kitchen cabinet doors, stained carpet requiring full replacement, broken bathroom fixtures", type: "textarea", required: true },
      { key: "repair_cost", label: "Total Repair / Replacement Cost ($)", placeholder: "4350.00", type: "number", required: true },
      { key: "security_deposit", label: "Security Deposit Held ($)", placeholder: "1800.00", type: "number" },
      { key: "net_owed", label: "Net Amount Owed After Deposit ($)", placeholder: "2550.00", type: "number", required: true },
      { key: "letter_date", label: "Date of This Letter", type: "date", required: true },
      { key: "response_deadline", label: "Response Deadline", type: "date", required: true },
      { key: "state", label: "State", type: "state", required: true },
    ],
    body: `{{letter_date}}

{{landlord_name}}
{{landlord_address}}

RE: DEMAND FOR PAYMENT — PROPERTY DAMAGE
    Property: {{property_address}}

{{tenant_name}}
{{tenant_mailing_address}}

Dear {{tenant_name}},

This letter serves as a formal written demand for payment of damages to the rental property located at {{property_address}}, {{state}}, which you vacated on {{move_out_date}}.

Upon inspection of the premises following your departure, the following damages were found that exceed normal wear and tear:

DAMAGES IDENTIFIED:
{{damage_description}}

COST SUMMARY:
    Total Repair / Replacement Cost:    \${{repair_cost}}
    Less: Security Deposit Applied:    -\${{security_deposit}}
    BALANCE DUE FROM YOU:              \${{net_owed}}

Photographs and contractor estimates documenting the above damages are available and will be presented as evidence in any legal proceeding.

DEMAND: You are hereby demanded to pay the sum of \${{net_owed}} within TEN (10) DAYS of this letter — on or before {{response_deadline}}.

If payment is not received by the above deadline, I will file a claim in Small Claims Court for the full amount plus court costs as permitted by {{state}} law.

Sincerely,

___________________________
{{landlord_name}}
Landlord / Property Owner

Sent via Certified Mail, Return Receipt Requested`,
  },

  {
    id: "security-deposit-itemization",
    title: "Security Deposit Itemized Deduction Statement",
    subtitle: "Required notice of deposit deductions",
    category: "deposit",
    description: "Itemized statement of deductions from a security deposit, required in most states within 14–30 days of move-out.",
    fields: [
      ...COMMON_PARTY_FIELDS,
      { key: "tenant_mailing_address", label: "Tenant Forwarding Address", placeholder: "789 New St, Queens, NY 11101", type: "text", required: true },
      { key: "move_out_date", label: "Move-Out Date", placeholder: "March 31, 2025", type: "text", required: true },
      { key: "deposit_held", label: "Total Security Deposit Held ($)", placeholder: "3000.00", type: "number", required: true },
      { key: "deduction_items", label: "Itemized Deductions (list each item and cost)", placeholder: "Carpet replacement: $800\nPatch and repaint bedroom wall: $350\nCleaning fee (unit left unclean): $200\nReplacement of broken blinds: $150", type: "textarea", required: true },
      { key: "total_deductions", label: "Total Deductions ($)", placeholder: "1500.00", type: "number", required: true },
      { key: "amount_returned", label: "Amount Returned to Tenant ($)", placeholder: "1500.00", type: "number", required: true },
      { key: "letter_date", label: "Date of This Statement", type: "date", required: true },
      { key: "state", label: "State", type: "state", required: true },
    ],
    body: `SECURITY DEPOSIT ITEMIZED DEDUCTION STATEMENT
(As Required by the Laws of {{state}})

Date: {{letter_date}}

FROM:
{{landlord_name}}
{{landlord_address}}

TO:
{{tenant_name}}
{{tenant_mailing_address}}

RE: Security Deposit — {{property_address}}

Dear {{tenant_name}},

This letter provides the itemized accounting of your security deposit for the rental property at {{property_address}}, which you vacated on {{move_out_date}}.

DEPOSIT ACCOUNTING:

    Security Deposit Collected:          \${{deposit_held}}

    DEDUCTIONS:
{{deduction_items}}

    Total Deductions:                   -\${{total_deductions}}
    ─────────────────────────────────────────────
    BALANCE RETURNED TO TENANT:          \${{amount_returned}}

A check for \${{amount_returned}} is enclosed / has been sent to your forwarding address on file.

If you dispute any of the above deductions, please contact me in writing within 14 days of receiving this notice.

Sincerely,

___________________________
{{landlord_name}}
Landlord / Property Owner
Date: {{letter_date}}`,
  },

  {
    id: "security-deposit-demand",
    title: "Demand Letter — Unreturned Security Deposit",
    subtitle: "When your deposit was wrongfully withheld",
    category: "deposit",
    description: "For tenants — demand the return of a security deposit that was not refunded or itemized within the legal deadline.",
    fields: [
      ...COMMON_PARTY_FIELDS,
      { key: "move_out_date", label: "Move-Out / Lease End Date", placeholder: "March 31, 2025", type: "text", required: true },
      { key: "deposit_amount", label: "Security Deposit Amount ($)", placeholder: "3000.00", type: "number", required: true },
      { key: "days_since_moveout", label: "Days Since Move-Out", placeholder: "35", type: "number" },
      { key: "letter_date", label: "Date of This Letter", type: "date", required: true },
      { key: "response_deadline", label: "Response Deadline", type: "date", required: true },
      { key: "state", label: "State", type: "state", required: true },
    ],
    body: `{{letter_date}}

{{tenant_name}}
{{property_address}}

RE: DEMAND FOR RETURN OF SECURITY DEPOSIT
    Rental Property: {{property_address}}

{{landlord_name}}
{{landlord_address}}

Dear {{landlord_name}},

I am writing to formally demand the return of my security deposit in the amount of \${{deposit_amount}}, which I paid upon commencement of my tenancy at {{property_address}}.

I vacated the premises on {{move_out_date}}, leaving the unit in clean and undamaged condition, consistent with normal wear and tear. As of the date of this letter ({{days_since_moveout}} days after my move-out), I have not received my security deposit or a written itemized statement of any deductions, as required by {{state}} law.

DEMAND: You are hereby demanded to return my security deposit of \${{deposit_amount}} in full, OR provide a legally compliant itemized statement of deductions, within TEN (10) DAYS — on or before {{response_deadline}}.

Please be advised that failure to return the deposit or provide a proper accounting within the statutory deadline may entitle me to seek additional damages as provided under {{state}} law, including the possibility of double or treble damages and attorney's fees.

Sincerely,

___________________________
{{tenant_name}}
Former Tenant
Date: {{letter_date}}`,
  },

  {
    id: "30-day-notice-vacate",
    title: "30-Day Notice to Vacate",
    subtitle: "End a month-to-month tenancy",
    category: "termination",
    description: "Formally terminates a month-to-month tenancy with 30 days' notice. Required before landlord can pursue eviction for holdover tenants.",
    fields: [
      ...COMMON_PARTY_FIELDS,
      { key: "notice_date", label: "Date of This Notice", type: "date", required: true },
      { key: "vacate_by_date", label: "Vacate-By Date (30 days from notice)", type: "date", required: true },
      { key: "reason", label: "Reason for Termination (optional)", placeholder: "Owner intends to occupy the unit / sale of property / lease non-renewal", type: "text" },
      { key: "state", label: "State", type: "state", required: true },
    ],
    body: `NOTICE TO VACATE
(30-Day Notice of Termination of Tenancy)

Date: {{notice_date}}
State: {{state}}

TO: {{tenant_name}}
    {{property_address}}

FROM: {{landlord_name}}
      {{landlord_address}}

PLEASE TAKE NOTICE that your tenancy of the premises at {{property_address}} is hereby terminated.

You are required to vacate and surrender possession of the above-described premises on or before:

    VACATE BY: {{vacate_by_date}}

Reason for Termination: {{reason}}

This notice is given pursuant to the applicable laws of {{state}} governing the termination of month-to-month tenancies.

Upon vacating, please return all keys and access devices. A move-out inspection will be scheduled at a mutually convenient time prior to the vacate date. Your security deposit will be returned (less any lawful deductions) within the time period required by {{state}} law.

If you fail to vacate the premises by the date specified above, legal proceedings to remove you from the premises may be commenced.

___________________________
{{landlord_name}}
Landlord / Property Owner
Date: {{notice_date}}`,
  },

  {
    id: "lease-termination-breach",
    title: "Notice of Lease Termination for Breach",
    subtitle: "Terminate for serious or repeated violations",
    category: "termination",
    description: "Terminates the tenancy due to a material breach of lease after the tenant failed to cure a prior notice.",
    fields: [
      ...COMMON_PARTY_FIELDS,
      { key: "breach_description", label: "Nature of the Breach", placeholder: "Tenant failed to remove unauthorized pet as required by prior 10-Day Notice dated March 15, 2025", type: "textarea", required: true },
      { key: "prior_notice_date", label: "Date of Prior Cure Notice", placeholder: "March 15, 2025", type: "text" },
      { key: "notice_date", label: "Date of This Notice", type: "date", required: true },
      { key: "vacate_by_date", label: "Vacate-By Date", type: "date", required: true },
      { key: "state", label: "State", type: "state", required: true },
    ],
    body: `NOTICE OF LEASE TERMINATION FOR MATERIAL BREACH

Date: {{notice_date}}
State: {{state}}

TO: {{tenant_name}}
    {{property_address}}

FROM: {{landlord_name}}
      {{landlord_address}}

PLEASE TAKE NOTICE that your rental agreement for the premises at {{property_address}} is hereby TERMINATED due to your material breach of the rental agreement.

NATURE OF BREACH:
{{breach_description}}

Prior Notice: A written notice was served on {{prior_notice_date}} requiring you to cure the above breach. You have failed to cure the breach within the time permitted.

As a result of your failure to comply, your tenancy is hereby terminated. YOU ARE REQUIRED TO VACATE AND SURRENDER POSSESSION of the above premises on or before:

    VACATE BY: {{vacate_by_date}}

If you fail to vacate by the date stated above, legal proceedings will be commenced to remove you from the premises and for any damages resulting from your breach, as permitted by the laws of {{state}}.

___________________________
{{landlord_name}}
Landlord / Property Owner
Date: {{notice_date}}`,
  },
];
