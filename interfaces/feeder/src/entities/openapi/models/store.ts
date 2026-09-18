import { createActionStore } from "@web-core/store";
import { mutate } from "@web-core/store/mutate";

export interface Group {
  readonly id: string;
  readonly name: string;
  readonly schemaId: string;
}

interface GroupsState {
  readonly groups: readonly Group[];
}

export const groupsStore = createActionStore<
  GroupsState,
  {
    addGroup(name: string, schemaId: string): void;
    removeGroup(id: string): void;
  }
>({ groups: [] }, ({ setState }) => ({
  addGroup(name, schemaId) {
    setState(
      mutate<GroupsState>((draft) => {
        draft.groups.push({ id: crypto.randomUUID(), name, schemaId });
      }),
    );
  },
  removeGroup(id) {
    setState(
      mutate<GroupsState>((draft) => {
        draft.groups = draft.groups.filter((group) => group.id !== id);
      }),
    );
  },
}));
