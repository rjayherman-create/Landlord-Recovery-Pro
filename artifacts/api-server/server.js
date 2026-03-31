import express from "express";

console.log("🚀 STARTING SERVER");

const app = express();

app.get("/", (req, res) => {
  res.send("WORKING 🚀 FINAL");
});

const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log("RUNNING ON PORT", port);
});
