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

const PORT = process.env.PORT || 8080;
app.listen(PORT) => {
  console.log("RUNNING ON PORT", port);
});
