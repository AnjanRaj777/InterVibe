import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
const PDFParser = require('pdf2json');

// SEC-12: Maximum allowed resume file size (5MB)
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    // SEC-05: Enforce server-side authentication
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized: Valid session required' }, { status: 401 });
      }
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // SEC-12: Enforce size limit before allocating buffers
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed limit of 5MB' },
        { status: 413 }
      );
    }

    // SEC-12: Enforce MIME-type verification
    if (file.type && file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid file format. Only PDF documents are supported' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // SEC-12: Verify PDF magic bytes (%PDF-)
    if (buffer.length < 5 || buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      return NextResponse.json(
        { error: 'Invalid file content. Uploaded file is not a valid PDF document' },
        { status: 400 }
      );
    }
    
    const data = await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser(null, 1);
      
      pdfParser.on("pdfParser_dataError", (errData: any) => {
        reject(errData.parserError);
      });
      
      pdfParser.on("pdfParser_dataReady", () => {
        resolve(pdfParser.getRawTextContent());
      });
      
      pdfParser.parseBuffer(buffer);
    });
    
    if (!data) {
      return NextResponse.json({ error: 'Failed to extract text from PDF' }, { status: 500 });
    }

    return NextResponse.json({ status: 'success', text: data.trim() });
  } catch (error: any) {
    // SEC-15: Log internal error server-side, return sanitized message to client
    console.error('[Extract-Resume] Internal error parsing PDF:', error);
    return NextResponse.json(
      { error: 'Failed to process resume. Please ensure the PDF is valid and unencrypted.' },
      { status: 500 }
    );
  }
}
