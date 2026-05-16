import { useState, useEffect } from "react";
import { FileText, Archive, Sparkles, Share2, Clock, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { formatDate } from "../utils/helpers";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard")
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span className="text-muted text-sm">Loading dashboard...</span>
      </div>
    );
  }

  const { stats, recentNotes, topTags, weeklyActivity } = data || {};

  const maxActivity = Math.max(
    ...(weeklyActivity?.map((d) => d.count) || [1]),
    1,
  );

  const statCards = [
    {
      label: "Total Notes",
      value: stats?.totalNotes ?? 0,
      icon: FileText,
      color: "var(--accent)",
      to: "/notes?view=all",
    },
    {
      label: "Archived",
      value: stats?.archivedNotes ?? 0,
      icon: Archive,
      color: "var(--text-3)",
      to: "/notes?view=archived",
    },
    {
      label: "AI Summaries",
      value: stats?.aiUsageCount ?? 0,
      icon: Sparkles,
      color: "var(--yellow)",
      to: "/notes?view=ai",
    },
    {
      label: "Shared Notes",
      value: stats?.publicNotes ?? 0,
      icon: Share2,
      color: "var(--blue)",
      to: "/notes?view=shared",
    },
  ];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <span className="text-muted text-sm">Your workspace at a glance</span>
      </div>

      <div className="page-body fade-in">
        {/* Stats */}
        <div className="stats-grid">
          {statCards.map(({ label, value, icon: Icon, to }) => (
            <Link
              key={label}
              to={to}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="stat-card" style={{ cursor: "pointer" }}>
                <div className="stat-icon">
                  <Icon size={36} />
                </div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            </Link>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            marginBottom: 20,
          }}
        >
          {/* Weekly activity bar chart */}
          <div className="chart-container">
            <div className="chart-title">
              <Clock
                size={14}
                style={{
                  display: "inline",
                  marginRight: 6,
                  verticalAlign: "middle",
                  color: "var(--text-3)",
                }}
              />
              Notes Created This Week
            </div>
            {weeklyActivity?.every((d) => d.count === 0) ? (
              <div className="text-muted text-sm" style={{ padding: "20px 0" }}>
                No activity this week yet
              </div>
            ) : (
              <>
                <div className="bar-chart">
                  {weeklyActivity?.map(({ date, count }) => {
                    const heightPct =
                      maxActivity > 0 ? (count / maxActivity) * 100 : 0;
                    return (
                      <div
                        className="bar-group"
                        key={date}
                        title={`${date}: ${count} note${count !== 1 ? "s" : ""}`}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-3)",
                            marginBottom: 4,
                            textAlign: "center",
                            minHeight: 14,
                          }}
                        >
                          {count}
                        </div>
                        <div
                          className="bar"
                          style={{ height: `${Math.max(heightPct, 2)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  {weeklyActivity?.map(({ date }) => (
                    <div
                      key={date}
                      className="bar-label"
                      style={{ flex: 1, textAlign: "center" }}
                    >
                      {new Date(date)
                        .toLocaleDateString("en-IN", { weekday: "short" })
                        .slice(0, 2)}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Top tags */}
          <div className="chart-container">
            <div className="chart-title">
              <Tag
                size={14}
                style={{
                  display: "inline",
                  marginRight: 6,
                  verticalAlign: "middle",
                  color: "var(--text-3)",
                }}
              />
              Most Used Tags
            </div>
            {!topTags?.length ? (
              <div className="text-muted text-sm" style={{ padding: "20px 0" }}>
                No tags yet — add tags to your notes to see them here
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {topTags.map(({ tag, count }) => (
                  <div
                    key={tag}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span className="tag">{tag}</span>
                    <div
                      style={{
                        flex: 1,
                        height: 4,
                        background: "var(--bg-4)",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${(count / topTags[0].count) * 100}%`,
                          background: "var(--accent)",
                          borderRadius: 2,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recently edited */}
        <div className="chart-container">
          <div
            className="chart-title"
            style={{
              marginBottom: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>
              <Clock
                size={14}
                style={{
                  display: "inline",
                  marginRight: 6,
                  verticalAlign: "middle",
                  color: "var(--text-3)",
                }}
              />
              Recently Edited
            </span>
            <Link
              to="/notes"
              className="text-sm"
              style={{ color: "var(--accent)" }}
            >
              View all →
            </Link>
          </div>
          {!recentNotes?.length ? (
            <div className="text-muted text-sm">No notes yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {recentNotes.map((note) => (
                <Link
                  to={`/notes/${note._id}?view=all`}
                  key={note._id}
                  style={{ textDecoration: "none" }}
                >
                  <div className="note-card">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <div className="note-card-title">
                          {note.title || "Untitled"}
                        </div>
                        <div className="note-card-meta">
                          <span className="text-xs text-muted">
                            {formatDate(note.lastEditedAt)}
                          </span>
                          {note.tags?.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="tag"
                              style={{ fontSize: 11, padding: "1px 7px" }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      {note.aiSummary?.summary && (
                        <Sparkles
                          size={13}
                          style={{
                            color: "var(--accent)",
                            marginTop: 2,
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
