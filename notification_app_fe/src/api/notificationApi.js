import { Log } from "../../../logging_middleware";

export async function fetchNotifications() {

  await Log(
    "frontend",
    "info",
    "api",
    "Calling notification API"
  );

  const response = await fetch(
    "http://localhost:3000/api/v1/notifications"
  );

  return response.json();
}