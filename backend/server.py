from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import logging
import uuid
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta

import openpyxl
from seed_questions import SEED_QUESTIONS


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
SESSION_TIMEOUT_MINUTES = int(os.environ.get("SESSION_TIMEOUT_MINUTES", "15"))
ACTIVE_SESSION_KEY = "global"

app = FastAPI(title="QuizSpark API")
api_router = APIRouter(prefix="/api")


# ---------------- Models ----------------
class QuestionPublic(BaseModel):
    id: str
    question_id: str
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str


class SignInRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    email: EmailStr
    department: Optional[str] = None
    language: Optional[str] = "en-US"


class SignInResponse(BaseModel):
    participant_id: str
    questions: List[QuestionPublic]
    session_expires_at: str


class Answer(BaseModel):
    question_id: str
    selected_option: str


class SubmitRequest(BaseModel):
    participant_id: str
    answers: List[Answer]


class ReviewItem(BaseModel):
    question_id: str
    question_text: str
    options: dict
    user_answer: Optional[str]
    correct_answer: str
    is_correct: bool
    explanation: str


class SubmitResponse(BaseModel):
    score: int
    total: int
    review: List[ReviewItem]


class SessionStatus(BaseModel):
    active: bool
    remaining_seconds: int = 0
    participant_name: Optional[str] = None


class AdminLoginRequest(BaseModel):
    password: str


class ParticipantView(BaseModel):
    id: str
    name: str
    email: str
    department: Optional[str] = None
    language: Optional[str] = None
    sign_in_timestamp: str
    completion_timestamp: Optional[str] = None
    score: Optional[int] = None
    total: Optional[int] = None
    status: str


# ---------------- Helpers ----------------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.isoformat()


async def get_active_session():
    return await db.active_session.find_one({"_id": ACTIVE_SESSION_KEY})


async def is_session_active():
    session = await get_active_session()
    if not session:
        return False, None
    expires_at = datetime.fromisoformat(session["expires_at"])
    if expires_at < now_utc():
        await db.active_session.delete_one({"_id": ACTIVE_SESSION_KEY})
        if session.get("participant_id"):
            await db.participants.update_one(
                {"id": session["participant_id"], "status": "in_progress"},
                {"$set": {"status": "abandoned"}},
            )
        return False, None
    return True, session


async def create_session(participant_id: str, participant_name: str):
    expires_at = now_utc() + timedelta(minutes=SESSION_TIMEOUT_MINUTES)
    await db.active_session.replace_one(
        {"_id": ACTIVE_SESSION_KEY},
        {
            "_id": ACTIVE_SESSION_KEY,
            "participant_id": participant_id,
            "participant_name": participant_name,
            "started_at": iso(now_utc()),
            "expires_at": iso(expires_at),
        },
        upsert=True,
    )
    return expires_at


async def release_session():
    await db.active_session.delete_one({"_id": ACTIVE_SESSION_KEY})


def verify_admin(x_admin_password: Optional[str]):
    if not x_admin_password or x_admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin password")


# ---------------- Seeding ----------------
async def seed_questions_if_empty():
    count = await db.questions.count_documents({})
    if count > 0:
        return
    docs = []
    for i, q in enumerate(SEED_QUESTIONS, start=1):
        qt, a, b, c, d, correct, expl = q
        docs.append({
            "id": str(uuid.uuid4()),
            "question_id": f"Q{i:03d}",
            "question_text": qt,
            "option_a": a,
            "option_b": b,
            "option_c": c,
            "option_d": d,
            "correct_option": correct,
            "explanation": expl,
        })
    if docs:
        await db.questions.insert_many(docs)
        logging.info(f"Seeded {len(docs)} questions.")


# ---------------- Routes ----------------
@api_router.get("/")
async def root():
    return {"message": "QuizSpark API", "status": "ok"}


@api_router.get("/session/status", response_model=SessionStatus)
async def session_status():
    active, session = await is_session_active()
    if not active:
        return SessionStatus(active=False)
    expires_at = datetime.fromisoformat(session["expires_at"])
    remaining = int((expires_at - now_utc()).total_seconds())
    return SessionStatus(
        active=True,
        remaining_seconds=max(0, remaining),
        participant_name=session.get("participant_name"),
    )


