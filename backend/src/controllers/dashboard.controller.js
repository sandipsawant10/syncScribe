import Note from "../models/Note.js";
import User from "../models/User.js";

const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const toLocalDateKey = (dateValue) => {
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return null;

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

    const [totalNotes, archivedNotes, recentNotes, allNotes, user] =
      await Promise.all([
        Note.countDocuments({ user: userId }),
        Note.countDocuments({ user: userId, isArchived: true }),
        Note.find({ user: userId, isArchived: false })
          .sort("-lastEditedAt")
          .limit(5)
          .select("title tags lastEditedAt")
          .lean(),
        Note.find({ user: userId })
          .select("tags createdAt lastEditedAt isArchived isPublic")
          .lean(),
        User.findById(userId).select("aiUsageCount createdAt"),
      ]);

    // tag freq
    const tagMap = {};
    allNotes.forEach((note) => {
      note.tags.forEach((tag) => {
        tagMap[tag] = (tagMap[tag] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag, count]) => ({ tag, count }));

    //weekly activity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyActivity = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = toLocalDateKey(d);
      weeklyActivity[key] = 0;
    }

    allNotes.forEach((note) => {
      const day = toLocalDateKey(note.lastEditedAt || note.createdAt);
      if (!day) return;

      if (Object.prototype.hasOwnProperty.call(weeklyActivity, day)) {
        weeklyActivity[day]++;
      }
    });

    const weeklyData = Object.entries(weeklyActivity).map(([date, count]) => ({
      date,
      count,
    }));

    res.json({
      stats: {
        totalNotes,
        archivedNotes,
        aiUsageCount: user.aiUsageCount,
        publicNotes: allNotes.filter((n) => n.isPublic).length,
      },
      recentNotes,
      topTags,
      weeklyActivity: weeklyData,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Failed to load dashboard data." });
  }
};

export { getDashboard };
