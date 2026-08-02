import { createFileRoute } from "@tanstack/react-router";
import { AuditPage } from "../../pages/App";

export const Route = createFileRoute("/app/audit")({
  component: AuditPage,
});
