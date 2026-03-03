from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.core import security
from app.core.database import get_db
from app.models.models import User, UserRole
from app.schemas.schemas import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_admin_user(current_user: User = Depends(get_current_active_user)):
    # ADMIN in our case can be legacy or renamed. For now, we align it with OWNER/ADMIN
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    return current_user

async def get_current_owner(current_user: User = Depends(get_current_active_user)):
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    return current_user

async def get_current_manager(current_user: User = Depends(get_current_active_user)):
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN, UserRole.BRANCH_MANAGER]:
        raise HTTPException(status_code=403, detail="Management access required")
    return current_user

def check_branch_access(user: User, branch_id: int):
    """
    Validates if a user has access to a specific branch.
    OWNER and ADMIN can access any branch.
    MANAGER and CASHIER can only access their assigned branch.
    """
    if user.role in [UserRole.OWNER, UserRole.ADMIN]:
        return True
    if user.branch_id == branch_id:
        return True
    raise HTTPException(status_code=403, detail="Access to this branch is denied")