@api_router.post("/signin", response_model=SignInResponse)
async def signin(payload: SignInRequest):
    active, session = await is_session_active()
    if active:
        raise HTTPException(
            status_code=423,
            detail={
                "message": "A quiz is currently in progress. Please wait.",
                "participant_name": session.get("participant_name"),
            },
        )

    total_q = await db.questions.count_documents({})
    if total_q < 5:
        raise HTTPException(status_code=500, detail="Not enough questions in the bank (need at least 5).")

    pipeline = [{"$sample": {"size": 5}}, {"$project": {"_id": 0}}]
    cursor = db.questions.aggregate(pipeline)
    questions = await cursor.to_list(length=5)

    participant_id = str(uuid.uuid4())
    participant_doc = {
        "id": participant_id,
        "name": payload.name.strip(),
        "email": payload.email.lower().strip(),
        "department": (payload.department or "").strip() or None,
        "language": payload.language or "en-US",
        "sign_in_timestamp": iso(now_utc()),
        "completion_timestamp": None,
        "score": None,
        "total": 5,
        "question_ids_served": [q["id"] for q in questions],
        "answers": None,
        "status": "in_progress",
    }
    await db.participants.insert_one(participant_doc)
    expires_at = await create_session(participant_id, payload.name.strip())

    public_questions = [
        QuestionPublic(
            id=q["id"],
            question_id=q["question_id"],
            question_text=q["question_text"],
            option_a=q["option_a"],
            option_b=q["option_b"],
            option_c=q["option_c"],
            option_d=q["option_d"],
        )
        for q in questions
    ]
    return SignInResponse(
        participant_id=participant_id,
        questions=public_questions,
        session_expires_at=iso(expires_at),
    )


@api_router.post("/submit", response_model=SubmitResponse)
async def submit(payload: SubmitRequest):
    participant = await db.participants.find_one({"id": payload.participant_id}, {"_id": 0})
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    if participant.get("status") == "completed":
        raise HTTPException(status_code=400, detail="Quiz already submitted")

    served_ids = participant.get("question_ids_served", [])
    q_cursor = db.questions.find({"id": {"$in": served_ids}}, {"_id": 0})
    all_q = await q_cursor.to_list(length=len(served_ids))
    q_by_id = {q["id"]: q for q in all_q}

    answer_by_id = {a.question_id: a.selected_option.upper() for a in payload.answers}

    score = 0
    review = []
    for qid in served_ids:
        q = q_by_id.get(qid)
        if not q:
            continue
        user_ans = answer_by_id.get(qid)
        correct = q["correct_option"].upper()
        is_correct = user_ans == correct
        if is_correct:
            score += 1
        review.append(ReviewItem(
            question_id=q["question_id"],
            question_text=q["question_text"],
            options={
                "A": q["option_a"],
                "B": q["option_b"],
                "C": q["option_c"],
                "D": q["option_d"],
            },
            user_answer=user_ans,
            correct_answer=correct,
            is_correct=is_correct,
            explanation=q["explanation"],
        ))

    completion_ts = iso(now_utc())
    await db.participants.update_one(
        {"id": payload.participant_id},
        {"$set": {
            "score": score,
            "completion_timestamp": completion_ts,
            "answers": [a.model_dump() for a in payload.answers],
            "status": "completed",
        }},
    )
    await release_session()

    return SubmitResponse(score=score, total=len(served_ids), review=review)


@api_router.post("/session/close")
async def close_session(participant_id: Optional[str] = None):
    if participant_id:
        participant = await db.participants.find_one({"id": participant_id}, {"_id": 0})
        if participant and participant.get("status") == "in_progress":
            await db.participants.update_one(
                {"id": participant_id},
                {"$set": {"status": "abandoned"}},
            )
    await release_session()
    return {"released": True}


# ---------------- Admin ----------------
@api_router.post("/admin/login")
async def admin_login(payload: AdminLoginRequest):
    if payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid password")
    return {"ok": True}


@api_router.get("/admin/participants", response_model=List[ParticipantView])
async def admin_participants(x_admin_password: Optional[str] = Header(None)):
    verify_admin(x_admin_password)
    cursor = db.participants.find({}, {"_id": 0}).sort("sign_in_timestamp", -1)
    docs = await cursor.to_list(length=1000)
    result = []
    for d in docs:
        result.append(ParticipantView(
            id=d["id"],
            name=d["name"],
            email=d["email"],
            department=d.get("department"),
            language=d.get("language"),
            sign_in_timestamp=d["sign_in_timestamp"],
            completion_timestamp=d.get("completion_timestamp"),
            score=d.get("score"),
            total=d.get("total", 5),
            status=d.get("status", "in_progress"),
        ))
    return result


