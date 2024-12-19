import { Octokit } from "@octokit/rest";
import * as fs from "fs";

const issueTitle = "transition from deprecated React Native APIs";
const issueDescription = "Transition from deprecated React Native APIs";

const [, , javaResultsPath, kotlinResultsPath] = process.argv;

if (!javaResultsPath || !kotlinResultsPath) {
  console.error(
    "Usage: bun run 03_openIssues.ts <java_results_file> <kotlin_results_file>",
  );
  process.exit(1);
}

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function checkIfIssueExists(
  owner: string,
  repo: string,
  title: string,
): Promise<boolean> {
  try {
    const { data: issues } = await octokit.issues.listForRepo({
      owner,
      repo,
      state: "all", // Check both open and closed issues
      per_page: 100,
    });

    return issues.some(
      (issue) => issue.title.toLowerCase() === title.toLowerCase(),
    );
  } catch (error) {
    console.error(`Error checking issues for ${owner}/${repo}:`, error);
    return true; // Return true to skip creating issue in case of error
  }
}

async function createIssue(owner: string, repo: string) {
  try {
    const issueExists = await checkIfIssueExists(owner, repo, issueTitle);

    if (!issueExists) {
      await octokit.issues.create({
        owner,
        repo,
        title: issueTitle,
        body: issueDescription,
      });
      console.log(`Created issue for ${owner}/${repo}`);
    } else {
      console.log(`Issue already exists for ${owner}/${repo}`);
    }
  } catch (error) {
    console.error(`Error creating issue for ${owner}/${repo}:`, error);
  }
}

async function processResults() {
  try {
    const javaResults = JSON.parse(fs.readFileSync(javaResultsPath, "utf8"));
    const kotlinResults = JSON.parse(
      fs.readFileSync(kotlinResultsPath, "utf8"),
    );

    const repositories = new Set([
      ...javaResults.matches.map((match: any) => match.repository),
      ...kotlinResults.matches.map((match: any) => match.repository),
    ]);

    for (const repository of repositories) {
      const [owner, repo] = repository.split("/");
      await createIssue(owner, repo);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error reading input files:", error.message);
    } else {
      console.error("An unknown error occurred");
    }
    process.exit(1);
  }
}

processResults().catch(console.error);
