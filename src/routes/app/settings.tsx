import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "../../pages/App";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});
