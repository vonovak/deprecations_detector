export type PotentialMatch = {
  repository: string;
  file: string;
  url: string;
  fileContent: string;
  stars: number;
  lastCommitDate: string;
};

const MIN_STARS_THRESHOLD = 20;
const deprecatedReactModuleInfoConstructor =
  /ReactModuleInfo\([^,)]*(?:,[^,)]*){6}\)/;
const regexDeprecatedTurboReactPackageJava = /extends TurboReactPackage/;
const regexDeprecatedTurboReactPackageKotlin = /: TurboReactPackage/;

export function resultFilter(match: PotentialMatch): boolean {
  // Filter the matches based on various criteria
  const language = match.file.endsWith("java") ? "java" : "kotlin";
  const baseClassRegex =
    language === "java"
      ? regexDeprecatedTurboReactPackageJava
      : regexDeprecatedTurboReactPackageKotlin;
  const lastCommitDate = new Date(match.lastCommitDate);
  return (
    match.stars >= MIN_STARS_THRESHOLD &&
    match.repository !== "expo/expo" &&
    !match.fileContent.includes("Copyright (c) Facebook") &&
    !match.fileContent.includes("Copyright (c) Meta Platforms") &&
    lastCommitDate.getTime() > new Date("2024-01-01").getTime() &&
    (deprecatedReactModuleInfoConstructor.test(match.fileContent) ||
      baseClassRegex.test(match.fileContent))
  );
}
