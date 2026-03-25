import type { Grievance, Comparable } from "@workspace/api-client-react";

interface RP524PrintFormProps {
  grievance: Grievance;
  comparables: Comparable[];
}

const BASIS_LABELS: Record<string, string> = {
  overvaluation: "A. Overvaluation",
  unequal: "B. Unequal Assessment",
  excessive: "C. Excessive Assessment",
  unlawful: "D. Unlawful Assessment",
};

function Field({ label, value, wide }: { label: string; value?: string | number | null; wide?: boolean }) {
  return (
    <div className={`border border-gray-400 ${wide ? "col-span-2" : ""}`} style={{ minHeight: 36 }}>
      <div className="text-[9px] font-bold px-1 pt-0.5 text-gray-600 uppercase tracking-wide leading-none">{label}</div>
      <div className="px-1 pb-1 text-[11px] text-gray-900 font-medium">{value ?? ""}</div>
    </div>
  );
}

function CheckBox({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-start gap-1.5 mb-1">
      <div
        className="w-3.5 h-3.5 border border-gray-800 flex-shrink-0 mt-0.5 flex items-center justify-center"
        style={{ minWidth: 14 }}
      >
        {checked && <span className="text-[10px] font-black leading-none">✓</span>}
      </div>
      <span className="text-[10px] leading-tight">{label}</span>
    </div>
  );
}

