import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type {
  Category,
  Difficulty,
  Writeup,
  WriteupStatus,
} from "../api/types";
import { useAuth } from "../context/AuthContext";
import { getAuthorId } from "../lib/format";

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
}

const emptyForm = (): FormState => ({
  title: "",
  category: "web",
  difficulty: "",
  platform: "",
  tags: "",
  cveRefs: "",
  sections: { recon: "", approach: "", exploitChain: "", takeaway: "" },
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

  if (loading) return <p className="py-16 text-center text-slate-400">Loading…</p>;

  if (notMine) {
    return (
      <p className="py-16 text-center text-slate-500">
        You can't edit someone else's writeup.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">
        {editing ? "Edit writeup" : "New writeup"}
      </h1>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save("published");
        }}
      >
        <div>
          <label className="mb-1 block text-sm text-slate-400">Title</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm text-slate-400">Category</label>
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
            <label className="mb-1 block text-sm text-slate-400">Difficulty</label>
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
            <label className="mb-1 block text-sm text-slate-400">Platform</label>
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
            <label className="mb-1 block text-sm text-slate-400">
              Tags (comma separated)
            </label>
            <input
              className="input"
              placeholder="sqli, burpsuite"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">
              CVE refs (comma separated)
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
          <div key={key}>
            <label className="mb-1 block text-sm capitalize text-slate-400">
              {key === "exploitChain" ? "Exploit chain" : key}
            </label>
            <textarea
              className="input min-h-32"
              value={form.sections[key]}
              onChange={(e) => setSection(key, e.target.value)}
              required
            />
          </div>
        ))}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-2">
          {editing && (
            <button
              type="button"
              className="btn-danger"
              onClick={() => void remove()}
            >
              Delete
            </button>
          )}
          <button
            type="button"
            className="btn-outline"
            disabled={saving}
            onClick={() => void save("draft")}
          >
            Save draft
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : editing ? "Update & publish" : "Publish"}
          </button>
        </div>
      </form>
    </div>
  );
};
