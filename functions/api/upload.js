import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export async function onRequestPost(context) {
  // Read request body (the uploaded image)
  const formData = await context.request.formData();
  const file = formData.get("file");

  if (!file) {
    return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
  }

  // Initialize S3 client for Cloudflare R2
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${context.env.ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: context.env.S3_ACCESS_KEY_ID,
      secretAccessKey: context.env.S3_SECRET_ACCESS_KEY,
    },
  });

  const filename = `${Date.now()}-${file.name}`;

  // Upload file buffer to R2
  await s3.send(
    new PutObjectCommand({
      Bucket: context.env.R2_BUCKET_NAME,
      Key: filename,
      Body: await file.arrayBuffer(),
      ContentType: file.type,
    })
  );

  // Return the public CDN URL to Decap CMS
  const publicUrl = `https://${context.env.R2_BUCKET_DOMAIN}/${filename}`;
  return new Response(JSON.stringify({ url: publicUrl }), {
    headers: { "Content-Type": "application/json" },
  });
}
