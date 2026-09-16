import Image from "next/image";

export function LureImage({
  imageId,
  alt,
}: {
  imageId: string | null;
  alt: string;
}) {
  return (
    <Image
      unoptimized
      src={imageId ? `/api/assets/${imageId}` : "/lure.svg"}
      alt={alt}
      width={240}
      height={150}
      className="lure-image"
    />
  );
}
