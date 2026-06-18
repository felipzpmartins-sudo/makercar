export async function imageFileToDataUrl(file: File) {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(imageUrl);
    const maxSize = 1600;
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const width = Math.round(image.width * scale);
    const height = Math.round(image.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Nao foi possivel preparar a foto.");
    context.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", 0.78);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export async function buildPhotoChecklistDataUrl(
  photos: Array<{ label: string; dataUrl: string }>,
) {
  const loadedPhotos = await Promise.all(
    photos.map(async (photo) => ({
      ...photo,
      image: await loadImage(photo.dataUrl),
    })),
  );

  const columns = loadedPhotos.length === 1 ? 1 : 2;
  const cellWidth = 760;
  const imageHeight = 500;
  const labelHeight = 52;
  const gap = 24;
  const padding = 24;
  const rows = Math.ceil(loadedPhotos.length / columns);
  const canvas = document.createElement("canvas");
  canvas.width = padding * 2 + columns * cellWidth + (columns - 1) * gap;
  canvas.height = padding * 2 + rows * (labelHeight + imageHeight) + (rows - 1) * gap;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Nao foi possivel preparar as fotos.");

  context.fillStyle = "#f8fafc";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = "700 26px Arial";
  context.textBaseline = "middle";

  loadedPhotos.forEach((photo, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = padding + column * (cellWidth + gap);
    const y = padding + row * (labelHeight + imageHeight + gap);

    context.fillStyle = "#0f172a";
    context.fillText(photo.label, x, y + labelHeight / 2);

    const scale = Math.max(cellWidth / photo.image.width, imageHeight / photo.image.height);
    const width = photo.image.width * scale;
    const height = photo.image.height * scale;
    const imageX = x + (cellWidth - width) / 2;
    const imageY = y + labelHeight + (imageHeight - height) / 2;

    context.save();
    context.beginPath();
    context.rect(x, y + labelHeight, cellWidth, imageHeight);
    context.clip();
    context.drawImage(photo.image, imageX, imageY, width, height);
    context.restore();

    context.strokeStyle = "#cbd5e1";
    context.lineWidth = 2;
    context.strokeRect(x, y + labelHeight, cellWidth, imageHeight);
  });

  return canvas.toDataURL("image/jpeg", 0.78);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Nao foi possivel carregar a foto."));
    image.src = src;
  });
}
