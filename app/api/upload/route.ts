import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No video asset detected.' }, { status: 400 });
    }

    // 1. Authenticate with the Service Account using the FULL Drive scope
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // 2. Convert the incoming file into a Node.js Readable Stream
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // 3. Your updated Google Drive Folder ID
    const folderId = '1CFgz4R75u7eq6k9dn9abeRYLfKkWlJ3W';
    
    // 4. Beam the file securely to your designated folder
    const response = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [folderId],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id, name, webViewLink',
      supportsAllDrives: true,
    });

    return NextResponse.json({ success: true, file: response.data });
  } catch (error: any) {
    console.error('Vault Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}