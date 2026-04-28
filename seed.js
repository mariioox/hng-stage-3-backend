import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { v7 as uuidv7 } from "uuid";
import "dotenv/config";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

async function seed() {
  try {
    const rawData = fs.readFileSync("./seed_profiles.json");
    const { profiles } = JSON.parse(rawData);

    console.log(`🚀 Preparing to seed ${profiles.length} profiles...`);

    const cleanProfiles = profiles.map((profile) => ({
      // Generate valid ID
      id: uuidv7(),

      // Map existing data
      name: profile.name,
      gender: profile.gender,
      gender_probability: profile.gender_probability || 0,

      sample_size: profile.sample_size ?? 0,

      age: profile.age,
      age_group: profile.age_group,
      country_id: profile.country_id,
      country_name: profile.country_name,
      country_probability: profile.country_probability || 0,
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("profiles")
      .upsert(cleanProfiles, { onConflict: "name" });

    if (error) throw error;

    console.log("✅ Database seeded successfully with 2026 profiles!");
  } catch (err) {
    console.error("❌ Seed Error Details:", err);
  }
}

seed();
