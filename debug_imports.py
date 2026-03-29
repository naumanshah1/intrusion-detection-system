try:
    from src.database import SessionLocal, User
    from src.auth import hash_password, create_token
    print("Imports successful")

    # Test database connection
    db = SessionLocal()
    print("Database connection successful")
    db.close()

    # Test password hashing
    hashed = hash_password("test")
    print("Password hashing successful")

    # Test token creation
    token = create_token({"sub": "test"})
    print("Token creation successful")

    print("All tests passed!")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()