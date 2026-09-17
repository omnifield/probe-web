import { createFileRoute } from "@tanstack/solid-router";
import { EmbedPage } from "./index";

interface EmbedSearch {
  content?: string;
}

export const Route = createFileRoute("/embed/$component/$assembly")({
  validateSearch: (search: Record<string, unknown>): EmbedSearch => ({
    content:
      typeof search["content"] === "string" ? search["content"] : undefined,
  }),
  component: () => {
    const params = Route.useParams();
    const search = Route.useSearch();
    return (
      <EmbedPage
        component={params().component}
        assembly={params().assembly}
        content={search().content}
      />
    );
  },
});
