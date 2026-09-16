"""
Create the first HappyHouse admin/owner account.

Usage:
    cd backend
    python -m scripts.create_admin
(then follow the prompts — password is never passed as a CLI arg
so it doesn't end up in shell history)
"""
import getpass
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app import models, auth


def main():
    name = input("Name: ").strip()
    email = input("Email: ").strip().lower()
    password = getpass.getpass("Password: ")
    confirm = getpass.getpass("Confirm password: ")

    if password != confirm:
        print("Passwords do not match.")
        return
    if len(password) < 8:
        print("Password must be at least 8 characters.")
        return

    db = SessionLocal()
    try:
        existing = db.query(models.User).filter(models.User.email == email).first()
        if existing:
            print(f"A user with email {email} already exists.")
            return

        user = models.User(
            name=name, email=email,
            password_hash=auth.hash_password(password),
            role="owner", is_active=True,
        )
        db.add(user)
        db.commit()
        print(f"Created owner account for {email}.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
