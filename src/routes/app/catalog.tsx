import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "../../pages/App";

export const Route = createFileRoute("/app/catalog")({
  component: CatalogPage,
});
