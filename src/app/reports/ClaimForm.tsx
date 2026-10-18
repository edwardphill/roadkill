"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { useAuth } from "@/components/Auth";
import { claimReport } from "@/lib/store";

const input = "w-full rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700";

const claimSchema = z.object({
  claimantHandle: z.string().min(1).max(60),
  permitNumber: z.string().max(80).optional(),
  intendedUse: z.enum(["meat", "hide", "antlers", "skull", "research", "other"]).optional(),
  acknowledgedRules: z.literal("on"),
});

export function ClaimForm({ reportId, needsPermit, onClaimed }: { reportId: string; needsPermit: boolean; onClaimed: () => void }) {
  const { user, name } = useAuth();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const entries = [...new FormData(e.currentTarget).entries()].filter(([, v]) => v !== "");
    const parsed = claimSchema.safeParse(Object.fromEntries(entries));
    if (!parsed.success) return setError("Add your name and confirm you've followed your state's rules.");
    if (needsPermit && !parsed.data.permitNumber) {
      return setError("This state requires a salvage permit. Enter your permit or authorization number.");
    }
    setPending(true);
    try {
      await claimReport(reportId, parsed.data, user?.id ?? null);
      onClaimed();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-semibold">Claim this pickup</h2>
      <input className={input} name="claimantHandle" defaultValue={name} placeholder="Your name or handle" required />
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
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={pending} className="rounded bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-50">
        {pending ? "Saving…" : "Claim"}
      </button>
    </form>
  );
}
