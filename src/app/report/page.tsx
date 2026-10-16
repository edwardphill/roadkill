import { Suspense } from "react";
import { ReportForm } from "./ReportForm";

export default function NewReportPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Log roadkill</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Every report counts, whether or not you pick it up. Pick the state and species to see if salvage is allowed.
      </p>
      {/* The form defaults "seen at" to the visitor's current time, so it renders per request. */}
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <ReportForm />
      </Suspense>
    </div>
  );
}
