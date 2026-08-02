import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "../pages/App";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});
