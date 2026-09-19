export type ExtractedPage = {
  pageNumber: number;
  content: string;
};

export type ExtractedPdf = {
  metadataTitle: string | null;
  pageCount: number;
  pages: ExtractedPage[];
};
