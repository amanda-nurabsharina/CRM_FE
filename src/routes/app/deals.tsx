import { createFileRoute } from "@tanstack/react-router";
import { Deals } from "../../pages/App";

export const Route = createFileRoute("/app/deals")({
  component: Deals,
});
