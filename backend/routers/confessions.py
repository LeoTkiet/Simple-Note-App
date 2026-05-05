import os
import time
from fastapi import APIRouter, Depends, HTTPException
import bcrypt
from groq import Groq
from backend.schemas import PasswordSet, PasswordVerify, ChatMessage
from backend.services import verify_token
from backend.database import get_db

router = APIRouter(prefix="/confessions", tags=["confessions"])
db = get_db()

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
    return Groq(api_key=api_key)

@router.get("/status")
def get_status(uid: str = Depends(verify_token)):
    user_ref = db.collection("confessions_config").document(uid)
    doc = user_ref.get()
    if doc.exists and doc.to_dict().get("password_hash"):
        return {"has_password": True}
    return {"has_password": False}

@router.post("/password")
def set_password(data: PasswordSet, uid: str = Depends(verify_token)):
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(data.password.encode('utf-8'), salt).decode('utf-8')
    user_ref = db.collection("confessions_config").document(uid)
    user_ref.set({"password_hash": password_hash}, merge=True)
    return {"message": "Password set successfully"}

@router.post("/verify")
def verify_password(data: PasswordVerify, uid: str = Depends(verify_token)):
    user_ref = db.collection("confessions_config").document(uid)
    doc = user_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=400, detail="Password not set")
    
    password_hash = doc.to_dict().get("password_hash")
    if not password_hash or not bcrypt.checkpw(data.password.encode('utf-8'), password_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Incorrect password")
    
    return {"message": "Password verified"}

@router.post("/reset")
def reset_password(data: PasswordSet, uid: str = Depends(verify_token)):
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(data.password.encode('utf-8'), salt).decode('utf-8')
    user_ref = db.collection("confessions_config").document(uid)
    user_ref.set({"password_hash": password_hash}, merge=True)
    
    # Delete chat history
    chat_ref = db.collection("confessions_chat").where("uid", "==", uid).stream()
    for doc in chat_ref:
        doc.reference.delete()
        
    return {"message": "Password reset and chat history cleared"}

@router.get("/chat")
def get_chat_history(uid: str = Depends(verify_token)):
    chat_ref = db.collection("confessions_chat").where("uid", "==", uid).stream()
    chats = [{"id": doc.id, **doc.to_dict()} for doc in chat_ref]
    chats.sort(key=lambda x: x.get("timestamp", 0))
    return chats

@router.post("/chat")
def chat_with_ai(data: ChatMessage, uid: str = Depends(verify_token)):
    # Fetch chat history
    chat_ref = db.collection("confessions_chat").where("uid", "==", uid).stream()
    chats = [doc.to_dict() for doc in chat_ref]
    chats.sort(key=lambda x: x.get("timestamp", 0))
    
    messages = [{"role": "system", "content": "Bạn là một người bạn tâm giao, luôn lắng nghe và thấu hiểu. Bạn chỉ nói tiếng Việt. Hãy tâm sự và đưa ra những lời khuyên chân thành."}]
    for msg in chats[-10:]: # Only take the last 10 messages to avoid exceeding the context limit
        messages.append({"role": "user", "content": msg["user_message"]})
        messages.append({"role": "assistant", "content": msg["ai_message"]})
        
    messages.append({"role": "user", "content": data.message})
    
    # Call Groq API
    client = get_groq_client()
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
            top_p=1,
            stream=False,
            stop=None,
        )
        ai_reply = completion.choices[0].message.content
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
        
    # Save to database
    db.collection("confessions_chat").add({
        "uid": uid,
        "user_message": data.message,
        "ai_message": ai_reply,
        "timestamp": time.time()
    })
    
    return {"reply": ai_reply}
