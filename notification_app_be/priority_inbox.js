const notifications = [
  {
    type: "Placement",
    message: "CSX Corporation hiring",
    timestamp: "2026-04-22 17:51:18"
  },
  {
    type: "Result",
    message: "Mid Sem",
    timestamp: "2026-04-22 17:51:30"
  },
  {
    type: "Event",
    message: "Farewell",
    timestamp: "2026-04-22 17:51:06"
  }
];

const weights = {
  Placement: 3,
  Result: 2,
  Event: 1
};

const top10 = notifications
  .sort((a, b) => {
    if (weights[b.type] !== weights[a.type]) {
      return weights[b.type] - weights[a.type];
    }

    return new Date(b.timestamp) - new Date(a.timestamp);
  })
  .slice(0, 10);

console.log("Top Priority Notifications");
console.table(top10);