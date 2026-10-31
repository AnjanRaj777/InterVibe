import { NextRequest, NextResponse } from 'next/server';
const PDFParser = require('pdf2json');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const data = await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser(null, 1);
      
      pdfParser.on("pdfParser_dataError", (errData: any) => {
        reject(errData.parserError);
      });
      
      pdfParser.on("pdfParser_dataReady", () => {
        // getRawTextContent() returns decoded string
        resolve(pdfParser.getRawTextContent());
      });
      
      pdfParser.parseBuffer(buffer);
    });
    
    if (!data) {
      return NextResponse.json({ error: 'Failed to extract text from PDF' }, { status: 500 });
    }

    return NextResponse.json({ status: 'success', text: data.trim() });
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    return NextResponse.json({ error: `Failed to process resume: ${error.message}` }, { status: 500 });
  }
}
