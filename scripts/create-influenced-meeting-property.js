#!/usr/bin/env node
/**
 * Create "Influenced Meeting" custom property on all engagement/activity object types.
 * Use this to tag calls, emails, LinkedIn messages, etc. that influenced pipeline,
 * then report on which activities to which people at what time are most effective.
 *
 * Usage:  node scripts/create-influenced-meeting-property.js
 * Requires: .env with HUBSPOT_ACCESS_TOKEN (scopes: crm.schemas.*.write for each object type)
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const TOKEN = fs
  .readFileSync(path.join(__dirname, "..", ".env"), "utf8")
  .match(/HUBSPOT_ACCESS_TOKEN=(.+)/)[1]
  .trim();

const ENGAGEMENT_OBJECT_TYPES = [
  "calls",
  "emails",
  "meetings",
  "notes",
  "tasks",
  "communications",
];

function propertyBody(groupName) {
  return {
    name: "influenced_meeting",
    label: "Influenced Meeting",
    type: "bool",
    fieldType: "booleancheckbox",
    groupName,
    options: [
      { value: "true", label: "Yes" },
      { value: "false", label: "No" },
    ],
    description: "Whether this activity influenced a meeting or pipeline. Use for analyzing which activities to which contacts are most effective.",
  };
}

const OBJECT_GROUPS = {
  calls: "engagement",
  emails: "engagement",
  meetings: "engagement",
  notes: "engagement",
  tasks: "engagement",
  communications: "communicationinformation",
};

function hubspot(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "api.hubapi.com",
      path: urlPath,
      method,
      headers: {
        Authorization: "Bearer " + TOKEN,
        "Content-Type": "application/json",
      },
    };
    const req = https.request(opts, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(d ? JSON.parse(d) : {});
        } else {
          reject(new Error(`${res.statusCode}: ${d.substring(0, 400)}`));
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log("\nCreating 'Influenced Meeting' property on engagement objects...\n");

  for (const objectType of ENGAGEMENT_OBJECT_TYPES) {
    const groupName = OBJECT_GROUPS[objectType] || "engagement";
    try {
      await hubspot("POST", `/crm/v3/properties/${objectType}`, propertyBody(groupName));
      console.log(`  ✅ ${objectType}`);
    } catch (e) {
      if (e.message.includes("409") || e.message.includes("already exists")) {
        console.log(`  ⏭️  ${objectType} (property already exists)`);
      } else {
        console.log(`  ❌ ${objectType}: ${e.message}`);
      }
    }
  }

  console.log("\nDone. In HubSpot: edit activities (calls, emails, etc.) and set 'Influenced Meeting' to analyze impact.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
