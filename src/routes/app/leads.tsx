import { createFileRoute } from "@tanstack/react-router";
import { Leads } from "../../pages/App";

export const Route = createFileRoute("/app/leads")({
  component: Leads,
});
