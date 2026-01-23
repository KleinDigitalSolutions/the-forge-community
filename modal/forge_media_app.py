from __future__ import annotations

import base64
import io
import os
from typing import Any, Dict, List, Optional, Tuple

import modal
import requests
from fastapi import Header, HTTPException

APP_NAME = "forge-media-studio"
MODEL_CACHE = "/models"
HF_CACHE = "/models/hf"

MODEL_ID_ENV = {
    "qwen-image-2512": "QWEN_IMAGE_MODEL_ID",
    "z-image-turbo": "Z_IMAGE_MODEL_ID",
    "glm-image": "GLM_IMAGE_MODEL_ID",
    "wan-2.2": "WAN_VIDEO_MODEL_ID",
    "mochi-1": "MOCHI_VIDEO_MODEL_ID",
}

IMAGE_MODEL_IDS = ["qwen-image-2512", "z-image-turbo", "glm-image"]
VIDEO_MODEL_IDS = ["wan-2.2", "mochi-1"]

DEFAULT_IMAGE_RES = 1024
DEFAULT_VIDEO_RES = 720

ASPECT_RES = {
    "1:1": (1024, 1024),
    "4:5": (896, 1120),
    "9:16": (768, 1365),
    "16:9": (1280, 720),
    "3:2": (1152, 768),
}

app = modal.App(APP_NAME)

volume = modal.Volume.from_name("forge-media-models", create_if_missing=True)

image = (
    modal.Image.debian_slim()
    .pip_install(
        "torch",
        "diffusers",
        "transformers",
        "accelerate",
        "safetensors",
        "pillow",
        "requests",
        "imageio",
        "imageio-ffmpeg",
        "fastapi",
    )
    .env({"HF_HOME": HF_CACHE})
)

secrets = [modal.Secret.from_name("TheForge")]

API_TOKEN = os.environ.get("MODAL_API_KEY")
if os.environ.get("HF_TOKEN") and not os.environ.get("HUGGINGFACE_HUB_TOKEN"):
    os.environ["HUGGINGFACE_HUB_TOKEN"] = os.environ["HF_TOKEN"]

IMAGE_PIPES: Dict[str, Any] = {}
VIDEO_PIPES: Dict[str, Any] = {}


def _require_token(authorization: Optional[str]) -> None:
    if not API_TOKEN:
        return
    if not authorization or authorization.strip() != f"Bearer {API_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")


def _resolve_model_id(model_key: str) -> str:
    env_key = MODEL_ID_ENV.get(model_key)
    model_id = os.environ.get(env_key, "") if env_key else ""
    if not model_id:
        raise HTTPException(status_code=400, detail=f"Model not configured: {model_key}")
    return model_id


def _resolve_dimensions(aspect_ratio: str, base: int) -> Tuple[int, int]:
    if aspect_ratio in ASPECT_RES:
        return ASPECT_RES[aspect_ratio]
    return (base, base)


def _fetch_image(url: str):
    from PIL import Image

    response = requests.get(url, timeout=60)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to download reference image")
    image = Image.open(io.BytesIO(response.content)).convert("RGB")
    return image


def _encode_image(image: Any) -> str:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def _encode_video(frames: List[Any], fps: int) -> str:
    from diffusers.utils import export_to_video

    video_path = export_to_video(frames, fps=fps)
    with open(video_path, "rb") as handle:
        data = handle.read()
    return base64.b64encode(data).decode("utf-8")


def _load_text_to_image(model_key: str):
    if model_key in IMAGE_PIPES:
        return IMAGE_PIPES[model_key]
    model_id = _resolve_model_id(model_key)
    from diffusers import AutoPipelineForText2Image
    import torch

    pipe = AutoPipelineForText2Image.from_pretrained(
        model_id,
        torch_dtype=torch.float16,
        cache_dir=HF_CACHE,
    )
    pipe = pipe.to("cuda")
    pipe.enable_attention_slicing()
    IMAGE_PIPES[model_key] = pipe
    return pipe


def _load_image_to_image(model_key: str):
    if model_key in IMAGE_PIPES:
        return IMAGE_PIPES[model_key]
    model_id = _resolve_model_id(model_key)
    from diffusers import AutoPipelineForImage2Image
    import torch

    pipe = AutoPipelineForImage2Image.from_pretrained(
        model_id,
        torch_dtype=torch.float16,
        cache_dir=HF_CACHE,
    )
    pipe = pipe.to("cuda")
    pipe.enable_attention_slicing()
    IMAGE_PIPES[model_key] = pipe
    return pipe


def _load_video_pipeline(model_key: str):
    if model_key in VIDEO_PIPES:
        return VIDEO_PIPES[model_key]
    model_id = _resolve_model_id(model_key)
    from diffusers import DiffusionPipeline
    import torch

    pipe = DiffusionPipeline.from_pretrained(
        model_id,
        torch_dtype=torch.float16,
        cache_dir=HF_CACHE,
    )
    pipe = pipe.to("cuda")
    pipe.enable_attention_slicing()
    VIDEO_PIPES[model_key] = pipe
    return pipe


