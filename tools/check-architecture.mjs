import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const sourceRoot = join(process.cwd(), 'src', 'app');
const requiredPublicApis = [
  'branch-management',
  'queue-management',
  'service-management',
  'segment-management',
  'organization',
  'display',
  'service-request',
];

const forbiddenImportFragments = [
  '/features/technical-admin/',
  '/features/branch-admins/',
  '/shared/components/technical-admin-',
];

const sourceFiles = [];

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      await collect(path);
      continue;
    }

    if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
      sourceFiles.push(path);
    }
  }
}

await collect(sourceRoot);

const violations = [];

for (const file of sourceFiles) {
  const source = await readFile(file, 'utf8');
  const importSpecifiers = [...source.matchAll(/(?:from|import\()\s*['"]([^'"]+)['"]/g)].map(
    (match) => match[1],
  );

  for (const specifier of importSpecifiers) {
    if (forbiddenImportFragments.some((fragment) => specifier.replaceAll('\\', '/').includes(fragment))) {
      violations.push(`${relative(process.cwd(), file)} imports ${specifier}`);
    }
  }
}

for (const feature of requiredPublicApis) {
  const path = join(sourceRoot, 'features', feature, 'public-api.ts');
  try {
    await readFile(path, 'utf8');
  } catch {
    violations.push(`Missing public API: ${relative(process.cwd(), path)}`);
  }
}

if (violations.length > 0) {
  console.error('Architecture check failed:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Architecture check passed for ${sourceFiles.length} source files.`);
}
