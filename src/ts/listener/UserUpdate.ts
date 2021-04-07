const updateEvent = new CustomEvent("updateEvent");

export class UserUpdate {

  static update () {

    document.dispatchEvent(updateEvent);

  }

}
