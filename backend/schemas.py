from pydantic import BaseModel

class NoteCreate(BaseModel):
    content: str

class PasswordSet(BaseModel):
    password: str

class PasswordVerify(BaseModel):
    password: str

class ChatMessage(BaseModel):
    message: str
