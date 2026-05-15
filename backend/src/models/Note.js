import mongoose from "mongoose";
import { nanoid } from "nanoid";

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: "Untitled Note",
      maxlength: [200, "Title too long"],
    },
    content: {
      type: String,
      default: "",
      maxlength: [50000, "Content too long"],
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags) => tags.length <= 20,
        message: "Cannot have more than 20 tags",
      },
    },
    category: {
      type: String,
      trim: true,
      default: "",
      maxlength: [50, "Category too long"],
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    shareId: {
      type: String,
      unique: true,
      sparse: true,
    },
    aiSummary: {
      summary: { type: String, default: "" },
      actionItems: { type: [String], default: [] },
      suggestedTitle: { type: String, default: "" },
      generatedAt: { type: Date },
    },
    lastEditedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Text index for search
noteSchema.index({
  title: "text",
  content: "text",
  tags: "text",
});

// Auto-update lastEditedAt on content/title change
noteSchema.pre("save", function (next) {
  if (this.isModified("content") || this.isModified("title")) {
    this.lastEditedAt = Date.now();
  }
  next();
});

//Generate share ID
noteSchema.methods.generateShareId = function () {
  this.shareId = nanoid(10);
  this.isPublic = true;
};

const Note = mongoose.model("Note", noteSchema);

export default Note;
