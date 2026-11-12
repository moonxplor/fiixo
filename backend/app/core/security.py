import os
import hmac
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
import jwt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

def hash_password(password: str) -> str:
    """
    Hash a plaintext password using standard library scrypt (OWASP recommended memory-hard algorithm).
    Format: scrypt${n}${r}${p}${salt_hex}${hash_hex}
    """
    salt = secrets.token_hex(16)
    n, r, p = 16384, 8, 1
    derived = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt.encode("utf-8"),
        n=n,
        r=r,
        p=p
    )
    return f"scrypt${n}${r}${p}${salt}${derived.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plaintext password against scrypt hash."""
    try:
        parts = hashed_password.split("$")
        if len(parts) != 6 or parts[0] != "scrypt":
            return False
        n = int(parts[1])
        r = int(parts[2])
        p = int(parts[3])
        salt = parts[4].encode("utf-8")
        expected_hash = bytes.fromhex(parts[5])
        
        derived = hashlib.scrypt(
            plain_password.encode("utf-8"),
            salt=salt,
            n=n,
            r=r,
            p=p
        )
        return hmac.compare_digest(derived, expected_hash)
    except Exception:
        return False

def create_access_token(
    subject: Union[str, Any],
    workspace_id: Optional[str] = None,
    role: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a short-lived JWT access token."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
    payload: Dict[str, Any] = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
        "jti": secrets.token_hex(16)
    }
    if workspace_id:
        payload["workspace_id"] = str(workspace_id)
    if role:
        payload["role"] = str(role)
        
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def create_refresh_token(subject: Union[str, Any]) -> str:
    """Create a long-lived JWT refresh token with random entropy."""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload: Dict[str, Any] = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "refresh",
        "jti": secrets.token_hex(16)
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT token."""
    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
        options={"require": ["exp", "sub", "iat"]}
    )

def _get_aes_key() -> bytes:
    key_hex = settings.ENCRYPTION_KEY
    try:
        key_bytes = bytes.fromhex(key_hex)
        if len(key_bytes) != 32:
            raise ValueError()
        return key_bytes
    except Exception:
        return hashlib.sha256(settings.SECRET_KEY.encode()).digest()

def encrypt_secret(plain_text: str) -> str:
    """Encrypt sensitive string data with AES-256-GCM. Returns nonce:ciphertext in hex."""
    key = _get_aes_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plain_text.encode("utf-8"), None)
    return f"{nonce.hex()}:{ciphertext.hex()}"

def decrypt_secret(encrypted_text: str) -> str:
    """Decrypt AES-256-GCM ciphertext formatted as nonce:ciphertext in hex."""
    parts = encrypted_text.split(":")
    if len(parts) != 2:
        raise ValueError("Invalid encrypted secret format")
    nonce = bytes.fromhex(parts[0])
    ciphertext = bytes.fromhex(parts[1])
    key = _get_aes_key()
    aesgcm = AESGCM(key)
    decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, None)
    return decrypted_bytes.decode("utf-8")
