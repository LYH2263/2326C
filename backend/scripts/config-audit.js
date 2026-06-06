#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

const SENSITIVE_KEY_PATTERNS = [
  /secret/i,
  /password/i,
  /token/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /credential/i,
  /aws[_-]?access/i,
  /aws[_-]?secret/i,
  /db[_-]?pass/i,
  /jwt[_-]?secret/i,
];

const HARDCODED_VALUE_PATTERNS = [
  /['"]?[a-zA-Z0-9_-]+['"]?\s*[=:]\s*['"][A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{16,}['"]/g,
];

const IGNORE_DIRS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '.vscode',
  '.idea',
  'coverage',
];

const results = {
  errors: [],
  warnings: [],
  info: [],
};

function log(level, message) {
  results[level].push(message);
  const prefix = { errors: '[ERROR]', warnings: '[WARN] ', info: '[INFO] ' }[level];
  console.log(`${prefix} ${message}`);
}

function findFiles(dir, pattern) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (IGNORE_DIRS.includes(entry.name)) continue;

    if (entry.isDirectory()) {
      files.push(...findFiles(fullPath, pattern));
    } else if (pattern.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function findEnvFiles() {
  const envFiles = [];
  const allDirs = [BACKEND_DIR, FRONTEND_DIR];

  for (const dir of allDirs) {
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.startsWith('.env')) {
        envFiles.push(path.join(dir, entry.name));
      }
    }
  }
  return envFiles;
}

function parseEnvFile(filePath) {
  const vars = {};
  if (!fs.existsSync(filePath)) return vars;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    vars[key] = value;
  }
  return vars;
}

function readGitignore(dir) {
  const gitignorePath = path.join(dir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) return [];

  const content = fs.readFileSync(gitignorePath, 'utf-8');
  return content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
}

function isGitignored(filePath, gitignorePatterns, baseDir) {
  const relativePath = path.relative(baseDir, filePath);
  const fileName = path.basename(filePath);

  for (const pattern of gitignorePatterns) {
    if (!pattern) continue;

    if (pattern === fileName) return true;
    if (pattern.endsWith('/') && relativePath.startsWith(pattern)) return true;
    if (pattern.startsWith('*') && fileName.endsWith(pattern.slice(1))) return true;
    if (pattern.includes('*')) {
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      if (new RegExp(`^${regexPattern}$`).test(fileName)) return true;
    }
  }
  return false;
}

function isSensitiveKey(key) {
  return SENSITIVE_KEY_PATTERNS.some(pattern => pattern.test(key));
}

function scanProcessEnvRefs() {
  console.log('\n=== 扫描 process.env 引用 ===\n');

  const sourceFiles = [
    ...findFiles(BACKEND_DIR, /\.(ts|js)$/),
    ...findFiles(FRONTEND_DIR, /\.(ts|tsx|js|jsx)$/),
  ];

  const envRefs = new Map();

  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const regex = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const key = match[1];
      if (!envRefs.has(key)) {
        envRefs.set(key, []);
      }
      const relativePath = path.relative(ROOT_DIR, file);
      if (!envRefs.get(key).includes(relativePath)) {
        envRefs.get(key).push(relativePath);
      }
    }
  }

  log('info', `找到 ${envRefs.size} 个不同的 process.env 变量引用`);

  for (const [key, files] of envRefs.entries()) {
    log('info', `  ${key}: ${files.length} 处引用 (${files.join(', ')})`);
  }

  return envRefs;
}

function checkEnvFiles() {
  console.log('\n=== 检查 .env 文件 ===\n');

  const envFiles = findEnvFiles();
  log('info', `找到 ${envFiles.length} 个 .env 文件`);

  for (const file of envFiles) {
    const relativePath = path.relative(ROOT_DIR, file);
    log('info', `  ${relativePath}`);
  }

  return envFiles;
}

function checkGitignore(envFiles) {
  console.log('\n=== 检查 .gitignore 覆盖情况 ===\n');

  const rootGitignore = readGitignore(ROOT_DIR);
  const backendGitignore = readGitignore(BACKEND_DIR);
  const frontendGitignore = readGitignore(FRONTEND_DIR);

  let allIgnored = true;

  for (const file of envFiles) {
    const fileName = path.basename(file);
    if (fileName === '.env.example') continue;

    const dir = path.dirname(file);
    let gitignorePatterns;
    let baseDir;

    if (file.startsWith(BACKEND_DIR)) {
      gitignorePatterns = [...rootGitignore, ...backendGitignore];
      baseDir = BACKEND_DIR;
    } else if (file.startsWith(FRONTEND_DIR)) {
      gitignorePatterns = [...rootGitignore, ...frontendGitignore];
      baseDir = FRONTEND_DIR;
    } else {
      gitignorePatterns = rootGitignore;
      baseDir = ROOT_DIR;
    }

    if (!isGitignored(file, gitignorePatterns, baseDir) && !isGitignored(file, rootGitignore, ROOT_DIR)) {
      log('errors', `${path.relative(ROOT_DIR, file)} 未被 .gitignore 排除！`);
      allIgnored = false;
    } else {
      log('info', `${path.relative(ROOT_DIR, file)} 已被 .gitignore 排除`);
    }
  }

  if (allIgnored) {
    log('info', '所有 .env 文件（除 .env.example 外）都已被 .gitignore 排除');
  }

  return allIgnored;
}

