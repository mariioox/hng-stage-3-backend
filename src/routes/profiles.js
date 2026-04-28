import express from "express";
import { createClient } from "@supabase/supabase-js";
import { validate as isUuid } from "uuid";
import { parseQuery } from "../../parser.js"; // Note the path change

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

// Reusable Database Logic
async function getProfiles(filters, pagination) {
  const {
    gender,
    age_group,
    country_id,
    min_age,
    max_age,
    min_gender_probability,
    min_country_probability,
  } = filters;
  const { page, limit, sort_by, order } = pagination;

  const p = Math.max(1, parseInt(page));
  const l = Math.min(50, Math.max(1, parseInt(limit)));
  const from = (p - 1) * l;
  const to = from + l - 1;

  let query = supabase.from("profiles").select("*", { count: "exact" });

  if (gender) query = query.eq("gender", gender.toLowerCase());
  if (age_group) query = query.eq("age_group", age_group.toLowerCase());
  if (country_id) query = query.eq("country_id", country_id.toUpperCase());
  if (min_age) query = query.gte("age", parseInt(min_age));
  if (max_age) query = query.lte("age", parseInt(max_age));
  if (min_gender_probability)
    query = query.gte("gender_probability", parseFloat(min_gender_probability));
  if (min_country_probability)
    query = query.gte(
      "country_probability",
      parseFloat(min_country_probability),
    );

  const { data, count, error } = await query
    .order(sort_by, { ascending: order === "asc" })
    .range(from, to);

  return { data, count, error, p, l };
}

// Route for / (which will be /api/profiles or /api/v1/profiles)
router.get("/", async (req, res) => {
  try {
    const result = await getProfiles(req.query, {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      sort_by: req.query.sort_by || "created_at",
      order: req.query.order || "desc",
    });
    return res
      .status(200)
      .json({
        status: "success",
        page: result.p,
        limit: result.l,
        total: result.count || 0,
        data: result.data || [],
      });
  } catch (err) {
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});

// Route for /search
router.get("/search", async (req, res) => {
  const { q, page, limit, sort_by, order } = req.query;
  if (!q)
    return res
      .status(400)
      .json({ status: "error", message: "Missing parameter" });
  const filters = parseQuery(q);
  if (!filters)
    return res
      .status(400)
      .json({ status: "error", message: "Unable to interpret query" });

  const result = await getProfiles(filters, {
    page: page || 1,
    limit: limit || 10,
    sort_by: sort_by || "created_at",
    order: order || "desc",
  });
  return res
    .status(200)
    .json({
      status: "success",
      page: result.p,
      limit: result.l,
      total: result.count || 0,
      data: result.data || [],
    });
});

// Route for /:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id))
    return res.status(400).json({ status: "error", message: "Invalid ID" });
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data)
    return res.status(404).json({ status: "error", message: "Not found" });
  return res.status(200).json({ status: "success", data });
});

export default router;
