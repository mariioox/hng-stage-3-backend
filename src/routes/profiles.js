import express from "express";
import { createClient } from "@supabase/supabase-js";
import { validate as isUuid } from "uuid";
import { Parser } from "json2csv";
import { parseQuery } from "../../parser.js";
import { authenticate, authorize } from "../middleware.js";

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

/*  Middleware: Check for X-API-Version header  */
router.use((req, res, next) => {
  if (req.headers["x-api-version"] !== "1") {
    return res.status(400).json({
      status: "error",
      message: "API version header required",
    });
  }
  next();
});

/*  Helper: Reusable Database Logic with Pagination  */
async function getProfiles(filters, pagination) {
  const { gender, age_group, country_id, min_age, max_age } = filters;
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

  const { data, count, error } = await query
    .order(sort_by, { ascending: order === "asc" })
    .range(from, to);

  return { data, count, error, p, l };
}

/*  Helper: Build Pagination Links  */
const buildLinks = (req, page, limit, totalCount) => {
  const totalPages = Math.ceil(totalCount / limit);
  const url = `${req.baseUrl}${req.path}`;

  const getUrl = (p) => {
    if (p < 1 || p > totalPages) return null;
    const params = new URLSearchParams(req.query);
    params.set("page", p);
    params.set("limit", limit);
    return `${url}?${params.toString()}`;
  };

  return {
    self: getUrl(page),
    next: getUrl(page + 1),
    prev: getUrl(page - 1),
    total_pages: totalPages,
  };
};

/*  GET /api/v1/profiles - List profiles  */
router.get("/", authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await getProfiles(req.query, {
      page,
      limit,
      sort_by: req.query.sort_by || "created_at",
      order: req.query.order || "desc",
    });

    const linksInfo = buildLinks(req, page, limit, result.count);

    return res.status(200).json({
      status: "success",
      page: result.p,
      limit: result.l,
      total: result.count || 0,
      total_pages: linksInfo.total_pages,
      links: {
        self: linksInfo.self,
        next: linksInfo.next,
        prev: linksInfo.prev,
      },
      data: result.data || [],
    });
  } catch (err) {
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});

/*  GET /api/v1/profiles/export - Admin only CSV export  */
router.get("/export", authenticate, authorize(["admin"]), async (req, res) => {
  if (req.query.format !== "csv") {
    return res.status(400).json({
      status: "error",
      message: "Invalid format. Only CSV is supported.",
    });
  }

  try {
    // Fetch data without pagination limit for export
    const result = await getProfiles(req.query, {
      page: 1,
      limit: 1000,
      sort_by: "created_at",
      order: "desc",
    });

    const fields = [
      "id",
      "name",
      "gender",
      "gender_probability",
      "age",
      "age_group",
      "country_id",
      "country_name",
      "country_probability",
      "created_at",
    ];
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(result.data);

    res.header("Content-Type", "text/csv");
    res.attachment(`profiles_${Date.now()}.csv`);
    return res.status(200).send(csv);
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});

/*  GET /api/v1/profiles/search - Natural Language Search  */
router.get("/search", authenticate, async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;
  if (!q)
    return res
      .status(400)
      .json({ status: "error", message: "Missing search query" });

  const filters = parseQuery(q);
  if (!filters)
    return res.status(400).json({
      status: "error",
      message: "Unable to interpret natural language query",
    });

  const result = await getProfiles(filters, {
    page: parseInt(page),
    limit: parseInt(limit),
    sort_by: "created_at",
    order: "desc",
  });

  const linksInfo = buildLinks(
    req,
    parseInt(page),
    parseInt(limit),
    result.count,
  );

  return res.status(200).json({
    status: "success",
    page: result.p,
    limit: result.l,
    total: result.count || 0,
    total_pages: linksInfo.total_pages,
    links: {
      self: linksInfo.self,
      next: linksInfo.next,
      prev: linksInfo.prev,
    },
    data: result.data || [],
  });
});

/*  GET /api/v1/profiles/:id - Detail view  */
router.get("/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id))
    return res
      .status(400)
      .json({ status: "error", message: "Invalid UUID format" });

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data)
    return res
      .status(404)
      .json({ status: "error", message: "Profile not found" });

  return res.status(200).json({ status: "success", data });
});

export default router;
