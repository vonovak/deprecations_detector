import { Octokit } from "@octokit/rest";
import { writeFileSync } from "node:fs";

// github code search does not support Regular Expressions, so we need to search approximately first
const searches = [
  {
    query: "new ReactModuleInfo language:Java NOT is:fork",
    outputFile: `java_results_${new Date().toISOString()}.json`,
  },
  {
    query: "ReactModuleInfo( NOT is:fork language:Kotlin",
    outputFile: `kotlin_results_${new Date().toISOString()}.json`,
  },
];

const RESULTS_PER_PAGE = 100;

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function searchGitHubCode() {
  for (const search of searches) {
    const searchResult = {
      query: search.query,
      totalCount: 0,
      matches: [] as Array<{
        repository: string;
        file: string;
        url: string;
        fileContent: string;
        stars: number;
        lastCommitDate: string;
      }>,
    };

    try {
      let page = 1;
      let hasMorePages = true;
      let totalResults = 0;
      let collectedResults = 0;

      while (hasMorePages) {
        // https://docs.github.com/en/rest/search/search?apiVersion=2022-11-28#search-code
        const response = await octokit.rest.search.code({
          q: `${search.query} sort:stars-desc`,
          per_page: RESULTS_PER_PAGE,
          page: page,
        });

        if (page === 1) {
          totalResults = response.data.total_count;
          searchResult.totalCount = totalResults;
          console.log(`totalResults: ${totalResults}`);
        }

        console.log(
          `processing ${response.data.items.length} items on page ${page}.\ncollectedResults: ${collectedResults}. Please wait...`,
        );
        // Process items sequentially to avoid rate limiting issues
        for (const item of response.data.items) {
          const [owner, repo] = item.repository.full_name.split("/");

          const { content, stars, lastCommitDate } = await getFileMetadata(
            owner,
            repo,
            item.path,
          );

          searchResult.matches.push({
            repository: item.repository.full_name,
            file: item.path,
            url: item.html_url,
            fileContent: content,
            stars,
            lastCommitDate,
          });

          // Add a small delay between requests to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        writeFileSync(search.outputFile, JSON.stringify(searchResult, null, 2));

        collectedResults += response.data.items.length;
        hasMorePages = collectedResults < totalResults;

        page++;
      }

      writeFileSync(search.outputFile, JSON.stringify(searchResult, null, 2));
      console.log(`Complete results written to ${search.outputFile}`);
    } catch (error: any) {
      console.error(`Error with search "${search.query}":`);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(error.response.data);
      } else {
        console.error(error);
      }
      if (searchResult.matches.length > 0) {
        writeFileSync(search.outputFile, JSON.stringify(searchResult, null, 2));
        console.log(`Partial results written to ${search.outputFile}`);
      }
    }
  }
}

async function getFileMetadata(
  owner: string,
  repo: string,
  path: string,
): Promise<{ content: string; stars: number; lastCommitDate: string }> {
  try {
    const query = `
    query getFileAndStars($owner: String!, $repo: String!, $path: String!) {
        repository(owner: $owner, name: $repo) {
          stargazerCount
          object(expression: $path) {
            ... on Blob {
              text
            }
          }
          defaultBranchRef {
            target {
              ... on Commit {
                committedDate
              }
            }
          }
        }
      }
    `;

    const response: any = await octokit.graphql(query, {
      owner,
      repo,
      path: `HEAD:${path}`,
    });

    const result = {
      content: response.repository.object?.text ?? "",
      stars: response.repository.stargazerCount,
      lastCommitDate:
        response.repository.defaultBranchRef?.target?.committedDate ?? "",
    };
    return result;
  } catch (error) {
    console.error(
      `Failed to fetch content for ${owner}/${repo}/${path}: ${error}`,
    );
    return { content: "", stars: 0, lastCommitDate: "" };
  }
}

searchGitHubCode().catch(console.error);