def _generate_images(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    import torch

    mode = payload.get("mode", "text-to-image")
    model_key = payload.get("model", "qwen-image-2512")
    prompt = payload.get("prompt", "")
    negative_prompt = payload.get("negativePrompt")
    steps = int(payload.get("steps", 30))
    guidance = float(payload.get("guidance", 7.5))
    variants = int(payload.get("variants", 1))
    seed = payload.get("seed")
    aspect_ratio = payload.get("aspectRatio", "1:1")
    strength = float(payload.get("strength", 0.6))

    width, height = _resolve_dimensions(aspect_ratio, DEFAULT_IMAGE_RES)

    generator = None
    if seed:
        generator = torch.Generator(device="cuda").manual_seed(int(seed))

    if mode == "image-to-image":
        init_url = payload.get("imageUrl")
        if not init_url:
            raise HTTPException(status_code=400, detail="Missing imageUrl")
        init_image = _fetch_image(init_url)
        pipe = _load_image_to_image(model_key)
        result = pipe(
            prompt,
            image=init_image,
            strength=strength,
            num_inference_steps=steps,
            guidance_scale=guidance,
            num_images_per_prompt=variants,
            negative_prompt=negative_prompt or None,
            generator=generator,
        )
        images = result.images
    else:
        pipe = _load_text_to_image(model_key)
        result = pipe(
            prompt,
            num_inference_steps=steps,
            guidance_scale=guidance,
            num_images_per_prompt=variants,
            negative_prompt=negative_prompt or None,
            width=width,
            height=height,
            generator=generator,
        )
        images = result.images

    assets = []
    for image in images:
        assets.append({
            "type": "image",
            "contentType": "image/png",
            "data": _encode_image(image),
        })
    return assets


def _generate_videos(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    import torch

    mode = payload.get("mode", "text-to-video")
    model_key = payload.get("model", "wan-2.2")
    prompt = payload.get("prompt", "")
    negative_prompt = payload.get("negativePrompt")
    steps = int(payload.get("steps", 30))
    guidance = float(payload.get("guidance", 7.5))
    aspect_ratio = payload.get("aspectRatio", "16:9")
    duration = int(payload.get("duration", 4))
    fps = int(payload.get("fps", 24))
    seed = payload.get("seed")

    width, height = _resolve_dimensions(aspect_ratio, DEFAULT_VIDEO_RES)
    num_frames = max(12, duration * fps)

    generator = None
    if seed:
        generator = torch.Generator(device="cuda").manual_seed(int(seed))

    pipe = _load_video_pipeline(model_key)

    if mode == "image-to-video":
        init_url = payload.get("imageUrl")
        if not init_url:
            raise HTTPException(status_code=400, detail="Missing imageUrl")
        init_image = _fetch_image(init_url)
        result = pipe(
            prompt,
            image=init_image,
            num_frames=num_frames,
            num_inference_steps=steps,
            guidance_scale=guidance,
            negative_prompt=negative_prompt or None,
            width=width,
            height=height,
            generator=generator,
        )
    else:
        result = pipe(
            prompt,
            num_frames=num_frames,
            num_inference_steps=steps,
            guidance_scale=guidance,
            negative_prompt=negative_prompt or None,
            width=width,
            height=height,
            generator=generator,
        )

    frames = None
    if hasattr(result, "frames") and result.frames:
        frames = result.frames[0] if isinstance(result.frames, list) else result.frames
    elif hasattr(result, "images") and result.images:
        frames = result.images

    if not frames:
        raise HTTPException(status_code=500, detail="Video generation failed")

    data = _encode_video(frames, fps)
    return [{
        "type": "video",
        "contentType": "video/mp4",
        "data": data,
    }]


@app.function(
    image=image,
    gpu="A10G",
    timeout=600,
    volumes={MODEL_CACHE: volume},
    secrets=secrets,
    min_containers=0,
)
@modal.fastapi_endpoint(method="POST")
def generate_image(payload: Dict[str, Any], authorization: Optional[str] = Header(None)):
    _require_token(authorization)
    if payload.get("model") not in IMAGE_MODEL_IDS:
        raise HTTPException(status_code=400, detail="Unsupported image model")
    assets = _generate_images(payload)
    return {"assets": assets}


@app.function(
    image=image,
    gpu="A100-40GB",
    timeout=900,
    volumes={MODEL_CACHE: volume},
    secrets=secrets,
    min_containers=0,
)
@modal.fastapi_endpoint(method="POST")
def generate_video(payload: Dict[str, Any], authorization: Optional[str] = Header(None)):
    _require_token(authorization)
    if payload.get("model") not in VIDEO_MODEL_IDS:
        raise HTTPException(status_code=400, detail="Unsupported video model")
    assets = _generate_videos(payload)
    return {"assets": assets}
