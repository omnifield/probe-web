import { useParams } from "@web-core/router";
import { Typography } from "@web-core/ui";

export function KitchenPage() {
  const params = useParams({ strict: false }) as () => {
    component?: string;
    feature?: string;
  };

  return (
    <>
      <Typography>компонент: {params().component ?? "—"}</Typography>
      <Typography>фича: {params().feature ?? "—"}</Typography>
    </>
  );
}
