import { useComponentName } from "../../../model";

export function Passport() {
  const name = useComponentName();

  return <div>{name}</div>;
}