export function RP524PrintForm({ grievance, comparables }: RP524PrintFormProps) {
  const equalizationRate = grievance.equalizationRate ?? 1;
  const impliedFullValue = equalizationRate > 0
    ? Math.round(grievance.currentAssessment / (equalizationRate / 100))
    : grievance.currentAssessment;
  const requestedFullValue = grievance.estimatedMarketValue;
  const requestedAssessment = grievance.requestedAssessment;

  // Pad comparables to 6 rows
  const compRows = [...comparables.slice(0, 6)];
  while (compRows.length < 6) compRows.push(null as any);

  return (
    <div
      id="rp524-print"
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: 10,
        color: "#000",
        backgroundColor: "#fff",
        padding: "24px 28px",
        maxWidth: 780,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div className="text-center mb-3">
        <div className="text-[9px] text-gray-600 mb-0.5">New York State Department of Taxation and Finance — Office of Real Property Tax Services</div>
        <div className="text-[18px] font-extrabold tracking-tight">RP-524 — Complaint on Real Property Assessment</div>
        <div className="text-[10px] mt-0.5 text-gray-700">For use in filing complaints with the Board of Assessment Review (BAR)</div>
      </div>

      <div className="flex gap-2 mb-1">
        <div className="flex-1 border-2 border-gray-800 p-1">
          <div className="text-[9px] font-bold uppercase tracking-wide">For Office Use Only</div>
          <div style={{ minHeight: 30 }}></div>
        </div>
        <div className="border-2 border-gray-800 px-2 py-1 text-center" style={{ minWidth: 130 }}>
          <div className="text-[9px] font-bold uppercase">Tax Year of Complaint</div>
          <div className="text-[16px] font-extrabold mt-0.5">{grievance.taxYear}</div>
        </div>
      </div>

      {/* Part One A — Property Identification */}
      <div className="mb-3">
        <div className="bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 mb-1 uppercase tracking-wide">
          Part One — Identification of Property and Complainant
        </div>

        <div className="text-[10px] font-bold mb-1">A. Property Identification</div>
        <div className="grid grid-cols-2 gap-px mb-px">
          <Field label="Municipality (City, Town, or Village)" value={grievance.municipality} />
          <Field label="School District" value={grievance.schoolDistrict ?? ""} />
        </div>
        <div className="grid grid-cols-3 gap-px mb-px">
          <Field label="Street Address of Property" value={grievance.propertyAddress} wide />
          <Field label="Tax Map Number (Section / Block / Lot)" value={grievance.parcelId ?? ""} />
        </div>
        <div className="grid grid-cols-3 gap-px mb-2">
          <Field label="Property Classification Code" value={grievance.propertyClass ?? ""} />
          <Field label="Lot Size / Acreage" value={grievance.lotSize ?? ""} />
          <Field label="Year Built" value={grievance.yearBuilt ?? ""} />
        </div>

        {/* Part One B — Complainant */}
        <div className="text-[10px] font-bold mb-1">B. Complainant Information (If not owner, explain on a separate sheet)</div>
        <div className="grid grid-cols-2 gap-px mb-px">
          <Field label="Name of Complainant (Print)" value={grievance.ownerName} />
          <Field label="Telephone Number" value={grievance.ownerPhone ?? ""} />
        </div>
        <div className="grid grid-cols-1 gap-px mb-px">
          <Field label="Mailing Address (Street, City, State, ZIP)" value={grievance.ownerMailingAddress ?? grievance.propertyAddress} wide />
        </div>
        <div className="grid grid-cols-2 gap-px mb-1">
          <Field label="Email Address" value={grievance.ownerEmail ?? ""} />
          <Field label="Relationship to Property" value="Owner" />
        </div>
      </div>

      {/* Part Two — Basis of Complaint */}
      <div className="mb-3">
        <div className="bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 mb-1 uppercase tracking-wide">
          Part Two — Reason for Complaint (Check all that apply)
        </div>
        <div className="border border-gray-400 p-2 grid grid-cols-2 gap-x-6">
          <CheckBox
            checked={grievance.basisOfComplaint === "overvaluation"}
            label="A. Overvaluation — The current full (market) value of the property is lower than the value on which the assessment is based."
          />
          <CheckBox
            checked={grievance.basisOfComplaint === "unequal"}
            label="B. Unequal Assessment — The assessment is too high relative to assessments of similar properties in the same municipality."
          />
          <CheckBox
            checked={grievance.basisOfComplaint === "excessive"}
            label="C. Excessive Assessment — The assessment exceeds statutory limits or constitutional limitations."
          />
          <CheckBox
            checked={grievance.basisOfComplaint === "unlawful"}
            label="D. Unlawful Assessment — The property is wholly exempt, assessed in the wrong municipality, or the property no longer exists."
          />
        </div>
        <div className="border border-gray-400 border-t-0 p-1">
          <div className="text-[9px] font-bold uppercase text-gray-600 mb-0.5">How did you determine value? (check all that apply)</div>
          <div className="flex gap-6">
            <CheckBox checked={(comparables?.length ?? 0) > 0} label="Comparable sales" />
            <CheckBox checked={false} label="Recent purchase price" />
            <CheckBox checked={false} label="Certified appraisal" />
            <CheckBox checked={!!grievance.notes} label="Other (see Notes)" />
          </div>
        </div>
      </div>

      {/* Part Three — Statement of Value */}
      <div className="mb-3">
        <div className="bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 mb-1 uppercase tracking-wide">
          Part Three — Statement of Value
        </div>
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-2 py-1 text-left font-bold">Item</th>
              <th className="border border-gray-400 px-2 py-1 text-right font-bold">Current (Assessor's figures)</th>
              <th className="border border-gray-400 px-2 py-1 text-right font-bold">Your Complaint / Request</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 px-2 py-1">Assessed Valuation</td>
              <td className="border border-gray-400 px-2 py-1 text-right font-mono">${grievance.currentAssessment.toLocaleString()}</td>
              <td className="border border-gray-400 px-2 py-1 text-right font-mono">${requestedAssessment.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-1">Equalization Rate</td>
              <td className="border border-gray-400 px-2 py-1 text-right font-mono">
                {grievance.equalizationRate != null ? `${grievance.equalizationRate}%` : "N/A"}
              </td>
              <td className="border border-gray-400 px-2 py-1 text-right font-mono">
                {grievance.equalizationRate != null ? `${grievance.equalizationRate}%` : "N/A"}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 px-2 py-1">Full (Market) Value <span className="text-gray-500">(Assessment ÷ Eq. Rate)</span></td>
              <td className="border border-gray-400 px-2 py-1 text-right font-mono">${impliedFullValue.toLocaleString()}</td>
              <td className="border border-gray-400 px-2 py-1 text-right font-mono font-bold">${requestedFullValue.toLocaleString()}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-400 px-2 py-1 font-bold">Reduction Requested</td>
              <td className="border border-gray-400 px-2 py-1 text-right"></td>
              <td className="border border-gray-400 px-2 py-1 text-right font-bold font-mono">
                ${Math.max(0, grievance.currentAssessment - requestedAssessment).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>

        {grievance.notes && (
          <div className="border border-gray-400 border-t-0 p-2">
            <div className="text-[9px] font-bold uppercase text-gray-600 mb-0.5">Other Information / Property Condition</div>
            <div className="text-[10px] whitespace-pre-wrap">{grievance.notes}</div>
          </div>
        )}
      </div>

      {/* Part Four — Comparable Sales */}
      <div className="mb-4">
        <div className="bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 mb-1 uppercase tracking-wide">
          Part Four — Comparable Properties (Attach additional sheets if needed)
        </div>
        <div className="text-[9px] text-gray-600 mb-1 italic">
          List properties similar to yours that sold recently for less than your assessed full value implies. Aim for 3–6 comps within 1 mile, sold within the past 24 months.
        </div>
        <table className="w-full border-collapse text-[9px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-1 py-1 text-left">#</th>
              <th className="border border-gray-400 px-1 py-1 text-left">Property Address</th>
              <th className="border border-gray-400 px-1 py-1 text-right">Sale Price</th>
              <th className="border border-gray-400 px-1 py-1 text-center">Sale Date</th>
              <th className="border border-gray-400 px-1 py-1 text-right">Sq Ft</th>
              <th className="border border-gray-400 px-1 py-1 text-center">Bed/Bath</th>
              <th className="border border-gray-400 px-1 py-1 text-right">Assessed Value</th>
              <th className="border border-gray-400 px-1 py-1 text-left">Notes</th>
            </tr>
          </thead>
          <tbody>
            {compRows.map((comp, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"} style={{ height: 28 }}>
                <td className="border border-gray-400 px-1 text-center font-bold text-gray-500">{i + 1}</td>
                <td className="border border-gray-400 px-1">{comp?.address ?? ""}</td>
                <td className="border border-gray-400 px-1 text-right font-mono">
                  {comp ? `$${comp.salePrice.toLocaleString()}` : ""}
                </td>
                <td className="border border-gray-400 px-1 text-center">{comp?.saleDate ?? ""}</td>
                <td className="border border-gray-400 px-1 text-right">{comp?.squareFeet ?? ""}</td>
                <td className="border border-gray-400 px-1 text-center">
                  {comp?.bedrooms && comp?.bathrooms ? `${comp.bedrooms}/${comp.bathrooms}` : comp?.bedrooms ? `${comp.bedrooms}/—` : ""}
                </td>
                <td className="border border-gray-400 px-1 text-right font-mono">
                  {comp?.assessedValue ? `$${comp.assessedValue.toLocaleString()}` : ""}
                </td>
                <td className="border border-gray-400 px-1">{comp?.notes ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {comparables.length > 0 && (
          <div className="border border-gray-400 border-t-0 p-2 bg-gray-50">
            <div className="flex gap-8">
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-600">Average Comparable Sale Price: </span>
                <span className="font-mono font-bold text-[11px]">
                  ${Math.round(comparables.reduce((a, b) => a + b.salePrice, 0) / comparables.length).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-600">Your Est. Market Value: </span>
                <span className="font-mono font-bold text-[11px]">${grievance.estimatedMarketValue.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-600">Implied Overassessment: </span>
                <span className="font-mono font-bold text-[11px] text-red-700">
                  ${Math.max(0, impliedFullValue - grievance.estimatedMarketValue).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Signature */}
      <div className="mb-4">
        <div className="bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 mb-1 uppercase tracking-wide">
          Certification — Sign Below
        </div>
        <div className="border border-gray-400 p-2 text-[9px] text-gray-700 mb-2 leading-relaxed">
          I certify that all information contained in this complaint, including any attachments, is true and correct to the best of my knowledge and belief. I understand that willfully making a false statement in this complaint is a misdemeanor punishable under Penal Law Section 210.45.
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="border-b border-gray-800 mb-0.5" style={{ minHeight: 30 }}></div>
            <div className="text-[9px] text-gray-600">Signature of Complainant or Authorized Representative</div>
          </div>
          <div>
            <div className="border-b border-gray-800 mb-0.5" style={{ minHeight: 30 }}></div>
            <div className="text-[9px] text-gray-600">Date</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 pt-2 text-[8px] text-gray-500 text-center">
        Form RP-524 (Rev. 11/21) • New York State Office of Real Property Tax Services • This form does not constitute legal advice.
        For Nassau County, file using the AROW portal (AR-1 form). For NYC, use the NYC Tax Commission portal.
        Generated by Property Tax Appeal DIY.
      </div>
    </div>
  );
}
