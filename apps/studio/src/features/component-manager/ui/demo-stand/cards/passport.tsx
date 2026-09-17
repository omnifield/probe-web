import { Surface, Typography } from "@web-core/ui";
import { useComponentName } from "../../../model";

export function Passport() {
  const name = useComponentName();

  return (
    <Surface data-variant="filled">
      <Typography>{name}</Typography>
    </Surface>
  );
}
