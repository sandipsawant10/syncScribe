import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Plus,
  Search,
  Archive,
  Tag,
  Sparkles,
  Share2,
  Trash2,
  X,
  Check,
  Link2,
  ArchiveRestore,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { formatDate, copyToClipboard } from "../utils/helpers";
import { useParams, useSearchParams } from "react-router-dom";

export default function NotesPage() {
  const { noteId } = useParams();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") || "all";
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const saveTimer = useRef(null);

  const openNote = useCallback(async (selectedNoteId) => {
    if (!selectedNoteId) return null;

    const fullNote = await api
      .get(`/notes/${selectedNoteId}`)
      .then(({ data }) => data.note)
      .catch(() => null);

    if (fullNote) {
      setActiveNote(fullNote);
      setShowAiPanel(!!fullNote.aiSummary?.summary);
    }

    return fullNote;
  }, []);

  // Fetch notes
  const fetchNotes = useCallback(
    async (sq, tag, archived, selectedNoteId) => {
      try {
        const params = { archived };
        if (sq) params.search = sq;
        if (tag) params.tag = tag;
        const { data } = await api.get("/notes", { params });
        const nextNotes = Array.isArray(data)
          ? data
          : Array.isArray(data?.notes)
            ? data.notes
            : [];
        setNotes(nextNotes);

        if (selectedNoteId) {
          await openNote(selectedNoteId);
        }
      } catch {
        toast.error("Failed to load notes");
      } finally {
        setLoading(false);
      }
    },
    [openNote],
  );

  const visibleNotes = useMemo(() => {
    if (showArchived || view === "archived") {
      return notes.filter((note) => note.isArchived);
    }

    if (view === "ai") {
      return notes.filter((note) => Boolean(note.aiSummary?.summary));
    }

    if (view === "shared") {
      return notes.filter((note) => note.isPublic);
    }

    return notes;
  }, [notes, showArchived, view]);

  useEffect(() => {
    const delay = search || filterTag || showArchived ? 400 : 0;
    const archived = showArchived || view === "archived" ? true : undefined;
    const timer = setTimeout(() => {
      fetchNotes(search, filterTag, archived, noteId);
    }, delay);

    return () => clearTimeout(timer);
  }, [fetchNotes, search, filterTag, showArchived, noteId, view]);

  // Create note
  const createNote = async () => {
    try {
      const { data } = await api.post("/notes", {
        title: "Untitled Note",
        content: "",
        tags: [],
      });
      setNotes((prev) => [data.note, ...prev]);
      setActiveNote(data.note);
      setShowAiPanel(false);
    } catch {
      toast.error("Could not create note");
    }
  };

  // Auto-save
  const autoSave = useCallback(async (note) => {
    if (!note?._id) return;
    setSaving(true);
    try {
      const { data } = await api.patch(`/notes/${note._id}`, {
        title: note.title,
        content: note.content,
        tags: note.tags,
        category: note.category,
      });
      setNotes((prev) =>
        prev.map((n) => (n._id === note._id ? { ...n, ...data.note } : n)),
      );
    } catch {
      // silent fail — user will see it eventually
    } finally {
      setSaving(false);
    }
  }, []);

  const scheduleAutoSave = useCallback(
    (note) => {
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => autoSave(note), 1200);
    },
    [autoSave],
  );

  const handleNoteChange = (field, value) => {
    const updated = { ...activeNote, [field]: value };
    setActiveNote(updated);
    scheduleAutoSave(updated);
  };

  // Add tag
  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (!t || activeNote.tags.includes(t)) {
      setTagInput("");
      setShowTagInput(false);
      return;
    }
    const updated = { ...activeNote, tags: [...activeNote.tags, t] };
    setActiveNote(updated);
    scheduleAutoSave(updated);
    setTagInput("");
    setShowTagInput(false);
  };

  const removeTag = (tag) => {
    const updated = {
      ...activeNote,
      tags: activeNote.tags.filter((t) => t !== tag),
    };
    setActiveNote(updated);
    scheduleAutoSave(updated);
  };

  // Archive
  const toggleArchive = async (note) => {
    try {
      await api.patch(`/notes/${note._id}`, { isArchived: !note.isArchived });
      toast.success(note.isArchived ? "Note restored" : "Note archived");
      setNotes((prev) => prev.filter((n) => n._id !== note._id));
      if (activeNote?._id === note._id) setActiveNote(null);
    } catch {
      toast.error("Action failed");
    }
  };

  // Delete
  const deleteNote = async (note) => {
    if (!confirm("Delete this note permanently?")) return;
    try {
      await api.delete(`/notes/${note._id}`);
      setNotes((prev) => prev.filter((n) => n._id !== note._id));
      if (activeNote?._id === note._id) setActiveNote(null);
      toast.success("Note deleted");
    } catch {
      toast.error("Could not delete note");
    }
  };

  // AI Summary
  const generateSummary = async () => {
    if (!activeNote?.content?.trim() || activeNote.content.trim().length < 20) {
      toast.error("Add more content before generating a summary");
      return;
    }
    // Save first
    await autoSave(activeNote);
    setAiLoading(true);
    setShowAiPanel(true);
    try {
      const { data } = await api.post(
        `/notes/${activeNote._id}/generate-summary`,
      );
      setActiveNote((prev) => ({ ...prev, aiSummary: data.aiSummary }));
      setNotes((prev) =>
        prev.map((n) =>
          n._id === activeNote._id ? { ...n, aiSummary: data.aiSummary } : n,
        ),
      );
      toast.success("AI summary ready");
    } catch (err) {
      toast.error(err.response?.data?.error || "AI summary failed");
    } finally {
      setAiLoading(false);
    }
  };

  // Share
  const toggleShare = async (note) => {
    try {
      const { data } = await api.post(`/notes/${note._id}/share`);
      const updated = {
        ...note,
        isPublic: data.isPublic,
        shareId: data.shareId,
      };
      setActiveNote(updated);
      setNotes((prev) => prev.map((n) => (n._id === note._id ? updated : n)));

      if (data.isPublic && data.shareId) {
        const url = `${window.location.origin}/shared/${data.shareId}`;
        await copyToClipboard(url);
        toast.success("Share link copied to clipboard!");
      } else {
        toast.success("Note is now private");
      }
    } catch {
      toast.error("Could not update sharing");
    }
  };

  // All unique tags from notes
  const allTags = [
    ...new Set((visibleNotes || []).flatMap((n) => n.tags || [])),
  ].slice(0, 20);

  return (
    <div className="editor-layout">
      {/* Notes list sidebar */}
      <div className="notes-sidebar">
        <div className="notes-sidebar-header">
          <div className="flex items-center justify-between">
            <span className="fw-600" style={{ fontSize: 14 }}>
              {showArchived ? "Archived" : "Notes"}
              <span
                className="text-muted"
                style={{ fontWeight: 400, marginLeft: 6 }}
              >
                ({visibleNotes.length})
              </span>
            </span>
            <button className="btn btn-sm btn-primary" onClick={createNote}>
              <Plus size={14} />
              New
            </button>
          </div>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search
              size={13}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-3)",
              }}
            />
            <input
              className="input"
              style={{ paddingLeft: 30, fontSize: 13 }}
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter tags */}
          {allTags.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {allTags.slice(0, 5).map((tag) => (
                <button
                  key={tag}
                  className={`tag${filterTag === tag ? " active" : ""}`}
                  onClick={() => setFilterTag(filterTag === tag ? "" : tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Archive toggle */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setShowArchived(!showArchived);
              setActiveNote(null);
            }}
            style={{ fontSize: 12 }}
          >
            {showArchived ? (
              <ArchiveRestore size={13} />
            ) : (
              <Archive size={13} />
            )}
            {showArchived ? "Back to notes" : "View archived"}
          </button>
        </div>

        <div className="notes-list-scroll">
          {loading ? (
            <div
              style={{ display: "flex", justifyContent: "center", padding: 40 }}
            >
              <div className="spinner" />
            </div>
          ) : visibleNotes.length === 0 ? (
            <div className="empty-state">
              <h3>
                {search || filterTag
                  ? "No matches"
                  : showArchived || view === "archived"
                    ? "No archived notes"
                    : view === "ai"
                      ? "No AI summaries yet"
                      : view === "shared"
                        ? "No shared notes"
                        : "No notes yet"}
              </h3>
              <p>
                {search || filterTag
                  ? "Try different search terms"
                  : showArchived || view === "archived"
                    ? "Archived notes will appear here"
                    : view === "ai"
                      ? "Generate a summary on a note to see it here"
                      : view === "shared"
                        ? "Share a note to see it here"
                        : "Click New to create your first note"}
              </p>
            </div>
          ) : (
            visibleNotes.map((note) => (
              <div
                key={note._id}
                className={`note-card${activeNote?._id === note._id ? " active" : ""}`}
                onClick={() => openNote(note._id)}
              >
                <div className="note-card-title">
                  {note.title || "Untitled Note"}
                </div>
                <div className="note-card-meta">
                  <span className="text-xs text-muted">
                    {formatDate(note.lastEditedAt || note.updatedAt)}
                  </span>
                  {note.isPublic && (
                    <span
                      className="badge"
                      style={{ fontSize: 10, padding: "1px 6px" }}
                    >
                      <Share2 size={9} style={{ marginRight: 3 }} />
                      shared
                    </span>
                  )}
                  {note.aiSummary?.summary && (
                    <span style={{ color: "var(--accent)", fontSize: 10 }}>
                      <Sparkles size={10} />
                    </span>
                  )}
                </div>
                {note.tags?.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      marginTop: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    {note.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="tag"
                        style={{ fontSize: 11, padding: "1px 7px" }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      {activeNote ? (
        <>
          <div className="editor-area">
            {/* Editor header */}
            <div className="editor-header">
              <input
                className="editor-title-input"
                placeholder="Note title..."
                value={activeNote.title || ""}
                onChange={(e) => handleNoteChange("title", e.target.value)}
              />
              <div className="flex items-center gap-2">
                {saving && (
                  <span className="save-indicator">
                    <div
                      className="spinner"
                      style={{ width: 12, height: 12 }}
                    />
                    Saving
                  </span>
                )}
                {!saving && (
                  <span className="save-indicator">
                    <div className="save-dot" />
                    Saved
                  </span>
                )}
              </div>
            </div>

            {/* Toolbar */}
            <div className="editor-toolbar">
              {/* Tags */}
              {activeNote.tags?.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                  <button className="tag-remove" onClick={() => removeTag(tag)}>
                    <X size={10} />
                  </button>
                </span>
              ))}

              {showTagInput ? (
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <input
                    className="input"
                    style={{ width: 120, padding: "4px 8px", fontSize: 12 }}
                    placeholder="tag name..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addTag();
                      if (e.key === "Escape") {
                        setShowTagInput(false);
                        setTagInput("");
                      }
                    }}
                    autoFocus
                  />
                  <button className="btn-icon btn-ghost" onClick={addTag}>
                    <Check size={13} />
                  </button>
                  <button
                    className="btn-icon btn-ghost"
                    onClick={() => {
                      setShowTagInput(false);
                      setTagInput("");
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowTagInput(true)}
                >
                  <Tag size={12} />
                  Add tag
                </button>
              )}

              <div style={{ flex: 1 }} />

              {/* Category input */}
              <input
                className="input"
                style={{ width: 130, padding: "5px 10px", fontSize: 12 }}
                placeholder="Category..."
                value={activeNote.category || ""}
                onChange={(e) => handleNoteChange("category", e.target.value)}
              />

              {/* Actions */}
              <button
                className="btn btn-ghost btn-sm"
                onClick={generateSummary}
                disabled={aiLoading}
                title="Generate AI summary"
              >
                {aiLoading ? (
                  <span className="spinner" style={{ width: 13, height: 13 }} />
                ) : (
                  <Sparkles size={13} />
                )}
                AI Summary
              </button>

              <button
                className={`btn btn-sm ${activeNote.isPublic ? "btn-primary" : "btn-ghost"}`}
                onClick={() => toggleShare(activeNote)}
                title={
                  activeNote.isPublic
                    ? "Note is public — click to make private"
                    : "Share note"
                }
              >
                {activeNote.isPublic ? (
                  <Link2 size={13} />
                ) : (
                  <Share2 size={13} />
                )}
                {activeNote.isPublic ? "Shared" : "Share"}
              </button>

              <button
                className="btn btn-ghost btn-sm"
                onClick={() => toggleArchive(activeNote)}
                title={activeNote.isArchived ? "Restore note" : "Archive note"}
              >
                {activeNote.isArchived ? (
                  <ArchiveRestore size={13} />
                ) : (
                  <Archive size={13} />
                )}
              </button>

              <button
                className="btn btn-danger btn-sm btn-icon"
                onClick={() => deleteNote(activeNote)}
                title="Delete note"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Content area */}
            <div className="editor-body">
              <textarea
                className="editor-textarea"
                placeholder="Start writing... your thoughts are safe here."
                value={activeNote.content || ""}
                onChange={(e) => handleNoteChange("content", e.target.value)}
              />
            </div>

            {/* Bottom meta */}
            <div
              style={{
                padding: "10px 24px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                gap: 16,
                fontSize: 12,
                color: "var(--text-3)",
              }}
            >
              <span>{activeNote.content?.length || 0} chars</span>
              <span>
                {activeNote.content?.trim().split(/\s+/).filter(Boolean)
                  .length || 0}{" "}
                words
              </span>
              <span>
                Last edited{" "}
                {formatDate(activeNote.lastEditedAt || activeNote.updatedAt)}
              </span>
            </div>
          </div>

          {/* AI Panel */}
          {showAiPanel && (
            <div className="ai-panel fade-in">
              <div className="ai-panel-header">
                <div className="ai-panel-title">
                  <Sparkles size={13} />
                  AI Insights
                </div>
                <button
                  className="btn-icon btn-ghost"
                  onClick={() => setShowAiPanel(false)}
                >
                  <X size={14} />
                </button>
              </div>

              <div className="ai-panel-body">
                {aiLoading ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 12,
                      padding: 32,
                      color: "var(--text-3)",
                    }}
                  >
                    <div className="spinner" />
                    <span style={{ fontSize: 13 }}>Thinking...</span>
                  </div>
                ) : activeNote.aiSummary?.summary ? (
                  <>
                    {activeNote.aiSummary.suggestedTitle && (
                      <div>
                        <div className="ai-section-label">Suggested Title</div>
                        <div
                          style={{
                            fontSize: 13,
                            color: "var(--accent)",
                            fontWeight: 500,
                          }}
                        >
                          {activeNote.aiSummary.suggestedTitle}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="ai-section-label">Summary</div>
                      <div className="ai-summary-text">
                        {activeNote.aiSummary.summary}
                      </div>
                    </div>

                    {activeNote.aiSummary.actionItems?.length > 0 && (
                      <div>
                        <div className="ai-section-label">Action Items</div>
                        {activeNote.aiSummary.actionItems.map((item, i) => (
                          <div key={i} className="ai-action-item">
                            {item}
                          </div>
                        ))}
                      </div>
                    )}

                    {activeNote.aiSummary.generatedAt && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-3)",
                          marginTop: 4,
                        }}
                      >
                        Generated {formatDate(activeNote.aiSummary.generatedAt)}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="ai-empty">
                    <Sparkles size={28} />
                    <p>
                      Click "AI Summary" to generate insights from this note
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="empty-state">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.3"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <h3>Select a note</h3>
            <p>
              Choose a note from the sidebar, or create a new one to get
              started.
            </p>
            <button
              className="btn btn-primary"
              style={{ marginTop: 8 }}
              onClick={createNote}
            >
              <Plus size={15} />
              New Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
