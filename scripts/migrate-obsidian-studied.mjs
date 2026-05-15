import fs from "node:fs/promises";
import path from "node:path";

const vaultRoot = "/Users/jeonghoon/Documents/Obsidian";
const sourceDir = path.join(vaultRoot, "Studied");
const resourceDirs = [
  path.join(vaultRoot, "Resources", "Attachments"),
  path.join(vaultRoot, "Resources", "Background"),
];
const outputRoot = path.resolve("obsidian-raw");
const outputPageRoot = path.join(outputRoot, "page", "Studied");
const outputImageRoot = path.join(outputRoot, "assets", "images");

const imageExts = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);

const normalize = value => value.normalize("NFC");

const quoteYaml = value =>
  JSON.stringify(String(value ?? "").normalize("NFC"));

const sanitizePathPart = value => {
  const cleaned = normalize(value)
    .replace(/[/:\\]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "Untitled";
};

const sanitizeAssetBase = value => {
  const cleaned = normalize(value)
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return cleaned || "image";
};

const toAstroDate = value => {
  const trimmed = String(value ?? "").trim();
  const match = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})[ T]+(\d{2}:\d{2})(?::(\d{2}))?/
  );

  if (match) {
    return `${match[1]}T${match[2]}:${match[3] ?? "00"}+09:00`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T00:00:00+09:00`;
  }

  return trimmed;
};

const parseFrontmatter = content => {
  if (!content.startsWith("---\n")) {
    return { data: {}, body: content };
  }

  const end = content.indexOf("\n---", 4);
  if (end === -1) {
    return { data: {}, body: content };
  }

  const raw = content.slice(4, end).trimEnd();
  const bodyStart = content.indexOf("\n", end + 1);
  const body = bodyStart === -1 ? "" : content.slice(bodyStart + 1);
  const data = {};

  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([^:#]+):\s*(.*)$/);
    if (!match) continue;
    data[match[1].trim()] = match[2].trim();
  }

  return { data, body };
};

const parseTags = value => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map(tag => tag.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }

  return [trimmed.replace(/^["']|["']$/g, "")].filter(Boolean);
};

const titleFromFilename = filename => {
  const basename = path.basename(filename, ".md");
  return sanitizePathPart(basename.replace(/^\([^)]+\)\s*/, ""));
};

const subjectFrom = (frontmatter, filename) => {
  if (frontmatter["주제"]) {
    return sanitizePathPart(frontmatter["주제"]);
  }

  const basename = path.basename(filename, ".md");
  const match = basename.match(/^\(([^)]+)\)/);
  return sanitizePathPart(match?.[1] ?? "General");
};

const excerptFrom = body => {
  let inFence = false;

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (/^(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence || !line) continue;
    if (line.startsWith("#") || line === "---") continue;
    if (line.startsWith("<")) continue;
    if (/^!\[\[.*\]\]$/.test(line) || /^!\[.*\]\(.*\)$/.test(line)) continue;

    return line
      .replace(/!\[\[[^\]]+\]\]/g, "")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
      .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[`*_>#-]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180);
  }

  return "";
};

const walkFiles = async dir => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
};

const buildResourceIndex = async () => {
  const index = new Map();

  for (const dir of resourceDirs) {
    const files = await walkFiles(dir);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!imageExts.has(ext)) continue;

      const basename = normalize(path.basename(file));
      if (!index.has(basename)) {
        index.set(basename, file);
      }
    }
  }

  return index;
};

const makeAssetCopier = () => {
  const copiedBySource = new Map();
  const usedNames = new Map();
  const copied = [];

  const copyAsset = async sourcePath => {
    if (copiedBySource.has(sourcePath)) {
      return copiedBySource.get(sourcePath);
    }

    const copyPromise = (async () => {
      const parsed = path.parse(sourcePath);
      const ext = parsed.ext.toLowerCase();
      const base = sanitizeAssetBase(parsed.name);
      let filename = `${base}${ext}`;
      let suffix = 2;

      while (usedNames.has(filename) && usedNames.get(filename) !== sourcePath) {
        filename = `${base}-${suffix}${ext}`;
        suffix += 1;
      }

      usedNames.set(filename, sourcePath);
      await fs.mkdir(outputImageRoot, { recursive: true });
      await fs.copyFile(sourcePath, path.join(outputImageRoot, filename));

      copied.push({ source: sourcePath, output: filename });
      return filename;
    })();

    copiedBySource.set(sourcePath, copyPromise);
    return copyPromise;
  };

  return { copyAsset, copied };
};

