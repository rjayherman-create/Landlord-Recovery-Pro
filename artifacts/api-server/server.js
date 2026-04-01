import express from "express";

console.log("🚀 STARTING CLEAN SERVER");

const app = express();

app.get("/", (req, res) => {
  res.send("CLEAN SERVER WORKING ✅");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log("RUNNING ON PORT", port);
});
