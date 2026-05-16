import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Tag, Calendar, User, ExternalLink, Sparkles } from "lucide-react";
import api from "../api/axios";
import { formatDate } from "../utils/helpers";

export default function SharedNotePage() {
  const { shareId } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/shared/${shareId}`)
      .then(({ data }) => setNote(data.note))
      .catch((err) => setError(err.response?.data?.error || "Note not found"))
      .finally(() => setLoading(false));
  }, [shareId]);

  if (loading)
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span className="text-muted text-sm">Loading note...</span>
      </div>
    );

  if (error)
    return (
      <div className="shared-page">
        <div className="shared-header">
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 20,
              color: "var(--accent)",
            }}
          >
            Sync Scribe
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            gap: 12,
            color: "var(--text-3)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 8 }}>🔒</div>
          <h2
            style={{ color: "var(--text)", fontFamily: "var(--font-display)" }}
          >
            Note unavailable
          </h2>
          <p style={{ fontSize: 14, maxWidth: 320, textAlign: "center" }}>
            {error}
          </p>
          <Link to="/login" className="btn btn-ghost" style={{ marginTop: 8 }}>
            Go to Sync Scribe
          </Link>
        </div>
      </div>
    );

  return (
    <div className="shared-page fade-in">
      <div className="shared-header">
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 20,
            fontWeight: 700,
            color: "var(--accent)",
          }}
        >
          Sync Scribe
        </div>
        <Link to="/signup" className="btn btn-ghost btn-sm">
          <ExternalLink size={13} />
          Create your own notes
        </Link>
      </div>

      <div className="shared-content">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
            fontSize: 13,
            color: "var(--text-3)",
          }}
        >
          <span className="badge">Public note</span>
          {note.category && (
            <span style={{ color: "var(--text-3)" }}>in {note.category}</span>
          )}
        </div>

        <h1 className="shared-title">{note.title || "Untitled Note"}</h1>

        <div className="shared-meta">
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <User size={13} />
            {note.user?.name || "Anonymous"}
          </span>
          <span>·</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Calendar size={13} />
            {formatDate(note.lastEditedAt || note.createdAt)}
          </span>
        </div>

        {/* Tags */}
        {note.tags?.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 28,
            }}
          >
            {note.tags.map((tag) => (
              <span key={tag} className="tag">
                <Tag size={10} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="shared-body">
          {note.content || "This note has no content."}
        </div>

        {/* AI Summary */}
        {note.aiSummary?.summary && (
          <div
            style={{
              marginTop: 48,
              padding: 24,
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
                color: "var(--accent)",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              <Sparkles size={15} />
              AI Summary
            </div>

            <p
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "var(--text-2)",
                marginBottom: note.aiSummary.actionItems?.length ? 16 : 0,
              }}
            >
              {note.aiSummary.summary}
            </p>

            {note.aiSummary.actionItems?.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                    color: "var(--text-3)",
                    marginBottom: 10,
                  }}
                >
                  Action Items
                </div>
                {note.aiSummary.actionItems.map((item, i) => (
                  <div key={i} className="ai-action-item">
                    {item}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        <div
          style={{
            marginTop: 60,
            paddingTop: 24,
            borderTop: "1px solid var(--border)",
            textAlign: "center",
            color: "var(--text-3)",
            fontSize: 13,
          }}
        >
          Shared via{" "}
          <Link to="/" style={{ color: "var(--accent)" }}>
            Sync Scribe
          </Link>
        </div>
      </div>
    </div>
  );
}
