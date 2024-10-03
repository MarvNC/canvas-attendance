import fs from "node:fs";
import { parse } from "csv-parse";

const gradesCsvPath = Bun.argv[2];
if (!gradesCsvPath) {
  console.error("Please provide a path to the CSV file");
  process.exit(1);
}

const gradesCsvPathStr = gradesCsvPath as string;

const processFile = async (filePath: string) => {
  const records: any[] = [];
  const parser = fs.createReadStream(filePath).pipe(
    parse({
      // CSV options if any
    })
  );
  for await (const record of parser) {
    // Work with each record
    records.push(record);
  }
  return records;
};

(async () => {
  const records = await processFile(gradesCsvPathStr);
  console.info(records);
})();