const resolveResource = (resourceIndex, target) => {
  const normalizedTarget = normalize(target.trim());
  return (
    resourceIndex.get(normalizedTarget) ??
    resourceIndex.get(normalize(path.basename(normalizedTarget)))
  );
};

const isInsideInlineCode = (line, index) => {
  const before = line.slice(0, index);
  return (before.match(/`/g)?.length ?? 0) % 2 === 1;
};

const replaceOutsideCode = (line, regex, replacer) =>
  line.replace(regex, (...args) => {
    const match = args[0];
    const offset = args.at(-2);
    if (isInsideInlineCode(line, offset)) return match;
    return replacer(...args);
  });

const convertObsidianAdmonitions = body => {
  const lines = body.split(/\r?\n/);
  const output = [];
  let admonition = null;

  for (const line of lines) {
    const start = line.match(/^```ad-([^\s`]+)\s*$/);
    if (!admonition && start) {
      admonition = { type: start[1], lines: [], rawStart: line };
      continue;
    }

    if (admonition) {
      if (/^```\s*$/.test(line)) {
        const content = [...admonition.lines];
        const titleLine = content[0]?.match(/^title:\s*(.+)\s*$/);
        const title = titleLine?.[1]?.trim() || admonition.type;
        const bodyLines = titleLine ? content.slice(1) : content;

        output.push(`> **${title}**`);
        output.push(">");
        for (const bodyLine of bodyLines) {
          output.push(bodyLine ? `> ${bodyLine}` : ">");
        }
        admonition = null;
        continue;
      }

      admonition.lines.push(line);
      continue;
    }

    output.push(line);
  }

  if (admonition) {
    output.push(admonition.rawStart, ...admonition.lines);
  }

  return output.join("\n");
};

const convertBody = async (body, resourceIndex, copyAsset, report) => {
  body = convertObsidianAdmonitions(body);

  const pendingCopies = [];
  let inFence = false;

  const lines = body.split(/\r?\n/).map(line => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;

    let converted = replaceOutsideCode(
      line,
      /!\[\[([^\]]+)\]\]/g,
      (match, inner) => {
        const [rawTarget] = inner.split("|");
        const target = normalize(rawTarget.trim());
        const ext = path.extname(target).toLowerCase();
        const sourcePath = resolveResource(resourceIndex, target);

        if (!sourcePath || !imageExts.has(ext)) {
          report.unresolvedEmbeds.add(target);
          return match;
        }

        const promise = copyAsset(sourcePath).then(filename => {
          const alt = path.basename(target, ext);
          return { placeholder, value: `![${alt}](@/assets/images/${filename})` };
        });
        const placeholder = `__OBSIDIAN_IMAGE_${pendingCopies.length}__`;
        pendingCopies.push(promise);
        report.convertedImageRefs += 1;
        return placeholder;
      }
    );

    converted = replaceOutsideCode(
      converted,
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      (match, alt, rawTarget) => {
        const target = decodeURIComponent(rawTarget.trim()).replace(/^<|>$/g, "");
        if (/^(https?:|data:|@\/)/.test(target)) return match;

        const basename = normalize(path.basename(target));
        const ext = path.extname(basename).toLowerCase();
        const sourcePath = resolveResource(resourceIndex, target);

        if (!sourcePath || !imageExts.has(ext)) {
          report.unresolvedImages.add(target);
          return match;
        }

        const placeholder = `__OBSIDIAN_IMAGE_${pendingCopies.length}__`;
        const promise = copyAsset(sourcePath).then(filename => ({
          placeholder,
          value: `![${alt || path.basename(basename, ext)}](@/assets/images/${filename})`,
        }));
        pendingCopies.push(promise);
        report.convertedImageRefs += 1;
        return placeholder;
      }
    );

    return converted;
  });

  let convertedBody = lines.join("\n");
  const replacements = await Promise.all(pendingCopies);

  for (const { placeholder, value } of replacements) {
    convertedBody = convertedBody.replaceAll(placeholder, value);
  }

  return convertedBody;
};

