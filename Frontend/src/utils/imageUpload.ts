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

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Nao foi possivel carregar a foto."));
    image.src = src;
  });
}
