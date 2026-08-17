import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { env, publicApiUrl } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

function parseImageDataUrl(value: string) {
  const match = /^data:image\/(png|jpe?g|webp);base64,([a-zA-Z0-9+/=]+)$/.exec(
    value,
  );
  if (!match) {
    throw new HttpError(400, "Envie uma foto valida em formato de imagem.");
  }

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > 7_500_000) {
    throw new HttpError(413, "A foto enviada esta muito grande.");
  }

  const extension = match[1] === "jpeg" ? "jpg" : match[1];
  const validSignature =
    (extension === "png" &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    ((extension === "jpg" || extension === "jpeg") &&
      buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) ||
    (extension === "webp" &&
      buffer.subarray(0, 4).equals(Buffer.from("RIFF")) &&
      buffer.subarray(8, 12).equals(Buffer.from("WEBP")));

  if (!validSignature) {
    throw new HttpError(
      400,
      "O arquivo enviado não corresponde a uma imagem válida.",
    );
  }

  return { buffer, extension };
}

function parseCnhDocumentDataUrl(value: string) {
  const image = /^data:image\/(png|jpe?g|webp);base64,([a-zA-Z0-9+/=]+)$/.exec(
    value,
  );
  const pdf = /^data:application\/pdf;base64,([a-zA-Z0-9+/=]+)$/.exec(value);

  if (!image && !pdf) {
    throw new HttpError(400, "Envie a CNH em JPG, PNG, WEBP ou PDF.");
  }

  const extension = pdf ? "pdf" : image?.[1] === "jpeg" ? "jpg" : image?.[1];
  const encodedData = pdf ? pdf[1] : image?.[2];
  const buffer = Buffer.from(encodedData!, "base64");

  if (buffer.length > 5 * 1024 * 1024) {
    throw new HttpError(413, "O documento da CNH deve ter no maximo 5 MB.");
  }

  const validSignature =
    (extension === "png" &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (extension === "jpg" &&
      buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) ||
    (extension === "webp" &&
      buffer.subarray(0, 4).equals(Buffer.from("RIFF")) &&
      buffer.subarray(8, 12).equals(Buffer.from("WEBP"))) ||
    (extension === "pdf" && buffer.subarray(0, 5).equals(Buffer.from("%PDF-")));

  if (!validSignature) {
    throw new HttpError(
      400,
      "O arquivo enviado nao corresponde a um documento valido.",
    );
  }

  return { buffer, extension: extension! };
}

async function uploadPhoto(dataUrl: string, folder: string, prefix: string) {
  const { buffer, extension } = parseImageDataUrl(dataUrl);
  const safeFolder = folder.replace(/[^a-zA-Z0-9_/-]/g, "-");
  const filename = `${prefix}-${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const directory = path.join(env.PHOTO_STORAGE_DIR, safeFolder);

  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), buffer, { flag: "wx" });

  const relativeUrl = `${safeFolder}/${filename}`.split(path.sep).join("/");
  return {
    url: `${publicApiUrl}/uploads/${relativeUrl}`,
    publicId: relativeUrl,
  };
}

async function uploadCnhDocument(dataUrl: string, userReference: string) {
  const { buffer, extension } = parseCnhDocumentDataUrl(dataUrl);
  const safeReference = userReference.replace(/[^a-zA-Z0-9_-]/g, "-");
  const safeFolder = `cnh/${safeReference}`;
  const filename = `documento-${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const directory = path.join(env.PHOTO_STORAGE_DIR, safeFolder);

  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), buffer, { flag: "wx" });

  const relativeUrl = `${safeFolder}/${filename}`.split(path.sep).join("/");
  return {
    url: `${publicApiUrl}/uploads/${relativeUrl}`,
    publicId: relativeUrl,
  };
}

export async function uploadCnhPhoto(dataUrl: string, userReference: string) {
  return uploadCnhDocument(dataUrl, userReference);
}

export async function uploadReservationPhoto(
  dataUrl: string,
  reservationId: string,
  type: string,
) {
  return uploadPhoto(
    dataUrl,
    `reservations/${reservationId}`,
    type.toLowerCase(),
  );
}
