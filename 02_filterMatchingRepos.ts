import { readFileSync, writeFileSync } from "node:fs";
import { PotentialMatch, resultFilter } from "./src/resultFilter";

type SearchResult = {
  totalCount: number;
  matches: Array<PotentialMatch>;
};

function filterResults(inputFile: string) {
  try {
    const outputFile = `filtered_${inputFile}`;

    const rawData = readFileSync(inputFile, "utf8");
    const data: SearchResult = JSON.parse(rawData);

    const filteredMatches = data.matches.filter(resultFilter);
    filteredMatches.sort((a, b) => b.stars - a.stars);

    const filteredResult = {
      totalCount: filteredMatches.length,
      matches: filteredMatches,
    };

    writeFileSync(outputFile, JSON.stringify(filteredResult, null, 2));

    console.log(`Filtered results written to ${outputFile}`);
    console.log(`Found ${filteredMatches.length} matches.`);
  } catch (error) {
    console.error(`Error processing ${inputFile}:`, error);
  }
}

if (process.argv.length !== 3) {
  console.error("Usage: bun run 02_filterMatchingRepos.ts <input_file>");
  process.exit(1);
}

const inputFile = process.argv[2];

filterResults(inputFile);
