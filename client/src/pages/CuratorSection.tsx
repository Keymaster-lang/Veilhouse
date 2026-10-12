import { useRoute } from "wouter";
import CuratorWorkspace from "./CuratorWorkspace";

type Section = "archive-control" | "specimen-editor" | "media-chamber" | "hero-carousel" | "submission-inbox" | "dream-records" | "resident-registry" | "archive-doors" | "dispatches-editor" | "field-notes-library" | "manifesto-editor" | "site-configuration" | "archive-audit";

export default function CuratorSection() {
  const [, params] = useRoute("/curator-admin/:section");
  const section = (params?.section || "archive-control") as Section;
  return <CuratorWorkspace section={section} />;
}
