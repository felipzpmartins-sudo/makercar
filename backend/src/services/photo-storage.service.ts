import crypto from "node:crypto";

import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

function requireCloudinaryConfig() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new HttpError(
      500,
      "Armazenamento de fotos nao configurado. Configure Cloudinary no ambiente.",
    );
  }

  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  };
}

function assertImageDataUrl(value: string) {
  if (!value.startsWith("data:image/")) {
    throw new HttpError(400, "Envie uma foto valida em formato de imagem.");
  }

  const approxBytes = Math.ceil((value.length * 3) / 4);
  if (approxBytes > 7_500_000) {
    throw new HttpError(413, "A foto enviada esta muito grande.");
  }
}

function signUpload(params: Record<string, string>, apiSecret: string) {
  const payload = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

async function uploadPhoto(dataUrl: string, folder: string, publicId: string) {
  assertImageDataUrl(dataUrl);
  const { cloudName, apiKey, apiSecret } = requireCloudinaryConfig();
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = signUpload({ folder, public_id: publicId, timestamp }, apiSecret);

  const form = new FormData();
  form.set("file", dataUrl);
  form.set("api_key", apiKey);
  form.set("timestamp", timestamp);
  form.set("folder", folder);
  form.set("public_id", publicId);
  form.set("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  const body = (await response.json()) as {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
  };
  if (!response.ok || !body.secure_url) {
    throw new HttpError(502, body.error?.message ?? "Nao foi possivel enviar a foto para a nuvem.");
  }
  return { url: body.secure_url, publicId: body.public_id ?? null };
}

export async function uploadCnhPhoto(dataUrl: string, userReference: string) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const safeReference = userReference.replace(/[^a-zA-Z0-9_-]/g, "-");
  return uploadPhoto(dataUrl, `makercar/cnh/${safeReference}`, `documento-${timestamp}`);
}

export async function uploadReservationPhoto(dataUrl: string, reservationId: string, type: string) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  return uploadPhoto(
    dataUrl,
    `makercar/reservations/${reservationId}`,
    `${type.toLowerCase()}-${timestamp}`,
  );
}