// Supabase Edge Function: Proxy UIUC course XML and return JSON.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function extractTag(xmlText: string, tag: string) {
  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xmlText.match(pattern);
  if (!match) return "";
  return match[1].replace(/\s+/g, " ").trim();
}

function getPrerequisite(sectionInformation: string) {
  if (!sectionInformation) return "None specified";
  const match = sectionInformation.match(/Prerequisite:(.*?)[.]/i);
  return match ? match[1].trim() : sectionInformation;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let year = "2024";
    let semester = "fall";
    let department = "";
    let courseNumber = "";

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      year = String(body.year ?? year);
      semester = String(body.semester ?? semester).toLowerCase();
      department = String(body.department ?? "").toUpperCase();
      courseNumber = String(body.courseNumber ?? "");
    } else {
      const url = new URL(req.url);
      year = url.searchParams.get("year") ?? year;
      semester = (url.searchParams.get("semester") ?? semester).toLowerCase();
      department = (url.searchParams.get("department") ?? "").toUpperCase();
      courseNumber = url.searchParams.get("courseNumber") ?? "";
    }

    if (!department || !courseNumber) {
      return new Response(JSON.stringify({ error: "Missing department or courseNumber" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scheduleBase = "https://courses.illinois.edu/cisapp/explorer/schedule";
    const catalogBase = "https://courses.illinois.edu/cisapp/explorer/catalog";
    const scheduleUrl = `${scheduleBase}/${year}/${semester}/${department}/${courseNumber}.xml`;
    const catalogUrl = `${catalogBase}/${year}/${department}/${courseNumber}.xml`;

    const fetchXml = (url: string) =>
      fetch(url, {
        headers: {
          "User-Agent": "CoursePlanner/1.0",
          Accept: "application/xml, text/xml, */*",
        },
      });

    const scheduleResponse = await fetchXml(scheduleUrl);
    const scheduleText = scheduleResponse.ok ? await scheduleResponse.text() : null;

    let xmlText = scheduleText;
    if (!xmlText || !extractTag(xmlText, "creditHours")) {
      const catalogResponse = await fetchXml(catalogUrl);
      if (catalogResponse.ok) {
        xmlText = await catalogResponse.text();
      }
    }

    if (!xmlText) {
      return new Response(JSON.stringify({ error: "Course not found or API error" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const term = extractTag(xmlText, "term");
    const title = extractTag(xmlText, "label");
    const description = extractTag(xmlText, "description");
    const sectionInformation = extractTag(xmlText, "courseSectionInformation");
    const creditHours = extractTag(xmlText, "creditHours");
    const prerequisite = getPrerequisite(sectionInformation);

    return new Response(
      JSON.stringify({ term, title, description, prerequisite, creditHours }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
