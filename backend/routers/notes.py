from fastapi import APIRouter, Depends
from backend.schemas import NoteCreate
from backend.services import verify_token
from backend.database import get_db

router = APIRouter(prefix="/notes", tags=["notes"])
db = get_db()

@router.get("/")
def get_notes(uid: str = Depends(verify_token)):
    notes_ref = db.collection("notes").where("uid", "==", uid).stream()
    notes = [{"id": doc.id, **doc.to_dict()} for doc in notes_ref]
    return notes

@router.post("/")
def create_note(note: NoteCreate, uid: str = Depends(verify_token)):
    doc_ref = db.collection("notes").document()
    doc_ref.set({
        "uid": uid,
        "content": note.content
    })
    return {"message": "Note created successfully", "id": doc_ref.id}
