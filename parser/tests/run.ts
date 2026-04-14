import * as fs from 'fs';
import * as path from 'path';
import { KDocParser } from '../src/index';

function runTest(inputFile: string, outputFile: string) {
  const inputPath = path.resolve(__dirname, '..', inputFile);
  const outputPath = path.resolve(__dirname, '..', outputFile);

  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    return;
  }

  const docJson = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  const parser = new KDocParser(docJson);
  
  console.log(`Parsing ${inputFile}...`);
  const markdown = parser.parse(docJson);

  fs.writeFileSync(outputPath, markdown, 'utf-8');
  console.log(`Done! Output saved to ${outputFile}`);
}

// 运行测试
runTest('ap1.json', 'ap1_output.md');
runTest('ap2.json', 'ap2_output.md');
