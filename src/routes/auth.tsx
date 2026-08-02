import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "../pages/Auth";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});
