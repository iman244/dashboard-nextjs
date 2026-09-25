import axios from "axios";
import { digitsFaToEn } from "@persian-tools/persian-tools";
import { presign } from "./api/presign";
import type { FileDescriptor } from "./types";

/**
 * Put one file in object storage and return the receipt the entry endpoint
 * wants.
 *
 * Two steps: ask Django to sign an upload it has checked against the schema,
 * then PUT the bytes straight to the bucket. The bytes never pass through the
 * application server, which is what makes a 50 MB scan survive a two-core VM.
 *
 * If browser-to-bucket turns out to be unreachable on operators' networks, the
 * fallback is to POST the file to Django and let it forward. That change lives
 * in THIS FILE and nowhere else -- the form, the entry endpoint and the models
 * are all indifferent to how the bytes arrived.
 */
export const uploadToField = async ({
  monitoring,
  nationalId,
  fieldKey,
  file,
  onProgress,
}: {
  monitoring: number;
  nationalId: string;
  fieldKey: string;
  file: File;
  onProgress?: (percent: number) => void;
}): Promise<FileDescriptor> => {
  const contentType = file.type || "application/octet-stream";

  const signed = await presign({
    monitoring,
    national_id: digitsFaToEn(nationalId),
    field_key: fieldKey,
    filename: file.name,
    content_type: contentType,
    size: file.size,
  });

  // A bare axios call, never `apiInstance`: that instance attaches the Django
  // JWT, and an unexpected Authorization header invalidates the S3 signature.
  await axios.put(signed.upload_url, file, {
    headers: signed.headers,
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });

  return {
    field_key: fieldKey,
    key: signed.key,
    original_name: file.name,
    content_type: contentType,
    size: file.size,
  };
};
