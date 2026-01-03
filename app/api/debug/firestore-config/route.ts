import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const databaseId = process.env.FIRESTORE_DATABASE_ID;

    let resolvedPath = serviceAccountPath;
    if (serviceAccountPath && !path.isAbsolute(serviceAccountPath)) {
        resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
    }

    const fileExists = resolvedPath ? fs.existsSync(resolvedPath) : false;
    const cwd = process.cwd();

    // Read file content for project ID if exists
    let fileProjectId = null;
    if (fileExists && resolvedPath) {
        try {
            const content = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
            fileProjectId = content.project_id;
        } catch (e) {
            fileProjectId = 'error reading file';
        }
    }

    return NextResponse.json({
        cwd,
        serviceAccountPath,
        resolvedPath,
        fileExists,
        projectId,
        databaseId,
        fileProjectId,
        envCheck: {
            GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
            GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            FIRESTORE_DATABASE_ID: process.env.FIRESTORE_DATABASE_ID,
        }
    });
}
