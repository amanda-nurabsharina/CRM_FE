import { createFileRoute } from "@tanstack/react-router";
import { InboxPage } from "../../pages/App";

export const Route = createFileRoute("/app/inbox")({
  component: InboxPage,
});
