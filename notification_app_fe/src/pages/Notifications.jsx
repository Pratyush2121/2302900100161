import { Log } from "../../../logging_middleware";

useEffect(() => {

  Log(
    "frontend",
    "info",
    "page",
    "Notifications page loaded"
  );

}, []);