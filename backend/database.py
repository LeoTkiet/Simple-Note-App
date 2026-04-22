import firebase_admin
from firebase_admin import credentials, firestore
import os

if not firebase_admin._apps:
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./backend/serviceAccountKey.json")
    try:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    except Exception as e:
        print(f"Warning: Firebase Admin initialization failed: {e}")

def get_db():
    return firestore.client()
