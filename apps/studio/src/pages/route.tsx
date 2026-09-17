import { createFileRoute } from "@tanstack/solid-router";
import { WorkspaceLayout } from "./index";

export const Route = createFileRoute("/_workspace")({
  component: () => {
    return <WorkspaceLayout />;
  },
});
