export const UserUpdate = {
  UPDATE_EVENT_NAME: "updateEvent",

  update(): void {
    document.dispatchEvent(new CustomEvent(UserUpdate.UPDATE_EVENT_NAME));
  },
};
