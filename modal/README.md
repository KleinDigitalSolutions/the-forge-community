# Forge Media Modal Deployment

This app deploys two Modal endpoints for the Marketing Studio:
- `generate_image` (A10G): text-to-image + image-to-image
- `generate_video` (A100/H100): text-to-video + image-to-video

The endpoints return base64 assets so the Next.js API can upload results to Vercel Blob.

## 1) Create Modal secret
Create a single Modal secret named `TheForge` that includes:

- `HF_TOKEN` (Hugging Face token; will also be used as `HUGGINGFACE_HUB_TOKEN`)
- `MODAL_API_KEY` (shared with Next.js `MODAL_API_KEY`)
- `QWEN_IMAGE_MODEL_ID` (e.g. `Qwen/Qwen-Image-2512`)
- `Z_IMAGE_MODEL_ID` (e.g. `Tongyi-MAI/Z-Image-Turbo`)
- `GLM_IMAGE_MODEL_ID` (optional)
- `WAN_VIDEO_MODEL_ID` (e.g. `Wan-AI/Wan2.2-I2V-A14B`)
- `MOCHI_VIDEO_MODEL_ID` (e.g. `genmo/mochi-1-preview`)

Example:
```
modal secret create TheForge \
  HF_TOKEN=... \
  MODAL_API_KEY=... \
  QWEN_IMAGE_MODEL_ID=... \
  Z_IMAGE_MODEL_ID=... \
  GLM_IMAGE_MODEL_ID=... \
  WAN_VIDEO_MODEL_ID=... \
  MOCHI_VIDEO_MODEL_ID=...
```

## 2) Deploy
```
modal deploy modal/forge_media_app.py
```

Modal will print two public URLs:
- `.../generate_image`
- `.../generate_video`

## 3) Wire env vars in Next.js
Set these in `.env.local` / production env:

```
MODAL_API_KEY=... (same as secret)
MODAL_MEDIA_TEXT_TO_IMAGE_URL=https://.../generate_image
MODAL_MEDIA_IMAGE_TO_IMAGE_URL=https://.../generate_image
MODAL_MEDIA_TEXT_TO_VIDEO_URL=https://.../generate_video
MODAL_MEDIA_IMAGE_TO_VIDEO_URL=https://.../generate_video
```

Optional credit tuning:
```
MARKETING_MEDIA_CREDITS_T2I=15
MARKETING_MEDIA_CREDITS_I2I=20
MARKETING_MEDIA_CREDITS_T2V=60
MARKETING_MEDIA_CREDITS_I2V=70
```

## Notes
- Modal scales to zero by default (no GPU cost while idle).
- Models are cached to a Modal volume to reduce cold-start downloads.
- If a model requires a custom pipeline, adjust the `DiffusionPipeline` loader.
