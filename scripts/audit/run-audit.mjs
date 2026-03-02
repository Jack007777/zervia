import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const date = new Date();
const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
const outputPath = path.join(root, 'docs', 'audit', `run-${ymd}.md`);
const baseUrl = process.env.AUDIT_BASE_URL || 'https://zervia.eu';

function safeExec(command, cwd = root) {
  try {
    const out = execSync(command, { cwd, stdio: 'pipe' }).toString().trim();
    return { ok: true, out };
  } catch (error) {
    return { ok: false, out: String(error?.stdout || error?.message || error) };
  }
}

async function collectRoutes(dir, prefix = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const routes = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('_')) continue;
      const nextPrefix = entry.name === 'app' ? '' : `${prefix}/${entry.name}`;
      routes.push(...(await collectRoutes(full, nextPrefix)));
      continue;
    }

    if (!entry.isFile()) continue;
    if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
      const route = prefix || '/';
      routes.push(route.replace(/\\/g, '/'));
    }
  }

  return routes;
}

async function checkLinks(routes) {
  const sample = routes
    .filter((r) => !r.includes('['))
    .map((r) => (r === '/' ? '' : r))
    .slice(0, 20);

  const result = [];

  for (const route of sample) {
    const url = `${baseUrl}${route}`;
    try {
      const response = await fetch(url, { redirect: 'follow' });
      result.push({ url, status: response.status, ok: response.ok });
    } catch (error) {
      result.push({ url, status: 0, ok: false, err: String(error) });
    }
  }

  return result;
}

async function formChecks() {
  const home = await fs.readFile(path.join(root, 'apps', 'web', 'app', '[locale]', 'page.tsx'), 'utf8');
  const login = await fs.readFile(path.join(root, 'apps', 'web', 'app', '[locale]', 'auth', 'login', 'page.tsx'), 'utf8');

  return {
    homeHasSearchAction: home.includes('ctaSearch') || home.includes('Jetzt suchen') || home.includes('Search now'),
    homeHasLocationError: home.includes('locationError'),
    loginHasForm: login.includes('<form'),
    loginHasSubmit: login.includes('type="submit"'),
    loginHasErrorUi: login.includes('form.formState.errors') || login.includes('mutation.error')
  };
}

async function routeSwitchChecks() {
  const languageSwitcher = await fs.readFile(path.join(root, 'apps', 'web', 'src', 'components', 'LanguageSwitcher.tsx'), 'utf8');
  const countrySwitcher = await fs.readFile(path.join(root, 'apps', 'web', 'src', 'components', 'CountrySwitcher.tsx'), 'utf8');

  return {
    languagePreservesQuery: languageSwitcher.includes('useSearchParams') && languageSwitcher.includes('querySuffix'),
    countryPreservesQuery: countrySwitcher.includes('new URLSearchParams(query.toString())')
  };
}

async function staticAssetChecks() {
  const mustHave = ['manifest.json', 'sw.js', 'icon-192.png', 'icon-512.png', 'zervia-logo.svg'];
  const checks = [];

  for (const file of mustHave) {
    const full = path.join(root, 'apps', 'web', 'public', file);
    try {
      await fs.access(full);
      checks.push({ file, ok: true });
    } catch {
      checks.push({ file, ok: false });
    }
  }

  return checks;
}

function fmtBool(v) {
  return v ? 'PASS' : 'FAIL';
}

async function main() {
  const routes = await collectRoutes(path.join(root, 'apps', 'web', 'app'));
  const uniqueRoutes = Array.from(new Set(routes)).sort();

  const links = await checkLinks(uniqueRoutes);
  const form = await formChecks();
  const routeChecks = await routeSwitchChecks();
  const assets = await staticAssetChecks();
  const build = safeExec('corepack pnpm --filter @zervia/web build');

  const md = [];
  md.push(`# Audit Run ${ymd}`);
  md.push('');
  md.push(`- Base URL: ${baseUrl}`);
  md.push(`- Timestamp: ${new Date().toISOString()}`);
  md.push('');

  md.push('## Link Check');
  md.push('');
  for (const item of links) {
    md.push(`- [${item.ok ? 'PASS' : 'FAIL'}] ${item.status} ${item.url}${item.err ? ` (${item.err})` : ''}`);
  }
  md.push('');

  md.push('## Form Check');
  md.push('');
  md.push(`- ${fmtBool(form.homeHasSearchAction)} home search action exists`);
  md.push(`- ${fmtBool(form.homeHasLocationError)} home location error state exists`);
  md.push(`- ${fmtBool(form.loginHasForm)} login form exists`);
  md.push(`- ${fmtBool(form.loginHasSubmit)} login submit button exists`);
  md.push(`- ${fmtBool(form.loginHasErrorUi)} login error UI exists`);
  md.push('');

  md.push('## Route Switch Check (query preservation)');
  md.push('');
  md.push(`- ${fmtBool(routeChecks.languagePreservesQuery)} language switch preserves query`);
  md.push(`- ${fmtBool(routeChecks.countryPreservesQuery)} country switch preserves query`);
  md.push('');

  md.push('## Build and Static Assets');
  md.push('');
  md.push(`- Build: ${build.ok ? 'PASS' : 'FAIL'}`);
  for (const asset of assets) {
    md.push(`- ${asset.ok ? 'PASS' : 'FAIL'} ${asset.file}`);
  }
  if (!build.ok) {
    md.push('');
    md.push('### Build output');
    md.push('```');
    md.push(build.out.slice(0, 6000));
    md.push('```');
  }

  await fs.writeFile(outputPath, md.join('\n'), 'utf8');
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