function checkHardcodedSecrets(envFiles) {
  console.log('\n=== 检查硬编码密钥 ===\n');

  let hasIssues = false;

  for (const file of envFiles) {
    const fileName = path.basename(file);
    if (fileName === '.env.example') continue;

    const vars = parseEnvFile(file);
    const relativePath = path.relative(ROOT_DIR, file);

    for (const [key, value] of Object.entries(vars)) {
      if (isSensitiveKey(key) && value && value.length > 0) {
        if (fileName.includes('test') || fileName.includes('development')) {
          log('warnings', `${relativePath} 中的 ${key} 有实际值（非生产环境可接受）`);
        } else if (fileName.includes('production')) {
          log('warnings', `${relativePath} 中的 ${key} 有硬编码值！生产环境应通过环境变量注入`);
          hasIssues = true;
        }
      }
    }
  }

  const sourceFiles = [
    ...findFiles(BACKEND_DIR, /\.(ts|js)$/),
    ...findFiles(FRONTEND_DIR, /\.(ts|tsx|js|jsx)$/),
  ];

  const suspiciousPatterns = [
    /['"](?:sk_|pk_|AKIA|xox[bp]-|ghp_|github_pat_)[A-Za-z0-9_-]{10,}['"]/g,
    /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{6,}['"]/gi,
    /(?:secret|token)\s*[:=]\s*['"][^'"]{10,}['"]/gi,
  ];

  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(ROOT_DIR, file);

    for (const pattern of suspiciousPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          if (match.includes('process.env') || match.includes('import.meta.env')) continue;
          log('errors', `在 ${relativePath} 中发现疑似硬编码密钥: ${match.slice(0, 60)}...`);
          hasIssues = true;
        }
      }
    }
  }

  if (!hasIssues) {
    log('info', '未发现明显的硬编码密钥问题');
  }

  return !hasIssues;
}

function checkEnvExampleCoverage(envFiles) {
  console.log('\n=== 检查 .env.example 覆盖情况 ===\n');

  let allCovered = true;

  const dirs = [
    { name: 'backend', dir: BACKEND_DIR },
    { name: 'frontend', dir: FRONTEND_DIR },
  ];

  for (const { name, dir } of dirs) {
    const examplePath = path.join(dir, '.env.example');
    if (!fs.existsSync(examplePath)) {
      log('warnings', `${name} 目录缺少 .env.example 文件`);
      allCovered = false;
      continue;
    }

    const exampleVars = new Set(Object.keys(parseEnvFile(examplePath)));
    const envFilesInDir = envFiles.filter(f => f.startsWith(dir) && path.basename(f) !== '.env.example');

    for (const envFile of envFilesInDir) {
      const vars = Object.keys(parseEnvFile(envFile));
      const fileName = path.basename(envFile);

      for (const key of vars) {
        if (!exampleVars.has(key)) {
          log('warnings', `${name}/${fileName} 中的 ${key} 在 .env.example 中未声明`);
          allCovered = false;
        }
      }
    }

    log('info', `${name} 的 .env.example 包含 ${exampleVars.size} 个变量声明`);
  }

  if (allCovered) {
    log('info', '所有环境变量都在 .env.example 中有声明');
  }

  return allCovered;
}

function generateSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('配置安全审计报告');
  console.log('='.repeat(60));
  console.log(`错误: ${results.errors.length}`);
  console.log(`警告: ${results.warnings.length}`);
  console.log(`信息: ${results.info.length}`);
  console.log('='.repeat(60));

  if (results.errors.length > 0) {
    console.log('\n错误列表:');
    results.errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  }

  if (results.warnings.length > 0) {
    console.log('\n警告列表:');
    results.warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
  }

  console.log('');

  return results.errors.length === 0;
}

function main() {
  console.log('='.repeat(60));
  console.log('配置安全审计工具 - Config Audit');
  console.log('='.repeat(60));
  console.log(`项目根目录: ${ROOT_DIR}`);

  const envRefs = scanProcessEnvRefs();
  const envFiles = checkEnvFiles();

  checkGitignore(envFiles);
  checkHardcodedSecrets(envFiles);
  checkEnvExampleCoverage(envFiles);

  const passed = generateSummary();

  process.exit(passed ? 0 : 1);
}

main();
