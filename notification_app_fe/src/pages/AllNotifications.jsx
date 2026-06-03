import { useEffect, useState } from "react";
import NotificationCard from "../components/NotificationCard";
import FilterBar from "../components/FilterBar";
import { getNotifications } from "../services/api";

export default function AllNotifications() {
  const [notifications, setNotifications] =
    useState([]);

  const [type, setType] = useState("");

  useEffect(() => {
    load();
  }, [type]);

  async function load() {
    const data =
      await getNotifications(1, 10, type);

    setNotifications(data);
  }

  return (
    <>
      <FilterBar
        value={type}
        onChange={setType}
      />

      {notifications.map((n) => (
        <NotificationCard
          key={n.ID}
          notification={n}
        />
      ))}
    </>
  );
}