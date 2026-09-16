"""
HappyHouse backend entrypoint.

Run (dev):  uvicorn app.main:app --reload --port 8000
"""
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from . import config
from .limiter import limiter
from .routers import auth_router, properties, admin_properties, enquiries, settings, property_csv, uploads

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("happyhouse")

app = FastAPI(
    title="HappyHouse API",
    description="Property consultancy & property management API for HappyHouse (Thane).",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)


# Never leak stack traces to the client (spec §37, §41).
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.include_router(auth_router.router)
app.include_router(properties.router)
app.include_router(admin_properties.router)
app.include_router(enquiries.router)
app.include_router(settings.router)
app.include_router(property_csv.router)
app.include_router(uploads.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
