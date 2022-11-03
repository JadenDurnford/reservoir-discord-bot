import axios from "axios";
import { AttachmentBuilder } from "discord.js";
import sharp from "sharp";

/**
 *
 * @param {string} imageURL URL of webp image to convert
 * @param {string} name Name of collection
 * @returns {AttachmentBuilder} attachment
 */
export default async function handleMediaConversion(
  imageURL: string,
  name: string
): Promise<AttachmentBuilder> {
  // Collect arraybuffer
  const { data } = await axios.get(imageURL, { responseType: "arraybuffer" });

  // Convert to buffer
  const buffer = Buffer.from(data, "binary");

  // Convert first frame to png buffer
  const image = await sharp(buffer).toFormat("png").toBuffer();

  // Create attachment from png buffer
  let attachment = new AttachmentBuilder(image);

  // Set fileName to collection name
  let fileName = name.replace(/[^\w\s\']|_/g, "");
  fileName = fileName.replace(/\s+/g, "");
  attachment.name = `${fileName}.${"png"}`;

  return attachment;
}
