import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nunjucks from "nunjucks";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const examplesDir = path.join(__dirname, "../examples");

const entries = fs.readdirSync(examplesDir)
    .filter(name => fs.statSync(path.join(examplesDir, name)).isDirectory())
    .sort();

const list = entries.map((name, i) => ({
    nameDirectory: String(i + 1).padStart(2, "0"),
    name,
}));

const outDir = path.join(__dirname, "out");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "list.json"), JSON.stringify(list, null, 2));
console.log(`Generated: app/out/list.json (${list.length} entries)`);

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
    fs.writeFileSync(path.join(pageDir, "page.tsx"), content);
    console.log(`Generated: app/out/${nameDirectory}/page.tsx`);
}