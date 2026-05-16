export const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export const tagColors = [
  "#e8a87c",
  "#7dbf8e",
  "#7ab4d4",
  "#d4be7a",
  "#b87ab4",
  "#d47a7a",
  "#7abed4",
  "#a87cb8",
];

export const getTagColor = (tag) => {
  const idx =
    tag.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    tagColors.length;
  return tagColors[idx];
};
