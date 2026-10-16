"use client";

import { useActionState } from "react";
import { claimReport, type ActionState } from "@/app/actions";

const input = "w-full rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700";

export function ClaimForm({ reportId, needsPermit }: { reportId: string; needsPermit: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(claimReport.bind(null, reportId), {});
  return (
    <form action={action} className="space-y-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-semibold">Claim this pickup</h2>
      <input className={input} name="claimantHandle" placeholder="Your name or handle" required />
      <input
        className={input}
        name="permitNumber"
        placeholder={needsPermit ? "Salvage permit / authorization number (required)" : "Permit number (if you have one)"}
        required={needsPermit}
      />
      <select className={input} name="intendedUse" defaultValue="">
        <option value="">What will you use it for?</option>
        <option value="meat">Meat</option>
        <option value="hide">Hide</option>
        <option value="antlers">Antlers</option>
        <option value="skull">Skull</option>
        <option value="research">Research</option>
        <option value="other">Other</option>
      </select>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="acknowledgedRules" required />
        I&apos;ve followed this state&apos;s salvage rules, and I won&apos;t sell any part where that&apos;s prohibited.
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="rounded bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-50">
        {pending ? "Saving…" : "Claim"}
      </button>
    </form>
  );
}
