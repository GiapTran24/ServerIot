import express from "express";
import "dotenv/config";
import cors from "cors";
import deviceRoutes from "./src/routes/deviceRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/devices", deviceRoutes);

app.get("/", (req, res) => {
  res.send("** Express Server Running for IoT Application **");
});

const PORT = process.env.PORT || 5000;
console.log("");
console.log("Starting server ...");
app.listen(PORT, () => console.log(`=> Server running on port ${PORT}`));
