from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, EmailStr
from core.database import get_db
from models.db_models import User
import bcrypt
import logging

logger = logging.getLogger("auth")
router = APIRouter()

# Pydantic schemas
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class OAuthUserIn(BaseModel):
    name: str
    email: EmailStr

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True

# Helper functions using standard bcrypt directly (bypassing passlib bugs)
def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        plain_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception as e:
        logger.error(f"Password verification failed: {e}")
        return False

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    email_lower = user_in.email.lower().strip()
    
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == email_lower))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address is already registered."
        )
    
    # Hash password and create User
    hashed_pwd = hash_password(user_in.password)
    new_user = User(
        name=user_in.name.strip(),
        email=email_lower,
        hashed_password=hashed_pwd
    )
    
    db.add(new_user)
    try:
        await db.commit()
        await db.refresh(new_user)
        logger.info(f"Successfully registered new user: {new_user.email}")
        return new_user
    except Exception as e:
        await db.rollback()
        logger.error(f"Error registering user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database write failed during registration."
        )

@router.post("/login", response_model=UserResponse)
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    email_lower = user_in.email.lower().strip()
    
    # Find user by email
    result = await db.execute(select(User).where(User.email == email_lower))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email address or password."
        )
    
    # Verify password hash
    if not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email address or password."
        )
    
    logger.info(f"User authenticated successfully: {user.email}")
    return user

@router.post("/oauth-sync", response_model=UserResponse)
async def oauth_sync(user_in: OAuthUserIn, db: AsyncSession = Depends(get_db)):
    email_lower = user_in.email.lower().strip()
    
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == email_lower))
    user = result.scalars().first()
    
    if not user:
        # Create user with a dummy hashed password
        # Since they authenticate via Google/OAuth, they don't have a password
        new_user = User(
            name=user_in.name.strip(),
            email=email_lower,
            hashed_password="oauth_managed_account_no_password"
        )
        db.add(new_user)
        try:
            await db.commit()
            await db.refresh(new_user)
            logger.info(f"Created new OAuth user: {new_user.email}")
            return new_user
        except Exception as e:
            await db.rollback()
            logger.error(f"Error creating OAuth user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database write failed during OAuth registration."
            )
    
    return user
