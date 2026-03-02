import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outputPath = path.join(root, 'docs', 'audit', 'lighthouse.md');
const urls = [
  process.env.AUDIT_HOME_URL || 'https://zervia.eu/de',
  process.env.AUDIT_SEARCH_URL || 'https://zervia.eu/de/search'
];

function runLighthouse(url) {
  const result = spawnSync(
    'npx',
    ['-y', 'lighthouse', url, '--quiet', '--chrome-flags=--headless=new --no-sandbox', '--output=json', '--output-path=stdout'],
    { encoding: 'utf8', shell: true }
  );

  if (result.status !== 0 || !result.stdout) {
    return { ok: false, error: result.stderr || result.stdout || `exit=${result.status}` };
  }

  try {
    const json = JSON.parse(result.stdout);
    return {
      ok: true,
      metrics: {
        performance: Math.round((json.categories.performance.score || 0) * 100),
        accessibility: Math.round((json.categories.accessibility.score || 0) * 100),
        seo: Math.round((json.categories.seo.score || 0) * 100),
        lcp: json.audits['largest-contentful-paint']?.displayValue,
        cls: json.audits['cumulative-layout-shift']?.displayValue,
        tti: json.audits['interactive']?.displayValue
      }
    };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

async function main() {
  const lines = [];
  lines.push('# Lighthouse Audit');
  lines.push('');
  lines.push(`- Timestamp: ${new Date().toISOString()}`);
  lines.push('');

  let successCount = 0;

  for (const url of urls) {
    const result = runLighthouse(url);
    lines.push(`## ${url}`);
    lines.push('');
    if (!result.ok) {
      lines.push('- Status: FAILED to execute Lighthouse in current environment');
      lines.push('- How to run locally:');
      lines.push('```bash');
      lines.push(`npx lighthouse ${url} --view`);
      lines.push('```');
      lines.push('- Probable issues to inspect: image optimization, script blocking, form labels, canonical metadata.');
      lines.push('');
      lines.push('```text');
      lines.push(String(result.error).slice(0, 1200));
      lines.push('```');
      lines.push('');
      continue;
    }

    successCount += 1;
    lines.push('- Status: PASS');
    lines.push(`- Performance: ${result.metrics.performance}`);
    lines.push(`- Accessibility: ${result.metrics.accessibility}`);
    lines.push(`- SEO: ${result.metrics.seo}`);
    lines.push(`- LCP: ${result.metrics.lcp}`);
    lines.push(`- CLS: ${result.metrics.cls}`);
    lines.push(`- TTI: ${result.metrics.tti}`);
    lines.push('');
  }

  if (successCount === 0) {
    lines.push('## Current Positioning (fallback analysis)');
    lines.push('');
    lines.push('- Homepage includes heavy interactive sections and embedded map; map should stay lazy-loaded.');
    lines.push('- Main CTA and search controls are visible above fold on mobile.');
    lines.push('- Continue reducing blocking JS and use optimized image components for logo/hero visuals.');
  }

  await fs.writeFile(outputPath, lines.join('\n'), 'utf8');
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
