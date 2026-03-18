import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { transform } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const examplesDir = path.join(__dirname, "../examples");
const template = fs.readFileSync(path.join(examplesDir, "demo.html.template"), "utf-8");
const indexTemplate = fs.readFileSync(path.join(examplesDir, "index.html.template"), "utf-8");

function escapeHtml(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function render(template: string, vars: { title: string; version: string; script: string }): string {
	const partial = template
		.replace(/__title__/g, vars.title)
		.replace("__version__", vars.version)
		.replace(/^( *)__script__/m, (_, indent) =>
			vars.script.trimEnd().split("\n").map(line => indent + line).join("\n")
		);
	const first = partial.replace("__self__", "");
	const b64 = Buffer.from(first).toString("base64");
	const codeStyle = "display:block;background:#f6f8fa;border:1px solid #d0d7de;border-radius:6px;padding:1em;font-size:0.85em;line-height:1.5;overflow-x:auto;white-space:pre";
	const self = `<h2>このページを再現するHTML</h2>
<a href="data:text/html;base64,${b64}" download="index.html" style="display:inline-block;margin-bottom:0.5em">index.html をダウンロード</a>
<pre><code style="${codeStyle}">${escapeHtml(first)}</code></pre>`;
	return partial.replace("__self__", self);
}

const version = process.env.npm_package_version!;
const outDir = path.join(__dirname, "../dist/examples");
fs.mkdirSync(outDir, { recursive: true });

const entries = fs.readdirSync(examplesDir)
	.filter(name => fs.statSync(path.join(examplesDir, name)).isDirectory())
	.sort();

const demoList: { name: string; description: string }[] = [];

for (const name of entries) {
	const scriptPath = path.join(examplesDir, name, "script.ts");
	if (!fs.existsSync(scriptPath)) continue;

	const tsCode = fs.readFileSync(scriptPath, "utf-8");
	const { code } = await transform(tsCode, { loader: "ts", format: "esm", charset: "utf8" });
	const script = code
		.replace(/^export (const|let|var|function) /gm, "$1 ")
		.replace(/export\s*\{[\s\S]*?\};/, "")
		.trim();

	const html = render(template, { title: name, version, script });

	const demoOutDir = path.join(outDir, name);
	fs.mkdirSync(demoOutDir, { recursive: true });
	fs.writeFileSync(path.join(demoOutDir, "index.html"), html);
	console.log(`Generated: dist/examples/${name}/index.html`);
	// jsもunpkgに含めてしまうと宣伝ページなどを簡単に構築できる
	fs.writeFileSync(path.join(demoOutDir, "script.js"), script);
	console.log(`Generated: dist/examples/${name}/script.js`);

	const readmePath = path.join(examplesDir, name, "README.md");
	const description = fs.existsSync(readmePath)
		? fs.readFileSync(readmePath, "utf-8").split("\n")[0].replace(/^#+\s*/, "")
		: "";
	demoList.push({ name, description });
}

const demoListHtml = demoList.map(d => `				<li><a href="examples/${d.name}/index.html">${d.name}</a><small>${d.description}</small></li>`).join("\n");
const indexHtml = indexTemplate
	.replace(/__version__/g, version)
	.replace("__demoList__", demoListHtml);

fs.writeFileSync(path.join(__dirname, "../dist/index.html"), indexHtml);
console.log("Generated: dist/index.html");
console.log(`${demoList.length} demo(s) generated.`);
