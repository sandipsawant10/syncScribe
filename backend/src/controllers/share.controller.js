import Note from "../models/Note";

const getSharedNote = async (req, res) => {
  try {
    const note = await Note.findOne({
      shareId: req.params.shareId,
      isPublic: true,
    })
      .populate("user", "name")
      .select(
        "title content tags category aiSummary lastEditedAt createdAt updatedAt",
      )
      .lean();

    if (!note) {
      return res
        .status(404)
        .json({ error: "This note is not available or has been made private" });
    }

    res.json({ note });
  } catch (error) {
    console.error("Shared note error:", error);
    res.status(500).json({ error: "Failed to load shared note." });
  }
};

export { getSharedNote };
