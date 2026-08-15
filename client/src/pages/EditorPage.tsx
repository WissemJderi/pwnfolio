import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TbEdit, TbTrash } from "react-icons/tb";
import { api } from "../api/client";
import type {
  Category,
  ChainStep,
  Difficulty,
  Writeup,
  WriteupStatus,
} from "../api/types";
import { useAuth } from "../context/AuthContext";
import { getAuthorId } from "../lib/format";
import { FormSkeleton } from "../components/Skeleton";
import { ChainStepsEditor } from "../components/ExploitChain/ChainStepsEditor";

const CATEGORIES: Category[] = ["web", "pwn", "crypto", "forensics", "osint", "misc"];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "insane"];
const SECTION_KEYS = ["recon", "approach", "exploitChain", "takeaway"] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

interface FormState {
  title: string;
  category: Category;
  difficulty: string;
  platform: string;
  tags: string;
  cveRefs: string;
  sections: Record<SectionKey, string>;
  chainSteps: ChainStep[];
}

const emptyForm = (): FormState => ({
  title: "",
  category: "web",
  difficulty: "",
  platform: "",
  tags: "",
  cveRefs: "",
  sections: { recon: "", approach: "", exploitChain: "", takeaway: "" },
  chainSteps: [],
});

const toCsv = (values: string[]): string => values.join(", ");
const fromCsv = (value: string): string[] =>
  value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const EditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const editing = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState<FormState>(emptyForm());
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notMine, setNotMine] = useState(false);

  useEffect(() => {
    if (!editing || !id) return;
    api<Writeup>(`/api/writeups/${id}`)
      .then((w) => {
        if (user && getAuthorId(w) !== user.id) {
          setNotMine(true);
          return;
        }
        setForm({
          title: w.title,
          category: w.category,
          difficulty: w.difficulty ?? "",
          platform: w.platform ?? "",
          tags: toCsv(w.tags),
          cveRefs: toCsv(w.cveRefs),
          sections: { ...w.sections },
          chainSteps: w.chainSteps ?? [],
        });
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [editing, id, user]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setSection = (key: SectionKey, value: string) =>
    setForm((f) => ({ ...f, sections: { ...f.sections, [key]: value } }));

  const save = async (status: WriteupStatus) => {
    setSaving(true);
    setError(null);
    const payload = {
      title: form.title.trim(),
      category: form.category,
      difficulty: form.difficulty || undefined,
      platform: form.platform.trim(),
      tags: fromCsv(form.tags),
      cveRefs: fromCsv(form.cveRefs),
      sections: form.sections,
      chainSteps: form.chainSteps,
      status,
    };
    try {
      const saved = editing
        ? await api<Writeup>(`/api/writeups/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : await api<Writeup>("/api/writeups", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      navigate(status === "published" ? `/writeups/${saved._id}` : "/me/writeups");
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editing || !id) return;
    if (!window.confirm("Delete this writeup permanently?")) return;
    try {
      await api(`/api/writeups/${id}`, { method: "DELETE" });
      navigate("/me/writeups");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) {
    return <FormSkeleton />;
  }

  if (notMine) {
    return (
      <p className="py-20 text-center font-mono text-ink-500">
        $ sudo edit /writeups/{id} → permission denied: not your writeup
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="muted mb-4 truncate">
        $ vim ~/writeups/
        <span className="text-neon-500">{editing ? form.title || "untitled" : "untitled"}</span>
        {" .md"}
        <span className="cursor" />
      </p>
      <h1 className="flex items-center gap-2 font-mono text-2xl font-bold">
        <TbEdit size={22} className="text-vio-400" />
        {editing ? "edit-writeup" : "new-writeup"}
      </h1>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save("published");
        }}
      >
        <div>
          <label className="label">title</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">category</label>
            <select
              className="input"
              value={form.category}
              onChange={(e) => set("category", e.target.value as Category)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">difficulty</label>
            <select
              className="input"
              value={form.difficulty}
              onChange={(e) => set("difficulty", e.target.value)}
            >
              <option value="">—</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">platform</label>
            <input
              className="input"
              placeholder="TryHackMe, HackTheBox…"
              value={form.platform}
              onChange={(e) => set("platform", e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">
              tags <span className="normal-case tracking-normal text-ink-500">/ comma separated</span>
            </label>
            <input
              className="input"
              placeholder="sqli, burpsuite"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
            />
          </div>
          <div>
            <label className="label">
              cve refs <span className="normal-case tracking-normal text-ink-500">/ comma separated</span>
            </label>
            <input
              className="input"
              placeholder="CVE-2021-44228"
              value={form.cveRefs}
              onChange={(e) => set("cveRefs", e.target.value)}
            />
          </div>
        </div>

        {SECTION_KEYS.map((key) => (
          <div key={key} className="panel p-4">
            <label className="label">
              <span className="text-neon-500">## </span>
              {key === "exploitChain" ? "exploit-chain" : key}
            </label>
            <textarea
              className="input min-h-32"
              value={form.sections[key]}
              onChange={(e) => setSection(key, e.target.value)}
              required
            />
          </div>
        ))}

        <div>
          <label className="label">
            <span className="text-neon-500">## </span>
            exploit-chain-steps{" "}
            <span className="normal-case tracking-normal text-ink-500">
              / optional, powers the visualizer
            </span>
          </label>
          <ChainStepsEditor
            steps={form.chainSteps}
            onChange={(chainSteps) => set("chainSteps", chainSteps)}
          />
        </div>

        {error && <p className="font-mono text-sm text-blood-400">{error}</p>}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line-800 pt-4">
          {editing && (
            <button
              type="button"
              className="btn btn-danger text-xs"
              onClick={() => void remove()}
            >
              <TbTrash size={14} /> rm
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline text-xs"
            disabled={saving}
            onClick={() => void save("draft")}
          >
            :w draft
          </button>
          <button type="submit" className="btn btn-primary text-xs" disabled={saving}>
            {saving ? ":wq…" : editing ? ":wq & publish" : ":wq publish"}
          </button>
        </div>
      </form>
    </div>
  );
};
