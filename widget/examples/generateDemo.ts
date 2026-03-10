import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const template = fs.readFileSync(path.join(__dirname, "template.html"), "utf-8");

function render(template: string, vars: { title: string; version: string; script: string }): string {
	return template
		.replace(/__title__/g, vars.title)
		.replace("__version__", vars.version)
		.replace("__script__", vars.script.trimEnd());
}

const version = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf-8")).version;
const outDir = path.join(__dirname, "../dist/examples");
fs.mkdirSync(outDir, { recursive: true });

const entries = fs.readdirSync(__dirname)
	.filter(name => fs.statSync(path.join(__dirname, name)).isDirectory())
	.sort();

const demoList: { name: string; description: string }[] = [];

for (const name of entries) {
	const scriptPath = path.join(__dirname, name, "script.js");
	if (!fs.existsSync(scriptPath)) continue;

	const script = fs.readFileSync(scriptPath, "utf-8");
	const html = render(template, { title: name, version, script });

	const demoOutDir = path.join(outDir, name);
	fs.mkdirSync(demoOutDir, { recursive: true });
	fs.writeFileSync(path.join(demoOutDir, "index.html"), html);
	console.log(`Generated: dist/examples/${name}/index.html`);

	const readmePath = path.join(__dirname, name, "README.md");
	const description = fs.existsSync(readmePath)
		? fs.readFileSync(readmePath, "utf-8").split("\n")[0].replace(/^#+\s*/, "")
		: "";
	demoList.push({ name, description });
}

const indexHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
	<meta charset="UTF-8">
	<title>lambda360form デモ一覧 v${version}</title>
	<style>
		body { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 0 16px; }
		ul { list-style: none; padding: 0; }
		li { margin: 12px 0; }
		a { font-size: 1.1em; }
		small { color: #666; display: block; }
	</style>
</head>
<body>
	<h1>lambda360form デモ一覧</h1>
	<p>バージョン: <code>${version}</code></p>
	<ul>
${demoList.map(d => `		<li><a href="examples/${d.name}/index.html">${d.name}</a><small>${d.description}</small></li>`).join("\n")}
	</ul>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, "../dist/index.html"), indexHtml);
console.log("Generated: dist/index.html");
console.log(`${demoList.length} demo(s) generated.`);
