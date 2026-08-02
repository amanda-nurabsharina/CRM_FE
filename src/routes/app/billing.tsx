import { createFileRoute } from "@tanstack/react-router";
import { BillingPage } from "../../pages/App";

export const Route = createFileRoute("/app/billing")({
  component: BillingPage,
});
