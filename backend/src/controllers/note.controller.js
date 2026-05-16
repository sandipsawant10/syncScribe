import Note from "../models/Note.js";
import User from "../models/User.js";
import { generateAISummary } from "../utils/aiSummary.js";

const getNotes = async (req, res) => {
  try {
    const {
      search,
      tag,
      category,
      archived,
      sort = "-lastEditedAt",
    } = req.query;

    const query = {
      user: req.user._id,
    };

    if (archived === "true") {
      query.isArchived = true;
    } else if (archived === "false") {
      query.isArchived = false;
    }

    if (tag) query.tags = { $in: [tag] };
    if (category) query.category = category;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const notes = await Note.find(query)
      .sort(sort)
      .select(
        "title tags category isArchived isPublic shareId aiSummary lastEditedAt createdAt updatedAt",
      )
      .lean();

    res.json(notes);
  } catch (error) {
    console.error("Get notes error:", error);
    res.status(500).json({ message: "Failed to fetch notes" });
  }
};

const getNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json({ note });
  } catch (error) {
    console.error("Get note error:", error);
    res.status(500).json({ error: "Failed to fetch note." });
  }
};

const createNote = async (req, res) => {
  try {
    const { title, content, tags, category } = req.body;

    const note = await Note.create({
      user: req.user._id,
      title: title || "Untitled Note",
      content: content || "",
      tags: tags || [],
      category: category || "",
    });

    res.status(201).json({ note });
  } catch (error) {
    console.error("Create note error:", error);
    res.status(500).json({ error: "Failed to create note." });
  }
};

const updateNote = async (req, res) => {
  try {
    const { title, content, tags, category, isArchived } = req.body;

    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = tags;
    if (category !== undefined) note.category = category;
    if (isArchived !== undefined) note.isArchived = isArchived;

    await note.save();

    res.json({ note });
  } catch (error) {
    console.error("Update note error:", error);
    res.status(500).json({ error: "Failed to update note." });
  }
};

const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }

    res.json({ message: "Note deleted." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete note." });
  }
};

const generateSummary = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });

    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }

    if (!note.content || note.content.trim().length < 20) {
      return res.status(400).json({
        error: "Note needs more content before generating a summary.",
      });
    }

    const aiResult = await generateAISummary(note.title, note.content);

    note.aiSummary = {
      summary: aiResult.summary,
      actionItems: aiResult.action_items,
      suggestedTitle: aiResult.suggested_title,
      generatedAt: new Date(),
    };

    await note.save();

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { aiUsageCount: 1 },
    });

    res.json({ aiSummary: note.aiSummary });
  } catch (error) {
    console.error("AI summary error", error);
    res
      .status(500)
      .json({ error: "AI summary generation failed. Please try again" });
  }
};

const toggleShare = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });

    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }

    if (note.isPublic) {
      //Unshare
      note.isPublic = false;
      note.shareId = undefined;
    } else {
      note.generateShareId();
    }

    await note.save();

    res.json({
      isPublic: note.isPublic,
      shareId: note.shareId || null,
    });
  } catch (error) {
    console.error("Toggle share error:", error);
    res.status(500).json({ error: "Failed to update sharing settings." });
  }
};

export {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  generateSummary,
  toggleShare,
};
