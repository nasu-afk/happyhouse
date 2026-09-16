from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from .. import auth, config, models, schemas
from ..database import get_db
from ..limiter import limiter

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, payload: schemas.LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()

    # Constant-shape response whether the email exists or not — don't leak
    # which part of the credential pair was wrong.
    if not user or not user.is_active or not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    token = auth.create_access_token(user.id)
    response.set_cookie(
        key=config.COOKIE_NAME,
        value=token,
        httponly=True,
        secure=config.COOKIE_SECURE,
        samesite=config.COOKIE_SAMESITE,
        max_age=int(config.ACCESS_TOKEN_EXPIRE.total_seconds()),
    )

    # CSRF cookie is deliberately NOT httpOnly — the frontend JS needs to
    # read it and echo it back as a header on mutating requests.
    csrf_token = auth.generate_csrf_token()
    response.set_cookie(
        key=config.CSRF_COOKIE_NAME,
        value=csrf_token,
        httponly=False,
        secure=config.COOKIE_SECURE,
        samesite=config.COOKIE_SAMESITE,
        max_age=int(config.ACCESS_TOKEN_EXPIRE.total_seconds()),
    )

    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(config.COOKIE_NAME)
    response.delete_cookie(config.CSRF_COOKIE_NAME)
    return {"detail": "Logged out"}


@router.get("/me")
def me(current_user: models.User = Depends(auth.get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
    }


@router.put("/change-password")
def change_password(
    payload: schemas.ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
    _csrf: None = Depends(auth.verify_csrf),
):
    if not auth.verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Current password is incorrect")

    current_user.password_hash = auth.hash_password(payload.new_password)
    db.commit()
    return {"detail": "Password changed"}
