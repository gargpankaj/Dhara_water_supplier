from datetime import UTC, datetime, timedelta
from random import randint

from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_role_by_name
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.entities import PasswordResetToken, User
from app.schemas.auth import LoginRequest, RegisterRequest
from app.utils.audit import create_audit_log
from app.utils.emailer import send_otp_email


class AuthService:
    @staticmethod
    async def register(db: AsyncSession, payload: RegisterRequest) -> dict:
        existing = await db.execute(select(User).where(User.email == payload.email).limit(1))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Email already registered")

        role = await get_role_by_name(db, payload.role_name)
        user = User(
            full_name=payload.full_name,
            email=payload.email,
            phone=payload.phone,
            password_hash=get_password_hash(payload.password),
            role_id=role.id,
        )
        db.add(user)
        await create_audit_log(db, user=None, action="auth.register", entity_type="user")
        await db.commit()
        await db.refresh(user)
        return AuthService._build_token_response(user)

    @staticmethod
    async def login(db: AsyncSession, payload: LoginRequest) -> dict:
        from sqlalchemy.orm import joinedload
        result = await db.execute(
            select(User).options(joinedload(User.role)).where(User.email == payload.email).limit(1)
        )
        user = result.scalar_one_or_none()
        if user is None or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        return AuthService._build_token_response(user)

    @staticmethod
    async def issue_reset_otp(
        db: AsyncSession, email: str, background_tasks: BackgroundTasks
    ) -> None:
        result = await db.execute(select(User).where(User.email == email).limit(1))
        user = result.scalar_one_or_none()
        if user is None:
            return

        await db.execute(delete(PasswordResetToken).where(PasswordResetToken.email == email))
        otp_code = f"{randint(0, 999999):06d}"
        reset_record = PasswordResetToken(
            email=email,
            otp_code=otp_code,
            expires_at=datetime.now(UTC) + timedelta(minutes=15),
        )
        db.add(reset_record)
        await create_audit_log(
            db, user=user, action="auth.forgot-password", entity_type="password_reset"
        )
        await db.commit()
        background_tasks.add_task(send_otp_email, email, otp_code)

    @staticmethod
    async def reset_password(db: AsyncSession, email: str, otp_code: str, new_password: str) -> None:
        result = await db.execute(
            select(PasswordResetToken)
            .where(
                PasswordResetToken.email == email,
                PasswordResetToken.otp_code == otp_code,
                PasswordResetToken.is_used.is_(False),
            )
            .limit(1)
        )
        token = result.scalar_one_or_none()
        if token is None or token.expires_at < datetime.now(UTC):
            raise HTTPException(status_code=400, detail="OTP is invalid or expired")

        user_result = await db.execute(select(User).where(User.email == email).limit(1))
        user = user_result.scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        user.password_hash = get_password_hash(new_password)
        token.is_used = True
        await create_audit_log(
            db, user=user, action="auth.reset-password", entity_type="password_reset"
        )
        await db.commit()

    @staticmethod
    def _build_token_response(user: User) -> dict:
        token = create_access_token(str(user.id))
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role.name.value if user.role else None,
            },
        }
