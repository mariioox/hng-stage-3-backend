import express from "express";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { generateTokens } from "../auth.js"; // Importing the Chef

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

// This is the route GitHub hits after the user logs in
router.get("/callback", async (req, res) => {
  const { code } = req.query; // GitHub sends a temporary code

  if (!code) return res.status(400).json({ error: "No code provided" });

  try {
    // 1. Exchange code for an Access Token from GitHub
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      },
      { headers: { Accept: "application/json" } },
    );

    const githubToken = tokenResponse.data.access_token;

    // 2. Use GitHub Token to get User Info
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${githubToken}` },
    });

    const { id: githubId, email, name } = userResponse.data;

    // 3. Check if user exists in our DB, if not, create them
    let { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("github_id", githubId)
      .single();

    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert([{ github_id: githubId, email, name, role: "analyst" }])
        .select()
        .single();
      user = newUser;
    }

    // 4. Generate our OWN tokens (the ones we sign with JWT_SECRET)
    const { accessToken, refreshToken } = generateTokens(user);

    // 5. Send back to the user
    // For Stage 3 Web, we'll eventually put these in Cookies.
    // For now, let's just return them in JSON to verify it works.
    res.json({
      status: "success",
      tokens: { accessToken, refreshToken },
      user: { name: user.name, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Authentication failed" });
  }
});

export default router;
