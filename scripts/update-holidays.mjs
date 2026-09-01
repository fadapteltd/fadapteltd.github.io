import { writeFile } from "node:fs/promises";

const DATASET_ID = "d_8ef23381f9417e4d4254ee8b4dcdb176";
const DATASET_URL = `https://data.gov.sg/api/action/datastore_search?resource_id=${DATASET_ID}&limit=500`;
const DATASET_PAGE = `https://data.gov.sg/datasets/${DATASET_ID}/view`;
const OUTPUT_FILE = new URL("../data/sg-public-holidays.json", import.meta.url);

const response = await fetch(DATASET_URL);
if (!response.ok) {
	throw new Error(`data.gov.sg returned HTTP ${response.status}.`);
}

const payload = await response.json();
const records = payload?.result?.records;
if (!payload?.success || !Array.isArray(records)) {
	throw new Error("data.gov.sg returned an unexpected response.");
}

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const holidays = records
	.map((record) => ({
		date: String(record?.date || "").trim(),
		holiday: String(record?.holiday || "").trim(),
	}))
	.filter(
		(record) => isoDatePattern.test(record.date) && Boolean(record.holiday),
	)
	.sort((left, right) => left.date.localeCompare(right.date));

if (holidays.length === 0) {
	throw new Error("No valid public holiday records were returned.");
}

const uniqueDates = new Set(holidays.map((record) => record.date));
if (uniqueDates.size !== holidays.length) {
	throw new Error("The dataset contains duplicate holiday dates.");
}

const supportedYears = [
	...new Set(holidays.map((record) => Number(record.date.slice(0, 4)))),
].sort((left, right) => left - right);

const output = {
	source: "Singapore Ministry of Manpower via data.gov.sg",
	sourceUrl: DATASET_PAGE,
	retrievedAt: new Date().toISOString().slice(0, 10),
	supportedYears,
	holidays,
};

await writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(
	`Updated ${holidays.length} official holiday records for ${supportedYears[0]}–${supportedYears.at(-1)}.`,
);
