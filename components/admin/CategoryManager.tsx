"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = { name: string; count: number };

function CategoryRow({ row }: { row: Row }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(row.name);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: row.name, to: name }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "That didn't save.");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-hairline py-3">
      {editing ? (
        <form onSubmit={save} className="flex flex-1 flex-wrap items-center gap-2">
          <label htmlFor={`cat-${row.name}`} className="sr-only">New name for {row.name}</label>
          <input
            id={`cat-${row.name}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="min-w-60 flex-1 border border-hairline bg-white px-3 py-1.5 text-[14px] focus:border-ink focus:outline-none"
          />
          <button type="submit" disabled={saving} className="bg-plum px-3.5 py-1.5 text-[13px] text-ivory disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => { setEditing(false); setName(row.name); setError(""); }} className="px-2 text-[13px] underline decoration-1 underline-offset-4">
            Cancel
          </button>
          {error && <p role="alert" className="w-full text-[12.5px] text-red-700">{error}</p>}
        </form>
      ) : (
        <>
          <span className="flex-1 text-[15px]">{row.name}</span>
          <span className="text-[13px] text-muted-text">
            {row.count} {row.count === 1 ? "book" : "books"}
          </span>
          <button type="button" onClick={() => setEditing(true)} className="text-[13px] underline decoration-1 underline-offset-4 hover:text-brass-text">
            Rename<span className="sr-only"> {row.name}</span>
          </button>
        </>
      )}
    </li>
  );
}

export default function CategoryManager({ categories }: { categories: Row[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "That didn't save.");
      return;
    }
    setNewName("");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <h1 className="font-display text-[30px]">Categories</h1>
      <p className="mt-2 text-[14px] text-soft">
        These are the categories on the submission form and the directory&rsquo;s category buttons. Renaming one
        updates every book that uses it. A category only shows as a button on the directory once a visible book uses it.
      </p>
      <ul className="mt-6 border-t border-hairline">
        {categories.map((row) => (
          <CategoryRow key={row.name} row={row} />
        ))}
      </ul>
      <form onSubmit={add} className="mt-6 flex flex-wrap items-center gap-2">
        <label htmlFor="new-category" className="label text-[14px] text-soft">Add a category</label>
        <input
          id="new-category"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="min-w-60 flex-1 border border-hairline bg-white px-3 py-1.5 text-[14px] focus:border-ink focus:outline-none"
        />
        <button type="submit" className="bg-plum px-3.5 py-1.5 text-[13px] text-ivory">Add</button>
        {error && <p role="alert" className="w-full text-[12.5px] text-red-700">{error}</p>}
      </form>
    </div>
  );
}
