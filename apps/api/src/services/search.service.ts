import Fuse from "fuse.js";
import { readVideos } from "../db/db.js";
import type { Video } from "../db/schema.js";

export function searchVideos(query: string): Video[] {
  const videos = readVideos().filter((v) => v.status === "ready");

  const fuse = new Fuse(videos, {
    keys: [
      { name: "title", weight: 0.7 },
      { name: "tags", weight: 0.3 },
    ],
    threshold: 0.4,
    includeScore: true,
  });

  const results = fuse.search(query);
  return results.map((r) => r.item);
}
