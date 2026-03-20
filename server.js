const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: [
    "http://bala-swiggy-app.s3-website-us-east-1.amazonaws.com",
    "http://localhost:1234"
  ]
}));

app.get("/", (req, res) => {
  res.json({ message: "Swiggy Proxy is running" });
});

const SWIGGY_HEADERS = {
  "Referer": "https://www.swiggy.com/",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Route 1 — Restaurant List
// /api/restaurants?lat=12.93&lng=77.62
app.get("/api/restaurants", async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const url = `https://www.swiggy.com/dapi/restaurants/list/v5?lat=${lat}&lng=${lng}&page_type=DESKTOP_WEB_LISTING`;

    console.log("Fetching restaurants:", url);

    const response = await fetch(url, { headers: SWIGGY_HEADERS });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Restaurant error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Route 2 — Restaurant Menu
// /api/menu?restaurantId=123&lat=12.93&lng=77.62
app.get("/api/menu", async (req, res) => {
  try {
    const { restaurantId, lat, lng } = req.query;
    const url = `https://www.swiggy.com/mapi/menu/pl?page-type=REGULAR_MENU&complete-menu=true&lat=${lat}&lng=${lng}&restaurantId=${restaurantId}`;

    console.log("Fetching menu:", url);

    const response = await fetch(url, { headers: SWIGGY_HEADERS });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Menu error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Route 3 — Swiggy CDN Images
// /api/image/fl_lossy,f_auto,q_auto,w_660/filename.jpg
app.get("/api/image/:imagePath(*)", async (req, res) => {
  try {
    const imagePath = req.params.imagePath;
    const url = `https://media-assets.swiggy.com/swiggy/${imagePath}`;

    console.log("Fetching image:", url);

    const response = await fetch(url, {
      headers: {
        "Referer": "https://www.swiggy.com/",
        "User-Agent": SWIGGY_HEADERS["User-Agent"],
      }
    });

    const contentType = response.headers.get("content-type");
    const buffer = await response.arrayBuffer();
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Image error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));