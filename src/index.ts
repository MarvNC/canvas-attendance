import fs from "node:fs";
import { parse } from "csv-parse";
import path from "node:path";
import mdToPdf from "md-to-pdf";

const CRN_REGEX = /CRN (\d+)/g;
const IGNORE_NAMES = ["Student, Test"];
const OUT_FOLDER = `output`;
const WIDTH_SIGNATURE_COL = 135;

// Read args

const gradesCsvPath = Bun.argv[2];
if (!gradesCsvPath) {
  console.error("Please provide a path to the CSV file");
  process.exit(1);
}

const gradesCsvPathStr = gradesCsvPath as string;

// Parse sections

const sectionsMap = new Map<string, Set<string>>();
const parser = fs.createReadStream(gradesCsvPathStr).pipe(
  parse({
    columns: true,
  })
);
for await (const record of parser) {
  const sectionText = record["Section"];
  if (!sectionText) {
    continue;
  }
  const CRNs = [...sectionText.matchAll(CRN_REGEX)].map((match) => match[1]);
  if (CRNs.length === 0) {
    continue;
  }
  const student = record["Student"];
  for (const CRN of CRNs) {
    const section = sectionsMap.get(CRN);
    if (section) {
      section.add(student);
    } else {
      const newSection = new Set<string>();
      newSection.add(student);
      sectionsMap.set(CRN, newSection);
    }
  }
}

// Create md files

const mdFiles = [];
for (const [CRN, students] of sectionsMap) {
  // Create an `attendance-${CRN}.md` file for each section
  const fileName = path.join(OUT_FOLDER, `attendance-${CRN}.md`);

  let mdString = `# Attendance for CRN ${CRN}\n\n`;
  mdString += `| Student | Signature |\n| --- | --- |\n`;
  // Table rows
  for (const student of students) {
    if (IGNORE_NAMES.includes(student)) {
      continue;
    }
    const spaces = "&nbsp;".repeat(WIDTH_SIGNATURE_COL);
    mdString += `| ${student} | ${spaces} |\n`;
  }

  Bun.write(fileName, mdString);
  console.log(`Generated ${fileName}`);
  mdFiles.push(fileName);
}

// Generate PDFs

for (const mdFile of mdFiles) {
  // Read the markdown file
  const mdContent = await Bun.file(mdFile).text();
  const pdfName = mdFile.replace(".md", ".pdf");
  await mdToPdf({ content: mdContent }, { dest: pdfName });
  console.log(`Generated ${pdfName}`);
}
