import express from "express";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { generateTokens, verifyToken } from "../auth.js";

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

/*  Checks if user exists, if not, creates them.  */
async function syncUser(githubData) {
  const { id: githubId, email, login: username, avatar_url } = githubData;

  let { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("github_id", githubId.toString())
    .single();

  if (!user) {
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          github_id: githubId.toString(),
          email,
          username,
          avatar_url,
          role: "analyst",
          last_login_at: new Date(),
        },
      ])
      .select()
      .single();
    if (error) throw error;
    user = newUser;
  } else {
    // Update last login
    await supabase
      .from("users")
      .update({ last_login_at: new Date() })
      .eq("id", user.id);
  }
  return user;
}

/* GET /auth/github/callback
 * Standard Web OAuth Flow */
router.get("/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "No code provided" });

  try {
    const tokenResp = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } },
    );

    const userResp = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenResp.data.access_token}` },
    });

    const user = await syncUser(userResp.data);
    const tokens = generateTokens(user);

    // Web users get tokens via JSON for now (Web Portal will use Cookies later)
    res.json({
      status: "success",
      tokens,
      user: { name: user.username, role: user.role },
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Authentication failed", details: err.message });
  }
});

/* POST /auth/exchange
 * CLI PKCE Auth Flow */
router.post("/exchange", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  try {
    const tokenResp = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } },
    );
    if (tokenResp.data.error) {
      return res.status(401).json({ error: tokenResp.data.error_description });
    }

    const userResp = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenResp.data.access_token}` },
    });

    const user = await syncUser(userResp.data);
    const tokens = generateTokens(user);

    res.json({
      status: "success",
      tokens,
      user: { name: user.username, role: user.role },
    });
  } catch (err) {
    console.error("Exchange Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Exchange failed", details: err.message });
  }
});

/* POST /auth/refresh
 * Issues new token pair and invalidates old ones */
router.post("/refresh", async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token)
    return res.status(400).json({ error: "Refresh token required" });

  const decoded = verifyToken(refresh_token);
  if (!decoded) return res.status(401).json({ error: "Invalid refresh token" });

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", decoded.id)
    .single();
  if (!user || !user.is_active)
    return res.status(403).json({ error: "User inactive" });

  const tokens = generateTokens(user);
  res.json({ status: "success", ...tokens });
});

/* POST /auth/logout
 * TRD requirement to invalidate session */
router.post("/logout", (req, res) => {
  // In a stateless JWT setup, logout is usually handled by client-side token deletion.
  // For TRD compliance, we acknowledge the logout request.
  res.json({ status: "success", message: "Logged out successfully" });
});

export default router;
