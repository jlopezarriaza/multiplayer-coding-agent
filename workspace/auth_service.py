import bcrypt
import jwt
import datetime
import secrets

# For demonstration purposes, store this securely in a .env file or a secret management service
SECRET_KEY = secrets.token_hex(32) # Generate a random 256-bit (32-byte) hex key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def hash_password(password: str) -> str:
    """Hashes a password using bcrypt."""
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a hashed password."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict):
    """Creates a JWT access token."""
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str):
    """Decodes and validates a JWT access token."""
    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return decoded_token
    except jwt.ExpiredSignatureError:
        return {"error": "Token has expired"}
    except jwt.InvalidTokenError:
        return {"error": "Invalid token"}

if __name__ == "__main__":
    # Example Usage
    print("--- Password Hashing and Verification ---")
    password = "mysecretpassword"
    hashed = hash_password(password)
    print(f"Original Password: {password}")
    print(f"Hashed Password: {hashed}")

    print(f"Verification (correct password): {verify_password(password, hashed)}")
    print(f"Verification (incorrect password): {verify_password('wrongpassword', hashed)}")

    print("\n--- JWT Token Creation and Decoding ---")
    user_data = {"sub": "testuser", "user_id": 123}
    token = create_access_token(user_data)
    print(f"Generated Token: {token}")

    decoded = verify_access_token(token)
    print(f"Decoded Token: {decoded}")

    # Simulate an expired token (for demonstration, set ACCESS_TOKEN_EXPIRE_MINUTES to a very small number or manually create an old expiry)
    print("\n--- Simulating Expired Token ---")
    # For a real test, you'd modify the 'exp' claim or wait
    # For now, let's create a token that expires instantly for testing
    import time
    past_expire = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=1)
    expired_payload = user_data.copy()
    expired_payload.update({"exp": past_expire})
    expired_token = jwt.encode(expired_payload, SECRET_KEY, algorithm=ALGORITHM)
    print(f"Expired Token: {expired_token}")
    print(f"Decoding Expired Token: {verify_access_token(expired_token)}")

    print("\n--- Simulating Invalid Token ---")
    invalid_token = token + "malicious_change"
    print(f"Invalid Token: {invalid_token}")
    print(f"Decoding Invalid Token: {verify_access_token(invalid_token)}")
