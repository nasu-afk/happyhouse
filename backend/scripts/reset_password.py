"""
Reset an existing HappyHouse admin's password (server-access recovery
path — there's no self-service "forgot password" email flow, since that
would require SMTP infrastructure this project doesn't set up).

Usage:
    cd backend
    python -m scripts.reset_password
(password is never passed as a CLI arg so it doesn't end up in shell history)
"""
import getpass
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app import models, auth


def main():
    email = input("Email of the account to reset: ").strip().lower()

    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            print(f"No user found with email {email}.")
            return

        password = getpass.getpass("New password: ")
        confirm = getpass.getpass("Confirm new password: ")

        if password != confirm:
            print("Passwords do not match.")
            return
        if len(password) < 8:
            print("Password must be at least 8 characters.")
            return

        user.password_hash = auth.hash_password(password)
        db.commit()
        print(f"Password reset for {email}.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
