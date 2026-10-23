"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { useAuth } from "@/components/Auth";
import { GuidanceCard } from "@/components/GuidanceCard";
import { evaluate, getState, REGS_VERSION, STATES } from "@/lib/regs";
import { findSpecies, SPECIES } from "@/lib/species";
import { createReport } from "@/lib/store";

const input = "w-full rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700";

const reportSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  accuracyM: z.coerce.number().int().nonnegative().optional(),
  stateCode: z.string().length(2),
  roadName: z.string().max(200).optional(),
  species: z.string(),
  sex: z.enum(["male", "female", "unknown"]).default("unknown"),
  ageClass: z.enum(["adult", "juvenile", "unknown"]).default("unknown"),
  condition: z.enum(["fresh", "bloated", "decomposed", "unknown"]).default("unknown"),
  // datetime-local is read in the browser's own timezone, which is what the reporter meant.
  observedAtLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/),
  reporterHandle: z.string().max(60).optional(),
  notes: z.string().max(1000).optional(),
});

function formObject(formData: FormData) {
  // Empty inputs come through as "", which should mean "not provided".
  return Object.fromEntries([...formData.entries()].filter(([, v]) => v !== ""));
}

function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function ReportForm() {
  const router = useRouter();
  const { user, name } = useAuth();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [stateCode, setStateCode] = useState("");
  const [speciesId, setSpeciesId] = useState("");
  const [coords, setCoords] = useState<{ lat: string; lng: string; acc: string }>({ lat: "", lng: "", acc: "" });
  const [locError, setLocError] = useState("");
  const [observedAt] = useState(nowLocal);

  const species = findSpecies(speciesId);
  const guidance = stateCode && species ? evaluate(stateCode, species.category) : null;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const parsed = reportSchema.safeParse(formObject(new FormData(e.currentTarget)));
    if (!parsed.success) return setError(parsed.error.issues.map((i) => `${i.path}: ${i.message}`).join("; "));
    const { observedAtLocal, ...input } = parsed.data;
    const sp = findSpecies(input.species);
    if (!sp) return setError("Unknown species");
    if (!getState(input.stateCode)) return setError("Unknown state");

    setPending(true);
    try {
      const id = await createReport(
        {
          ...input,
          observedAt: new Date(observedAtLocal),
          stateCode: input.stateCode.toUpperCase(),
          speciesCategory: sp.category,
          eligibility: evaluate(input.stateCode, sp.category).eligibility,
          regsVersion: REGS_VERSION,
          accuracyM: input.accuracyM ?? null,
          roadName: input.roadName ?? null,
          reporterHandle: input.reporterHandle ?? null,
          notes: input.notes ?? null,
        },
        user?.id ?? null,
      );
      router.push(`/reports/${id}`);
    } catch (err) {
      setError((err as Error).message);
      setPending(false);
    }
  }

  function locate() {
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (p) =>
        setCoords({
          lat: p.coords.latitude.toFixed(6),
          lng: p.coords.longitude.toFixed(6),
          acc: String(Math.round(p.coords.accuracy)),
        }),
      (e) => setLocError(e.message),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="font-medium">Where</legend>
        <button type="button" onClick={locate} className="rounded bg-zinc-900 px-3 py-2 text-white dark:bg-zinc-100 dark:text-black">
          Use my location
        </button>
        {locError && <p className="text-sm text-red-600">{locError}</p>}
        <div className="grid grid-cols-2 gap-2">
          <input className={input} name="lat" placeholder="Latitude" required value={coords.lat} onChange={(e) => setCoords({ ...coords, lat: e.target.value })} />
          <input className={input} name="lng" placeholder="Longitude" required value={coords.lng} onChange={(e) => setCoords({ ...coords, lng: e.target.value })} />
        </div>
        <input type="hidden" name="accuracyM" value={coords.acc} />
        <select className={input} name="stateCode" required value={stateCode} onChange={(e) => setStateCode(e.target.value)}>
          <option value="">State…</option>
          {STATES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
        <input className={input} name="roadName" placeholder="Road or highway (optional)" />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="font-medium">What</legend>
        <select className={input} name="species" required value={speciesId} onChange={(e) => setSpeciesId(e.target.value)}>
          <option value="">Species…</option>
          {SPECIES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-3 gap-2">
          <select className={input} name="sex" defaultValue="unknown">
            <option value="unknown">Sex ?</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <select className={input} name="ageClass" defaultValue="unknown">
            <option value="unknown">Age ?</option>
            <option value="adult">Adult</option>
            <option value="juvenile">Juvenile</option>
          </select>
          <select className={input} name="condition" defaultValue="unknown">
            <option value="unknown">Condition ?</option>
            <option value="fresh">Fresh</option>
            <option value="bloated">Bloated</option>
            <option value="decomposed">Decomposed</option>
          </select>
        </div>
        <label className="block text-sm">
          Seen at
          <input className={input} type="datetime-local" name="observedAtLocal" defaultValue={observedAt} required />
        </label>
      </fieldset>

      {guidance && <GuidanceCard guidance={guidance} />}

      <fieldset className="space-y-2">
        <input className={input} name="reporterHandle" defaultValue={name} placeholder="Your name or handle (optional)" />
        <textarea className={input} name="notes" rows={3} placeholder="Notes (optional)" />
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={pending} className="w-full rounded bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-50">
        {pending ? "Saving…" : "Log this animal"}
      </button>
    </form>
  );
}
