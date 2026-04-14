import app from "./app.js";

// 🔥 FORCE LOGS TO SHOW
console.log("🚀 SERVER FILE STARTED");

// 🔥 GLOBAL ERROR HANDLING
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ UNHANDLED REJECTION:", err);
});

// 🔥 SAFE SERVER START
const port = process.env.PORT || 3000;

try {
  const PORT = process.env.PORT || 8080;
app.listen(PORT) => {
    console.log(`🚀 Server running on port ${port}`);
  });
} catch (err) {
  console.error("❌ SERVER FAILED TO START:", err);
}
