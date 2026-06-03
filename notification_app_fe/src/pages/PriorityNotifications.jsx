import { useEffect, useState } from "react";
import NotificationCard from "../components/NotificationCard";
import { getNotifications } from "../services/api";

export default function PriorityNotifications() {
  const [data, setData] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const notifications =
      await getNotifications(1, 50);

    const weight = {
      Placement: 3,
      Result: 2,
      Event: 1,
    };

    const sorted = notifications
      .sort((a, b) => {
        if (
          weight[a.Type] !==
          weight[b.Type]
        ) {
          return (
            weight[b.Type] -
            weight[a.Type]
          );
        }

        return (
          new Date(b.Timestamp) -
          new Date(a.Timestamp)
        );
      })
      .slice(0, 10);

    setData(sorted);
  }

  return (
    <>
      {data.map((n) => (
        <NotificationCard
          key={n.ID}
          notification={n}
        />
      ))}
    </>
  );
}