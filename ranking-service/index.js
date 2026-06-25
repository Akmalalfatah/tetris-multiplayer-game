const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "ranking-service"
  });
});

app.get("/rankings", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.username,
        pr.best_score,
        pr.updated_at
      FROM player_rankings pr
      JOIN users u ON u.id = pr.user_id
      ORDER BY pr.best_score DESC
      LIMIT 10
    `);

    const rankings = result.rows.map((row, index) => ({
      rank: index + 1,
      username: row.username,
      score: row.best_score,
      date: row.updated_at.toISOString().split("T")[0],
      grade: calculateGrade(row.best_score)
    }));

    res.json(rankings);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to load rankings"
    });
  }
});

app.post("/rankings/update", async (req, res) => {
  console.log("=== UPDATE SCORE REQUEST ===");
  console.log("body:", req.body);

  try {
    const { username, score } = req.body;
    const parsedScore = Math.floor(Number(score));

    if (!username || isNaN(parsedScore) || parsedScore < 0) {
      console.log("Validasi gagal:", { username, score, parsedScore });
      return res.status(400).json({
        success: false,
        message: "Invalid data",
      });
    }

    // Cek dulu apakah user ada di tabel users
    const userCheck = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );

    console.log("User found:", userCheck.rows);

    if (userCheck.rowCount === 0) {
      console.log("User tidak ditemukan:", username);
      return res.status(404).json({
        success: false,
        message: "User not found: " + username,
      });
    }

    const userId = userCheck.rows[0].id;

    // UPSERT: kalau belum ada row di player_rankings, buat baru
    // kalau sudah ada, update hanya jika score baru lebih tinggi
    const result = await pool.query(
      `
      INSERT INTO player_rankings (user_id, best_score, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        best_score = GREATEST(player_rankings.best_score, EXCLUDED.best_score),
        updated_at = NOW()
      RETURNING best_score
      `,
      [userId, parsedScore]
    );

    console.log("Upsert result:", result.rows[0]);

    return res.json({
      success: true,
      best_score: result.rows[0].best_score,
    });

  } catch (err) {
    console.error("Database error:", err.message);
    console.error(err.stack);

    return res.status(500).json({
      success: false,
      message: "Database error: " + err.message,
    });
  }
});

function calculateGrade(score) {
  const n = score / 50;

  if (n >= 86) return "A";
  if (n >= 75) return "B";
  if (n >= 65) return "C";

  return "D";
}

app.listen(3005, () => {
  console.log("ranking-service running on 3005");
});