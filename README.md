# GitHub Repository Issue Creator

A tool to automatically create issues across multiple GitHub repositories based on code search query.

The initial motivation is to warn of these deprecated usages (GH markdown doesn't render this properly so links are in code blocks):

- `https://github.com/search?q=%2Fnew+ReactModuleInfo%5C(%5B%5E%2C)%5D*(%3F%3A%2C%5B%5E%2C)%5D*)%7B6%7D%5C)%2F++NOT+is%3Afork+language%3AJava&type=code`
- `https://github.com/search?q=%2FReactModuleInfo%5C(%5B%5E%2C)%5D*(%3F%3A%2C%5B%5E%2C)%5D*)%7B6%7D%5C)%2F++NOT+is%3Afork+language%3AKotlin++&type=code`

## Prerequisites

- [Bun](https://bun.sh) installed
- [generate here](https://github.com/settings/tokens/new?description=deprecated_rn_script&scopes=public_repo) GitHub Personal Access Token

## Setup

1. Clone the repository
2. Provide your env with `GITHUB_TOKEN`:

```bash
GITHUB_TOKEN=your_token_here
```

## Usage

The process involves 3 steps:

1. Find potentially matching repositories:

```bash
bun run 01_fetchApproximatelyMatchingRepos.ts
```

This creates a JSON file with initial repository approximate matches.

2. Filter the matches to find exact matches:

```bash
bun run 02_filterMatchingRepos.ts java_results_2024-12-19T09\:03\:43.483Z.json
```

This creates a filtered results file (e.g., `filtered_java_results_2024-12-19T09:03:43.483Z.json`) containing only repositories that meet specific criteria.

3. Create issues in the matching repositories:

```bash
bun 03_openIssues.ts filtered_java_results_2024-12-19T09\:03\:43.483Z.json filtered_kotlin_results_2024-12-19T08\:54\:08.350Z.json
```

This will create issues in all repositories from your filtered results file.

## Configuration

- Edit search criteria in `01_fetchApproximatelyMatchingRepos.ts`
- Modify filtering logic in `02_filterMatchingRepos.ts`
- Configure issue title and content in `03_openIssues.ts`

## Note

Make sure to review the filtered results before creating issues to ensure they match your intended criteria.
