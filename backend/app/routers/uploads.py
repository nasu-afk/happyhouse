import time

import cloudinary
import cloudinary.utils
from fastapi import APIRouter, Depends, HTTPException

from .. import auth, config, models

router = APIRouter(prefix="/api/admin/uploads", tags=["admin-uploads"])

UPLOAD_FOLDER = "happyhouse/properties"


def _cloudinary_configured() -> bool:
    return bool(config.CLOUDINARY_CLOUD_NAME and config.CLOUDINARY_API_KEY and config.CLOUDINARY_API_SECRET)


@router.post("/sign")
def sign_upload(_user: models.User = Depends(auth.get_current_user), _csrf: None = Depends(auth.verify_csrf)):
    """
    Returns a signed set of params the browser can POST directly to
    Cloudinary's upload API. The signature is derived from the API
    secret server-side and expires with the timestamp — the secret
    itself never reaches the browser.
    """
    if not _cloudinary_configured():
        raise HTTPException(
            400,
            "Image storage isn't configured yet. Set CLOUDINARY_CLOUD_NAME, "
            "CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env "
            "(or your Docker Compose .env) and restart the backend. "
            "You can still paste image URLs directly in the meantime.",
        )

    cloudinary.config(
        cloud_name=config.CLOUDINARY_CLOUD_NAME,
        api_key=config.CLOUDINARY_API_KEY,
        api_secret=config.CLOUDINARY_API_SECRET,
    )

    timestamp = int(time.time())
    params_to_sign = {"timestamp": timestamp, "folder": UPLOAD_FOLDER}
    signature = cloudinary.utils.api_sign_request(params_to_sign, config.CLOUDINARY_API_SECRET)

    return {
        "timestamp": timestamp,
        "signature": signature,
        "api_key": config.CLOUDINARY_API_KEY,
        "cloud_name": config.CLOUDINARY_CLOUD_NAME,
        "folder": UPLOAD_FOLDER,
        "max_size_mb": config.MAX_IMAGE_SIZE_MB,
    }
