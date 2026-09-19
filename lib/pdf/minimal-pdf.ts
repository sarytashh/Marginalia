function escapePdfLiteral(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function pdfLiteral(value: string): string {
  return `(${escapePdfLiteral(value)})`;
}

function padOffset(offset: number): string {
  return offset.toString().padStart(10, "0");
}

export function buildMinimalPdf(options: {
  title?: string;
  pages: string[];
}): Uint8Array {
  const pageTexts = options.pages.length > 0 ? options.pages : [""];
  const objectBodies: string[] = [];

  objectBodies[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objectBodies[2] = "";
  objectBodies[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objectBodies[4] = options.title
    ? `<< /Title ${pdfLiteral(options.title)} >>`
    : "<< >>";

  const pageObjectNumbers: number[] = [];

  pageTexts.forEach((pageText, index) => {
    const contentNumber = 5 + index * 2;
    const pageNumber = 6 + index * 2;
    pageObjectNumbers.push(pageNumber);

    const stream =
      pageText === ""
        ? "BT ET"
        : `BT /F1 12 Tf 72 720 Td ${pdfLiteral(pageText)} Tj ET`;

    objectBodies[contentNumber] =
      `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`;
    objectBodies[pageNumber] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentNumber} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`;
  });

  objectBodies[2] =
    `<< /Type /Pages /Count ${pageTexts.length} /Kids [${pageObjectNumbers
      .map((objectNumber) => `${objectNumber} 0 R`)
      .join(" ")}] >>`;

  const chunks: string[] = ["%PDF-1.4\n"];
  const offsets = [0];
  let cursor = Buffer.byteLength(chunks[0], "latin1");

  for (let objectNumber = 1; objectNumber < objectBodies.length; objectNumber += 1) {
    const body = objectBodies[objectNumber];
    if (body === undefined) {
      throw new Error(`Missing PDF object ${objectNumber}`);
    }

    const serialized = `${objectNumber} 0 obj\n${body}\nendobj\n`;
    offsets[objectNumber] = cursor;
    chunks.push(serialized);
    cursor += Buffer.byteLength(serialized, "latin1");
  }

  const xrefOffset = cursor;
  const xrefLines = ["xref", `0 ${objectBodies.length}`, `${padOffset(0)} 65535 f `];

  for (let objectNumber = 1; objectNumber < objectBodies.length; objectNumber += 1) {
    xrefLines.push(`${padOffset(offsets[objectNumber] ?? 0)} 00000 n `);
  }

  const xref = `${xrefLines.join("\n")}\n`;
  chunks.push(xref);
  chunks.push(
    `trailer\n<< /Size ${objectBodies.length} /Root 1 0 R /Info 4 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
  );

  return Buffer.from(chunks.join(""), "latin1");
}

export function buildSampleLecturePdf(): Uint8Array {
  return buildMinimalPdf({
    title: "Lecture 06 Graph search",
    pages: [
      "Lecture 06. A graph is a set of vertices connected by edges. Graphs may be directed or undirected.",
      "Dijkstra's algorithm finds shortest paths in a weighted graph when every edge weight is non-negative. It uses a priority queue.",
      "Negative edge weights make Dijkstra incorrect. Bellman-Ford can handle negative weights but not negative cycles.",
    ],
  });
}
