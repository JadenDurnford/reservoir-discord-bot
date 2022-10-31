import axios from "axios";
import { AttachmentBuilder } from "discord.js";
import sharp from "sharp";
import logger from "./logger";

export default async function handleMediaConversion(
  imageURL: string,
  name: string
): Promise<AttachmentBuilder> {
  // Collect arraybuffer
  const { data } = await axios.get(imageURL, { responseType: "arraybuffer" });

  // Convert to buffer
  const buf = Buffer.from(data, "binary");
  const webp = sharp(buf, { animated: true });
  const metadata = await webp.metadata();
  const format = metadata.pages && metadata.pages > 1 ? "gif" : "png";
  const image = await webp.toFormat(format).toBuffer();

  // Create attachment from gif buffer
  let attachment = new AttachmentBuilder(image);
  const fileName = name.replace(/\s+/g, "");
  logger.info(fileName);
  attachment.name = `${fileName}.${format}`;

  return attachment;
}
