import crypto from "crypto";

function key() {
  const raw = process.env.VAULT_KEY || "";
  const k = Buffer.from(raw, "base64");
  if (k.length !== 32) throw new Error("VAULT_KEY harus 32 byte (base64)");
  return k;
}

// AES-256-GCM: iv.tag.data dalam base64
export function encrypt(plain) {
  if (plain == null || plain === "") return null;
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([c.update(String(plain), "utf8"), c.final()]);
  return [iv.toString("base64"), c.getAuthTag().toString("base64"), data.toString("base64")].join(".");
}

export function decrypt(enc) {
  if (!enc) return "";
  const [iv, tag, data] = enc.split(".");
  const d = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(data, "base64")), d.final()]).toString("utf8");
}
