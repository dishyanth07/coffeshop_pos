from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core import security, database
from app.models.models import User
from app.schemas.schemas import Token, UserCreate, UserPasswordChange, TokenData
from app.api import deps
import os

import logging

logger = logging.getLogger("uvicorn.error")

router = APIRouter()

@router.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    logger.info(f"DEBUG: Login attempt for user: {form_data.username}")
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user:
        logger.info(f"DEBUG: User {form_data.username} not found in database.")
    elif not security.verify_password(form_data.password, user.password_hash):
        logger.info(f"DEBUG: Invalid password for user {form_data.username}.")
    else:
        logger.info(f"DEBUG: Successful login for user {form_data.username}.")

    if not user or not security.verify_password(form_data.password, user.password_hash): 
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES) # Changed from ACCESS_TOKEN_EXPIRE_MINUTES to security.ACCESS_TOKEN_EXPIRE_MINUTES to match existing imports
    access_token = security.create_access_token(
        data={
            "sub": user.username, 
            "role": user.role.value, 
            "branch_id": user.branch_id, 
            "id": user.id,
            "require_password_change": user.require_password_change
        },
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role.value}

@router.post("/register", response_model=Token)
async def register(user: UserCreate, db: Session = Depends(database.get_db)):
    # Check if user exists
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = security.get_password_hash(user.password)
    new_user = User(
        username=user.username, 
        password_hash=hashed_password, 
        role=user.role,
        branch_id=user.branch_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={
            "sub": new_user.username, 
            "role": new_user.role.value, 
            "branch_id": new_user.branch_id, 
            "id": new_user.id,
            "require_password_change": new_user.require_password_change
        },
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": new_user.role.value}

@router.post("/change-password")
async def change_password(
    data: UserPasswordChange,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    if not security.verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    current_user.password_hash = security.get_password_hash(data.new_password)
    current_user.require_password_change = False
    db.commit()
    return {"message": "Password changed successfully"}

    return {"access_token": access_token, "token_type": "bearer"}
