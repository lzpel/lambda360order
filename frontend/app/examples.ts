import fs, { PathLike } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nunjucks from "nunjucks";
import { transformSync } from "esbuild";
// directories
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const examplesDir = path.join(__dirname, "../examples");
const outDir = path.join(__dirname, "out");
const outGlobalDir = path.join(__dirname, "../../dist/examples");

fs.rmSync(outDir, { recursive: true, force: true });
fs.rmSync(outGlobalDir, { recursive: true, force: true });
function writeFileSync(filePath: PathLike, content: string) {
    const dir = path.dirname(filePath.toString());
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content);
    console.log(`Generated: ${filePath}`);
}
// list.json を作成
const entries = fs.readdirSync(examplesDir)
    .filter(name => fs.statSync(path.join(examplesDir, name)).isDirectory())
    .sort();

const list = entries.map((name, i) => {
    const readmePath = path.join(examplesDir, name, "README.md");
    const description = fs.existsSync(readmePath)
        ? fs.readFileSync(readmePath, "utf-8").split("\n")[0].replace(/^#+\s*/, "")
        : "";
    return { nameDirectory: String(i + 1).padStart(2, "0"), name, description };
});

writeFileSync(path.join(outDir, "list.json"), JSON.stringify(list, null, 2));

const pageTemplate = `\
"use client";
import { params, lambda } from '@/examples/{{ name }}/script';
import Lambda360Form from '@widget/Lambda360Form';

const nameDirectory = "{{ nameDirectory }}";
const name = "{{ name }}";

export default function Page() {
  return (
    <>
      <h1>{name}</h1>
      <Lambda360Form input={params} lambda={lambda} />
    </>
  );
}
`;

for (const { nameDirectory, name } of list) {
    const pageDir = path.join(outDir, nameDirectory);
    fs.mkdirSync(pageDir, { recursive: true });
    const content = nunjucks.renderString(pageTemplate, { nameDirectory, name });
    writeFileSync(path.join(pageDir, "page.tsx"), content);
}

const version = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../../widget/package.json"), "utf-8")
).version;

const indexTemplate = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>lambda360form デモ一覧 v{{ version }}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { display: flex; height: 100vh; font-family: sans-serif; }
        nav { width: 260px; border-right: 1px solid #e0e0e0; overflow-y: auto; flex-shrink: 0; padding: 16px 0; }
        nav h1 { font-size: 1em; padding: 0 16px 12px; color: #333; border-bottom: 1px solid #e0e0e0; margin-bottom: 8px; }
        ul { list-style: none; }
        li a { display: block; padding: 10px 16px; text-decoration: none; color: #333; font-size: 0.9em; border-left: 3px solid transparent; }
        li a:hover { background: #f5f5f5; }
        li a.active { border-left-color: #0066cc; background: #f0f4ff; font-weight: bold; color: #0066cc; }
        iframe { flex: 1; border: none; }
    </style>
</head>
<body>
    <nav>
        <h1>lambda360form v{{ version }}</h1>
        <ul>
{% for item in items %}
            <li><a href="{{ item.name }}.html">{{ item.name }}<small style="display:block;color:#666;font-weight:normal">{{ item.description }}</small></a></li>
{% endfor %}
        </ul>
    </nav>
    <iframe id="preview" src="about:blank"></iframe>
    <script>
        const preview = document.getElementById('preview');
        function select(a) {
            document.querySelectorAll('nav a').forEach(x => x.classList.remove('active'));
            a.classList.add('active');
            preview.src = a.href;
        }
        document.querySelectorAll('nav a').forEach(a => {
            a.addEventListener('click', e => { e.preventDefault(); select(a); });
        });
        const first = document.querySelector('nav a');
        if (first) select(first);
    </script>
</body>
</html>`;

const exampleTemplate = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>{{ name }}</title>
</head>
<body>
    <h1>{{ name }}</h1>
    <script src="https://unpkg.com/lambda360form@{{ version }}/dist/lambda360form.js"></script>
    <div id="app"></div>
    <script>
        {{ script | safe }}
        Lambda360.initLambda360('#app', { input: params, lambda: lambda });
    </script>
</body>
</html>`;


const pathIndex = path.join(outGlobalDir, "index.html");
writeFileSync(pathIndex, nunjucks.renderString(indexTemplate, { version, items: list }));

for (const { name } of list) {
    const scriptPath = path.join(examplesDir, name, "script.ts");
    if (!fs.existsSync(scriptPath)) continue;
    const tsCode = fs.readFileSync(scriptPath, "utf-8");
    const { code } = transformSync(tsCode, { loader: "ts", format: "esm", charset: "utf8" });
    const script = code
        .replace(/^export (const|let|var|function) /gm, "$1 ")
        .replace(/export\s*\{[\s\S]*?\};/, "")
        .trim();
    const html = nunjucks.renderString(exampleTemplate, { name, version, script });
    writeFileSync(path.join(outGlobalDir, `${name}.html`), html);
}