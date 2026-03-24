import { useMemo } from "react";
import type { Grievance, Comparable } from "@workspace/api-client-react";

export type ValidationSeverity = "error" | "warning" | "suggestion";

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  title: string;
  description: string;
  field?: string;
  fixLabel?: string;
  fixAction?: "edit" | "add-comp" | "find-comps";
}

const NYC_COUNTIES = ["Kings", "Queens", "New York", "Bronx", "Richmond"];

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function monthsAgo(d: Date): number {
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

export function useFormValidation(
  grievance: Grievance | null | undefined,
  comparables: Comparable[]
): { errors: ValidationIssue[]; warnings: ValidationIssue[]; suggestions: ValidationIssue[]; all: ValidationIssue[]; isReadyToFile: boolean } {
  return useMemo(() => {
    const issues: ValidationIssue[] = [];

    if (!grievance) {
      return { errors: [], warnings: [], suggestions: [], all: [], isReadyToFile: false };
    }

    const isNyc = NYC_COUNTIES.includes(grievance.county);
    const isNassau = grievance.county === "Nassau";

    // ── ERRORS ──────────────────────────────────────────────────────────────

    if (!grievance.parcelId?.trim()) {
      issues.push({
        id: "missing-parcel-id",
        severity: "error",
        title: "Parcel ID (Tax Map Number) is missing",
        description: isNyc
          ? "The NYC Tax Commission requires your Block and Lot number from your property tax bill. Without it, your application cannot be processed."
          : isNassau
          ? "Nassau ARC requires the Section/Block/Lot from your tax bill. The AROW portal will reject your filing without it."
          : "The RP-524 form requires your Tax Map Number (Section/Block/Lot). Assessors use this to locate your record — omitting it is the most common cause of rejection.",
        field: "parcelId",
        fixLabel: "Add Parcel ID",
        fixAction: "edit",
      });
    }

    if (!grievance.basisOfComplaint?.trim()) {
      issues.push({
        id: "missing-basis",
        severity: "error",
        title: "Basis of complaint is not selected",
        description: "Part Two of the RP-524 requires you to check at least one reason: Overvaluation, Unequal Assessment, Excessive Assessment, or Unlawful Assessment. A form without this checked will be returned.",
        field: "basisOfComplaint",
        fixLabel: "Select basis",
        fixAction: "edit",
      });
    }

    if (grievance.requestedAssessment >= grievance.currentAssessment) {
      issues.push({
        id: "requested-not-lower",
        severity: "error",
        title: "Requested assessment is not lower than the current assessment",
        description: `Your requested assessment ($${grievance.requestedAssessment.toLocaleString()}) must be less than the current assessment ($${grievance.currentAssessment.toLocaleString()}). The point of a grievance is to request a reduction — the form will be rejected if these values are equal or reversed.`,
        field: "requestedAssessment",
        fixLabel: "Fix assessment",
        fixAction: "edit",
      });
    }

    if (grievance.requestedAssessment <= 0) {
      issues.push({
        id: "requested-zero",
        severity: "error",
        title: "Requested assessment is zero or negative",
        description: "A requested assessment of $0 or less is not a valid grievance amount and will be rejected. Enter a realistic lower assessment that you believe reflects fair market value.",
        field: "requestedAssessment",
        fixLabel: "Fix assessment",
        fixAction: "edit",
      });
    }

    if (grievance.estimatedMarketValue <= 0) {
      issues.push({
        id: "market-value-zero",
        severity: "error",
        title: "Estimated market value is missing or zero",
        description: "Your market value estimate is a core part of the complaint — it's what you're arguing the property is actually worth. The Board will not consider a grievance without a market value argument.",
        field: "estimatedMarketValue",
        fixLabel: "Set market value",
        fixAction: "edit",
      });
    }

    if (!grievance.ownerName?.trim()) {
      issues.push({
        id: "missing-owner-name",
        severity: "error",
        title: "Owner / Complainant name is missing",
        description: "The form cannot be filed without an owner name. The assessor must know who is filing the complaint.",
        field: "ownerName",
        fixLabel: "Add owner name",
        fixAction: "edit",
      });
    }

    if (!grievance.municipality?.trim()) {
      issues.push({
        id: "missing-municipality",
        severity: "error",
        title: "Municipality is missing",
        description: "The municipality (city, town, or village) is required on all NY grievance forms. It tells the assessor which jurisdiction's board to route your complaint to.",
        field: "municipality",
        fixLabel: "Add municipality",
        fixAction: "edit",
      });
    }

    const deadlineDate = parseDate(grievance.filingDeadline);
    if (deadlineDate && deadlineDate < new Date()) {
      issues.push({
        id: "deadline-passed",
        severity: "error",
        title: "Your filing deadline has already passed",
        description: `The deadline you entered (${deadlineDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}) is in the past. Filing after the deadline will result in automatic rejection. You may still be able to file a SCAR (Small Claims Assessment Review) petition if you missed the grievance deadline.`,
        field: "filingDeadline",
        fixLabel: "Update deadline",
        fixAction: "edit",
      });
    }

    // ── WARNINGS ─────────────────────────────────────────────────────────────

    if (comparables.length === 0) {
      issues.push({
        id: "no-comparables",
        severity: "warning",
        title: "No comparable sales — your case has no evidence",
        description: "Without comparable sales, the Board of Assessment Review has no reason to reduce your assessment. Comparable sales are the primary evidence accepted in property tax grievances. Add at least 3 recent sales of similar properties that sold for less than your assessment implies.",
        fixLabel: "Find comparable sales",
        fixAction: "find-comps",
      });
    } else if (comparables.length < 3) {
      issues.push({
        id: "too-few-comparables",
        severity: "warning",
        title: `Only ${comparables.length} comparable sale${comparables.length === 1 ? "" : "s"} — 3 minimum recommended`,
        description: "Most Boards of Assessment Review expect at least 3 comparable sales. With fewer, your case may be seen as insufficient evidence. Add more comparables to strengthen your argument.",
        fixLabel: "Add more comps",
        fixAction: "find-comps",
      });
    }

    if (grievance.equalizationRate == null) {
      issues.push({
        id: "missing-equalization-rate",
        severity: "warning",
        title: "Equalization rate is not set",
        description: "The equalization rate is used in Part Three of the RP-524 to calculate full market value from the assessed value. Without it, the form will show N/A and the assessor may question your market value calculation. Find your municipality's equalization rate on the NYS ORPS website.",
        field: "equalizationRate",
        fixLabel: "Add equalization rate",
        fixAction: "edit",
      });
    }

    const staleComps = comparables.filter((c) => {
      const d = parseDate(c.saleDate);
      return d ? monthsAgo(d) > 24 : false;
    });
    if (staleComps.length > 0) {
      issues.push({
        id: "stale-comparables",
        severity: "warning",
        title: `${staleComps.length} comparable sale${staleComps.length > 1 ? "s are" : " is"} more than 24 months old`,
        description: "Boards of Assessment Review generally prefer sales from the past 24 months (some prefer 12). Older sales may be discounted or rejected as evidence. Replace stale comparables with more recent sales if possible.",
        fixLabel: "Review comps",
        fixAction: "add-comp",
      });
    }

    const reductionPct =
      grievance.currentAssessment > 0
        ? ((grievance.currentAssessment - grievance.requestedAssessment) / grievance.currentAssessment) * 100
        : 0;

    if (reductionPct > 50) {
      issues.push({
        id: "large-reduction",
        severity: "warning",
        title: `Requesting a ${Math.round(reductionPct)}% reduction — unusually large`,
        description: `You are requesting a reduction of $${(grievance.currentAssessment - grievance.requestedAssessment).toLocaleString()} (${Math.round(reductionPct)}% of the current assessment). Reductions this large are scrutinized closely. Make sure your comparable sales clearly support a market value this low, and consider including a certified appraisal to back up your argument.`,
        fixLabel: "Review values",
        fixAction: "edit",
      });
    }

    if (!grievance.ownerPhone?.trim() && !grievance.ownerEmail?.trim()) {
      issues.push({
        id: "no-contact-info",
        severity: "warning",
        title: "No phone number or email on file",
        description: "If the assessor needs to contact you about your complaint, they have no way to reach you. This can delay resolution or result in your case being closed without notice. Add at least one contact method.",
        field: "ownerPhone",
        fixLabel: "Add contact info",
        fixAction: "edit",
      });
    }

    const equalizationRate = Number(grievance.equalizationRate ?? 100);
    const impliedFullValue =
      equalizationRate > 0
        ? grievance.currentAssessment / (equalizationRate / 100)
        : grievance.currentAssessment;

    if (grievance.estimatedMarketValue > impliedFullValue * 1.1 && grievance.estimatedMarketValue > 0 && impliedFullValue > 0) {
      issues.push({
        id: "market-value-above-implied",
        severity: "warning",
        title: "Your market value estimate is higher than what the assessment implies",
        description: `Your market value estimate ($${grievance.estimatedMarketValue.toLocaleString()}) is higher than the full value implied by the current assessment ($${Math.round(impliedFullValue).toLocaleString()}). If true, this means your property is not overassessed and your grievance may be denied. Double-check your equalization rate and market value estimate.`,
        fixLabel: "Review values",
        fixAction: "edit",
      });
    }

    if (comparables.some((c) => !c.saleDate || !c.address || !c.salePrice)) {
      issues.push({
        id: "incomplete-comp-data",
        severity: "warning",
        title: "One or more comparables have incomplete data",
        description: "Some of your comparable sales are missing an address, sale price, or sale date. The Board needs all three to evaluate the evidence. Review your comparables and fill in any missing data.",
        fixLabel: "Review comps",
        fixAction: "add-comp",
      });
    }

    if (!grievance.filingDeadline) {
      issues.push({
        id: "no-deadline",
        severity: "warning",
        title: "Filing deadline is not set",
        description: "You have not entered a filing deadline. Missing the deadline results in automatic rejection — there are no extensions. Look up your county's grievance day and enter it now.",
        field: "filingDeadline",
        fixLabel: "Set deadline",
        fixAction: "edit",
      });
    }

    // ── SUGGESTIONS ───────────────────────────────────────────────────────────

    if (!grievance.schoolDistrict?.trim()) {
      issues.push({
        id: "no-school-district",
        severity: "suggestion",
        title: "School district not entered",
        description: "The RP-524 has a field for school district. While not strictly required, including it helps assessors locate your property record faster and avoids confusion when multiple municipalities share similar addresses.",
        field: "schoolDistrict",
        fixLabel: "Add school district",
        fixAction: "edit",
      });
    }

    if (!grievance.propertyClass?.trim()) {
      issues.push({
        id: "no-property-class",
        severity: "suggestion",
        title: "Property class code not entered",
        description: "The property classification code (e.g., 210 for single-family, 220 for two-family) appears on Part One of the RP-524. It's found on your tax bill and helps confirm the type of complaint.",
        field: "propertyClass",
        fixLabel: "Add class code",
        fixAction: "edit",
      });
    }

    if (!grievance.yearBuilt) {
      issues.push({
        id: "no-year-built",
        severity: "suggestion",
        title: "Year built not entered",
        description: "Knowing the year your property was built helps assessors match it with appropriate comparables. Older homes are often overassessed relative to newer construction — noting the year can support your case.",
        field: "yearBuilt",
        fixLabel: "Add year built",
        fixAction: "edit",
      });
    }

    if (comparables.length >= 3 && comparables.length < 6) {
      issues.push({
        id: "more-comps-better",
        severity: "suggestion",
        title: `${comparables.length} comparables added — 6 is the ideal target`,
        description: "You have the minimum recommended comparables, but 6 is the sweet spot. More comparables make it harder for the assessor to dismiss individual ones and show a consistent pattern of lower market values.",
        fixLabel: "Find more comps",
        fixAction: "find-comps",
      });
    }

    if (!grievance.notes?.trim()) {
      issues.push({
        id: "no-notes",
        severity: "suggestion",
        title: "No property condition notes",
        description: "The RP-524 includes a notes section for describing property issues that affect market value — a cracked foundation, outdated kitchen, deferred maintenance, flooding, proximity to a highway, etc. These factors can support a lower market value estimate.",
        field: "notes",
        fixLabel: "Add notes",
        fixAction: "edit",
      });
    }

    if (!grievance.ownerEmail?.trim()) {
      issues.push({
        id: "no-email",
        severity: "suggestion",
        title: "No email address on file",
        description: "Adding your email allows the assessor or BAR to send you notices electronically — faster and more reliable than mail. Nassau AROW and some other counties send status updates by email.",
        field: "ownerEmail",
        fixLabel: "Add email",
        fixAction: "edit",
      });
    }

    if (reductionPct > 30) {
      issues.push({
        id: "consider-appraisal",
        severity: "suggestion",
        title: "Consider attaching a certified appraisal",
        description: `You're requesting a ${Math.round(reductionPct)}% reduction. For reductions this size, a licensed NY appraiser's report is highly persuasive and can be the difference between approval and denial. Appraisals typically cost $300–$600 and can be recovered through tax savings.`,
      });
    }

    const errors = issues.filter((i) => i.severity === "error");
    const warnings = issues.filter((i) => i.severity === "warning");
    const suggestions = issues.filter((i) => i.severity === "suggestion");
    const isReadyToFile = errors.length === 0 && warnings.length === 0;

    return { errors, warnings, suggestions, all: issues, isReadyToFile };
  }, [grievance, comparables]);
}
