const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
app.use(cors());

app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "api-gateway" });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "api gateway route works" });
});

app.use((req, res, next) => {
  console.log("REQ:", req.method, req.url);
  next();
});

app.use(
  "/api/auth",
  createProxyMiddleware({
    target: process.env.LOGIN_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/auth": "" },
  })
);

app.use(
  "/api/rankings",
  createProxyMiddleware({
    target: process.env.RANKING_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path, req) => {
      const newPath = "/rankings" + (path === "/" ? "" : path);
      console.log("PATH REWRITE:", path, "→", newPath);
      return newPath;
    },
    on: {
      proxyReq: (proxyReq, req) => {
        console.log("PROXY rankings:", req.method, req.url, "→", proxyReq.path);
      },
    },
  })
);

app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`api-gateway running on ${PORT}`);
});