import app from "./app.js";

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

const PORT = Number(process.env.PORT) || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