const migrate = async () => {
  const resourceIndex = await buildResourceIndex();
  const { copyAsset, copied } = makeAssetCopier();
  const sourceFiles = (await walkFiles(sourceDir))
    .filter(file => path.extname(file) === ".md")
    .sort((a, b) => a.localeCompare(b));
  const outputPaths = new Set();
  const report = {
    sourceFiles: sourceFiles.length,
    migratedFiles: 0,
    convertedImageRefs: 0,
    copiedImages: copied,
    unresolvedImages: new Set(),
    unresolvedEmbeds: new Set(),
    bannerImages: [],
  };

  await fs.mkdir(outputPageRoot, { recursive: true });
  await fs.mkdir(outputImageRoot, { recursive: true });

  for (const sourceFile of sourceFiles) {
    const raw = await fs.readFile(sourceFile, "utf8");
    const { data, body } = parseFrontmatter(raw);
    const subject = subjectFrom(data, sourceFile);
    const title = titleFromFilename(sourceFile);
    const tags = Array.from(new Set(["일반", subject, ...parseTags(data.tags)]));
    const pubDatetime = toAstroDate(data.date);
    const modDatetime = toAstroDate(data.updated);
    const description = excerptFrom(body);
    const frontmatter = [
      "---",
      `title: ${quoteYaml(title)}`,
      `pubDatetime: ${quoteYaml(pubDatetime)}`,
      modDatetime ? `modDatetime: ${quoteYaml(modDatetime)}` : null,
      `description: ${quoteYaml(description)}`,
      "tags:",
      ...tags.map(tag => `  - ${quoteYaml(tag)}`),
    ].filter(Boolean);

    const bannerMatch = String(data.banner ?? "").match(/!\[\[([^\]]+)\]\]/);
    if (bannerMatch) {
      const bannerName = normalize(bannerMatch[1].split("|")[0].trim());
      const bannerSource = resolveResource(resourceIndex, bannerName);
      if (bannerSource) {
        const bannerFilename = await copyAsset(bannerSource);
        frontmatter.push(`banner: ${quoteYaml(`@/assets/images/${bannerFilename}`)}`);
        report.bannerImages.push({ source: bannerName, output: bannerFilename });
      } else {
        report.unresolvedImages.add(bannerName);
      }
    }

    frontmatter.push("---");

    const convertedBody = await convertBody(body, resourceIndex, copyAsset, report);
    const subjectDir = path.join(outputPageRoot, sanitizePathPart(subject));
    await fs.mkdir(subjectDir, { recursive: true });

    let outputName = `${sanitizePathPart(title)}.md`;
    let outputPath = path.join(subjectDir, outputName);
    let suffix = 2;

    while (outputPaths.has(outputPath)) {
      outputName = `${sanitizePathPart(title)}-${suffix}.md`;
      outputPath = path.join(subjectDir, outputName);
      suffix += 1;
    }

    outputPaths.add(outputPath);
    await fs.writeFile(
      outputPath,
      `${frontmatter.join("\n")}\n\n${convertedBody.trimStart()}`,
      "utf8"
    );
    report.migratedFiles += 1;
  }

  const reportForJson = {
    ...report,
    copiedImages: copied,
    unresolvedImages: Array.from(report.unresolvedImages).sort(),
    unresolvedEmbeds: Array.from(report.unresolvedEmbeds).sort(),
  };

  await fs.writeFile(
    path.join(outputRoot, "migration-report.json"),
    `${JSON.stringify(reportForJson, null, 2)}\n`,
    "utf8"
  );

  console.log(JSON.stringify(reportForJson, null, 2));
};

migrate().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