@api_router.get("/admin/stats")
async def admin_stats(x_admin_password: Optional[str] = Header(None)):
    verify_admin(x_admin_password)
    total_p = await db.participants.count_documents({})
    completed = await db.participants.count_documents({"status": "completed"})
    in_progress = await db.participants.count_documents({"status": "in_progress"})
    total_q = await db.questions.count_documents({})

    pipeline = [
        {"$match": {"status": "completed", "score": {"$ne": None}}},
        {"$group": {"_id": None, "avg": {"$avg": "$score"}}},
    ]
    avg = 0
    async for r in db.participants.aggregate(pipeline):
        avg = round(r["avg"], 2)
    return {
        "total_participants": total_p,
        "completed": completed,
        "in_progress": in_progress,
        "total_questions": total_q,
        "avg_score": avg,
    }


@api_router.post("/admin/questions/upload")
async def upload_questions(
    file: UploadFile = File(...),
    x_admin_password: Optional[str] = Header(None),
):
    verify_admin(x_admin_password)
    if not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="File must be .xlsx or .xls")
    contents = await file.read()
    try:
        wb = openpyxl.load_workbook(io.BytesIO(contents), data_only=True)
        ws = wb.active
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse Excel: {e}")

    rows = list(ws.iter_rows(values_only=True))
    if len(rows) < 2:
        raise HTTPException(status_code=400, detail="Excel file has no data rows")

    header = [str(c).strip().lower() if c is not None else "" for c in rows[0]]

    def col(name_variants):
        for i, h in enumerate(header):
            for v in name_variants:
                if v in h:
                    return i
        return -1

    idx_qid = col(["question id", "id"])
    idx_qt = col(["question text", "question"])
    idx_a = col(["option a", "a"])
    idx_b = col(["option b", "b"])
    idx_c = col(["option c", "c"])
    idx_d = col(["option d", "d"])
    idx_correct = col(["correct option", "correct"])
    idx_expl = col(["summary", "explanation"])

    required = [idx_qt, idx_a, idx_b, idx_c, idx_d, idx_correct]
    if any(i < 0 for i in required):
        raise HTTPException(
            status_code=400,
            detail="Missing required columns: Question Text, Option A-D, Correct Option",
        )

    new_docs = []
    for r_i, row in enumerate(rows[1:], start=2):
        if not row or all(c is None or str(c).strip() == "" for c in row):
            continue
        try:
            qid = str(row[idx_qid]).strip() if idx_qid >= 0 and row[idx_qid] is not None else f"Q{r_i:03d}"
            qt = str(row[idx_qt]).strip()
            a = str(row[idx_a]).strip()
            b = str(row[idx_b]).strip()
            c = str(row[idx_c]).strip()
            d = str(row[idx_d]).strip()
            correct = str(row[idx_correct]).strip().upper()
            if correct not in ("A", "B", "C", "D"):
                continue
            expl = str(row[idx_expl]).strip() if idx_expl >= 0 and row[idx_expl] is not None else ""
            new_docs.append({
                "id": str(uuid.uuid4()),
                "question_id": qid,
                "question_text": qt,
                "option_a": a,
                "option_b": b,
                "option_c": c,
                "option_d": d,
                "correct_option": correct,
                "explanation": expl,
            })
        except Exception:
            continue

    if len(new_docs) < 5:
        raise HTTPException(status_code=400, detail=f"Need at least 5 valid rows; got {len(new_docs)}")

    await db.questions.delete_many({})
    await db.questions.insert_many(new_docs)
    return {"inserted": len(new_docs)}


@api_router.get("/admin/questions/count")
async def questions_count(x_admin_password: Optional[str] = Header(None)):
    verify_admin(x_admin_password)
    total = await db.questions.count_documents({})
    return {"count": total}


@api_router.post("/admin/session/force-release")
async def admin_force_release(x_admin_password: Optional[str] = Header(None)):
    verify_admin(x_admin_password)
    session = await get_active_session()
    if session and session.get("participant_id"):
        await db.participants.update_one(
            {"id": session["participant_id"], "status": "in_progress"},
            {"$set": {"status": "abandoned"}},
        )
    await release_session()
    return {"released": True}


# ---------------- App wiring ----------------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def on_startup():
    await seed_questions_if_empty()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
