import { Icon, Button, Typography } from "@web-core/ui";

export function LabPage() {
  return (
    <>
      <Typography>dwaddawdwadawdawd</Typography>
      <Button
        data-variant="error-quiet"
        onClick={() => console.log("wdad")}
        aria-label="Убрать"
      >
        dwadd deletewasdawdwad
        <Icon name="trash" />
      </Button>
    </>
  );
}
