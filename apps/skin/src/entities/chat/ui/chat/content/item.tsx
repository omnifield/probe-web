import {
  Avatar,
  AvatarFallback,
  Flow,
  FlowItem,
  Surface,
  Typography,
} from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";

import type { ChatMessage } from "../../../model";

const OWN_AUTHOR = "Вы";

function initialsOf(author: string): string {
  return author.slice(0, 2).toUpperCase();
}

export function ChatItem(props: { message: ChatMessage }) {
  const own = props.message.author === OWN_AUTHOR;
  const avatar = (
    <Avatar>
      <AvatarFallback>{initialsOf(props.message.author)}</AvatarFallback>
    </Avatar>
  );
  const bubble = (
    <Surface>
      <Typography>{props.message.text}</Typography>
    </Surface>
  );

  return (
    <Flow
      style={layoutSelf({
        align: "stretch",
        justify: own ? "end" : "start",
      })}
    >
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        {own ? [bubble] : [avatar, bubble]}
      </FlowItem>
    </Flow>
  );
}
