import { AlertTriangle, CalendarClock, CalendarCheck2, CalendarX2, Clock, ExternalLink } from "lucide-react";
import { differenceInCalendarDays, parseISO, isValid } from "date-fns";

interface DeadlineBannerProps {
  county: string;
  countyDeadlineText: string;
  specificDate?: string | null;
  portalUrl?: string;
  portalLabel?: string;
  status: string;
}

function getDaysRemaining(dateStr: string): number | null {
  try {
    const d = parseISO(dateStr);
    if (!isValid(d)) return null;
    return differenceInCalendarDays(d, new Date());
  } catch {
    return null;
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    if (!isValid(d)) return dateStr;
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export function DeadlineBanner({
  county,
  countyDeadlineText,
  specificDate,
  portalUrl,
  portalLabel,
  status,
}: DeadlineBannerProps) {
  const alreadyFiled = ["submitted", "pending", "reduced", "denied"].includes(status);
  const days = specificDate ? getDaysRemaining(specificDate) : null;
  const passed = days !== null && days < 0;
  const urgent = days !== null && days >= 0 && days <= 7;
  const warning = days !== null && days >= 0 && days > 7 && days <= 30;
  const safe = days !== null && days > 30;

  // Colors and icons based on state
  let bg: string;
  let border: string;
  let iconColor: string;
  let textColor: string;
  let Icon: React.FC<{ className?: string }>;
  let urgencyLabel: string | null = null;

  if (alreadyFiled) {
    bg = "bg-emerald-50";
    border = "border-emerald-200";
    iconColor = "text-emerald-500";
    textColor = "text-emerald-900";
    Icon = CalendarCheck2;
  } else if (passed) {
    bg = "bg-red-50";
    border = "border-red-200";
    iconColor = "text-red-500";
    textColor = "text-red-900";
    Icon = CalendarX2;
    urgencyLabel = "Deadline passed";
  } else if (urgent) {
    bg = "bg-red-50";
    border = "border-red-200";
    iconColor = "text-red-500";
    textColor = "text-red-900";
    Icon = AlertTriangle;
    urgencyLabel = `${days} day${days !== 1 ? "s" : ""} left`;
  } else if (warning) {
    bg = "bg-amber-50";
    border = "border-amber-200";
    iconColor = "text-amber-500";
    textColor = "text-amber-900";
    Icon = Clock;
    urgencyLabel = `${days} days left`;
  } else if (safe) {
    bg = "bg-blue-50";
    border = "border-blue-200";
    iconColor = "text-blue-500";
    textColor = "text-blue-900";
    Icon = CalendarClock;
    urgencyLabel = `${days} days left`;
  } else {
    // No specific date — show county rule only
    bg = "bg-secondary/50";
    border = "border-border";
    iconColor = "text-muted-foreground";
    textColor = "text-foreground";
    Icon = CalendarClock;
  }

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${bg} ${border} mb-5`}>
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className={`font-semibold text-sm ${textColor}`}>
            {alreadyFiled
              ? "Filed — deadline no longer applies"
              : passed
              ? `Deadline passed${specificDate ? ` · ${formatDate(specificDate)}` : ""}`
              : specificDate
              ? `Deadline: ${formatDate(specificDate)}`
              : `Filing deadline for ${county} County`}
          </span>

          {urgencyLabel && !alreadyFiled && !passed && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              urgent ? "bg-red-100 text-red-700" : warning ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
            }`}>
              {urgencyLabel}
            </span>
          )}

          {passed && !alreadyFiled && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              {Math.abs(days!)} day{Math.abs(days!) !== 1 ? "s" : ""} ago
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {alreadyFiled
            ? `Your case is marked as ${status}. The ${county} County deadline was ${countyDeadlineText.toLowerCase()}.`
            : passed
            ? `The standard ${county} County deadline is ${countyDeadlineText.toLowerCase()}. If you missed it, you must wait until next year — or check with your assessor for any late-filing exceptions.`
            : specificDate
            ? `${county} County standard deadline: ${countyDeadlineText}. Your specific date is set above.`
            : `${countyDeadlineText}. Set a specific date on your case to see a countdown.`}
        </p>
      </div>

      {portalUrl && !alreadyFiled && (
        <a
          href={portalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-shrink-0 flex items-center gap-1 text-xs font-medium underline underline-offset-2 ${iconColor} hover:opacity-80 transition-opacity`}
        >
          {portalLabel ?? "File online"} <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
