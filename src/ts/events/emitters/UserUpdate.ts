const UPDATE_EVENT_NAME = "updateEvent";

export class UserUpdate {
  static update() {
    document.dispatchEvent(new CustomEvent(UserUpdate.UPDATE_EVENT));
  }

  static get UPDATE_EVENT() {
    return UPDATE_EVENT_NAME;
  }
}
