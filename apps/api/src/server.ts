import { app, env } from "./app.js";

const PORT = env.PORT ?? 3001;

app.listen(PORT, () => {
  console.log(JSON.stringify({ level: "info", message: "API server started", port: PORT }));
});

process.on("unhandledRejection", (reason) => {
  console.error(JSON.stringify({
    level: "error",
    message: "Unhandled promise rejection",
    reason: reason instanceof Error ? reason.message : String(reason),
  }));
});
