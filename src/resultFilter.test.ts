import { expect, it, describe } from "bun:test";
import { resultFilter } from "./resultFilter";

describe("resultFilter", () => {
  const deprecatedEntry = {
    repository: "test/repo",
    file: "TestPackage.java",
    url: "https://github.com/test/repo",
    fileContent: `
      public class TestPackage extends TurboReactPackage {
        // 7 parameters are deprecated
        new ReactModuleInfo("test", true, true, false, false, false, false)
      }
    `,
    stars: 25,
    lastCommitDate: "2024-02-01T00:00:00Z",
  };

  describe("should accept", () => {
    it("valid Java matches", () => {
      expect(resultFilter(deprecatedEntry)).toBe(true);
    });

    it("valid Kotlin matches", () => {
      const kotlinMatch = {
        ...deprecatedEntry,
        file: "TestPackage.kt",
        fileContent: "class TestPackage : TurboReactPackage()",
      };
      expect(resultFilter(kotlinMatch)).toBe(true);
    });

    it("file with 7 parameters", () => {
      const noDeprecatedPatternMatch = {
        ...deprecatedEntry,
        fileContent: `new ReactModuleInfo("test", true, true, false, false, false, false)`,
      };
      expect(resultFilter(noDeprecatedPatternMatch)).toBe(true);
    });
  });

  describe("should reject", () => {
    it("repositories with too few stars", () => {
      const lowStarsMatch = {
        ...deprecatedEntry,
        stars: 15,
      };
      expect(resultFilter(lowStarsMatch)).toBe(false);
    });

    it("expo repository", () => {
      const expoMatch = {
        ...deprecatedEntry,
        repository: "expo/expo",
      };
      expect(resultFilter(expoMatch)).toBe(false);
    });

    it("Facebook copyright (most likely RN fork)", () => {
      const facebookMatch = {
        ...deprecatedEntry,
        fileContent: "Copyright (c) Facebook\n" + deprecatedEntry.fileContent,
      };
      expect(resultFilter(facebookMatch)).toBe(false);
    });

    it("Meta copyright (most likely RN fork)", () => {
      const metaMatch = {
        ...deprecatedEntry,
        fileContent:
          "Copyright (c) Meta Platforms\n" + deprecatedEntry.fileContent,
      };
      expect(resultFilter(metaMatch)).toBe(false);
    });

    it("abandoned repositories", () => {
      const oldCommitMatch = {
        ...deprecatedEntry,
        lastCommitDate: "2023-12-31T00:00:00Z",
      };
      expect(resultFilter(oldCommitMatch)).toBe(false);
    });

    it("unrelated files", () => {
      const noDeprecatedPatternMatch = {
        ...deprecatedEntry,
        fileContent: "class TestPackage { }",
      };
      expect(resultFilter(noDeprecatedPatternMatch)).toBe(false);
    });

    it("files without deprecated patterns", () => {
      const noDeprecatedPatternMatch = {
        ...deprecatedEntry,
        fileContent: `public class TestPackage extends BaseReactPackage {
        // 6 parameters are not deprecated
        new ReactModuleInfo("test", true, true, false, false, false)
      }`,
      };
      expect(resultFilter(noDeprecatedPatternMatch)).toBe(false);
    });
  });
});
