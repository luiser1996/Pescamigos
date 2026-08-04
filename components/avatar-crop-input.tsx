"use client";
import { ImageCropInput } from "@/components/image-crop-input";
export function AvatarCropInput({
  currentImageUrl,
  initial,
}: {
  currentImageUrl?: string;
  initial?: string;
} = {}) {
  return (
    <ImageCropInput
      name="avatar"
      label="Nueva foto"
      prefix="avatar"
      round
      required
      triggerImageUrl={currentImageUrl}
      triggerInitial={initial}
    />
  );
}
