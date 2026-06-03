import {
  Card,
  CardContent,
  Typography,
} from "@mui/material";

export default function NotificationCard({
  notification,
}) {
  const viewed =
    localStorage.getItem(notification.ID);

  return (
    <Card
      sx={{
        mb: 2,
        border: viewed
          ? "1px solid #ddd"
          : "2px solid green",
      }}
      onClick={() =>
        localStorage.setItem(notification.ID, "viewed")
      }
    >
      <CardContent>
        <Typography variant="h6">
          {notification.Type}
        </Typography>

        <Typography>
          {notification.Message}
        </Typography>

        <Typography variant="caption">
          {notification.Timestamp}
        </Typography>

        {!viewed && (
          <Typography color="success.main">
            NEW
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}