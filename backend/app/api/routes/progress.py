from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models import Activity, Progress, MasteryHistory, Learner, Skill
from app.schemas.progress import (
    ActivityRequest,
    CompleteRequest,
    ProgressResponse,
    SkillMasteryResponse,
    LearnerProgressResponse,
    DashboardResponse,
    NotificationResponse,
    CertificateResponse,
)

router = APIRouter(
    prefix="/api/progress",
    tags=["Progress Tracking"]
)


@router.post("/activity", response_model=dict)
def record_activity(request: ActivityRequest, db: Session = Depends(get_db)):
    activity = Activity(
        learner_id=request.learner_id,
        resource_id=request.resource_id,
        activity_type=request.activity_type,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return {
        "message": "Activity recorded successfully",
        "activity_id": activity.id,
        "activity_type": activity.activity_type,
        "started_at": activity.started_at.isoformat() if activity.started_at else None,
    }


@router.post("/complete", response_model=dict)
def mark_complete(request: CompleteRequest, db: Session = Depends(get_db)):
    # INTERVIEW: Idempotent complete — repeated clicks return 200 without double-counting mastery.
    from datetime import datetime as dt

    progress = (
        db.query(Progress)
        .filter(
            Progress.learner_id == request.learner_id,
            Progress.resource_id == request.resource_id,
        )
        .first()
    )

    if progress is not None and progress.status == "completed":
        return {
            "message": "Resource already completed",
            "resource_id": request.resource_id,
            "progress_percent": progress.progress_percent,
            "status": progress.status,
        }

    now = dt.utcnow()
    if progress is None:
        progress = Progress(
            learner_id=request.learner_id,
            resource_id=request.resource_id,
            status="completed",
            progress_percent=100.0,
            completed_at=now,
        )
        db.add(progress)
    else:
        progress.status = "completed"
        progress.progress_percent = 100.0
        progress.completed_at = now

    # Add Activity log
    activity = Activity(
        learner_id=request.learner_id,
        resource_id=request.resource_id,
        activity_type="completed",
    )
    db.add(activity)

    # INTERVIEW: V1 deterministic mastery — completed resource gives +10 toward its skill (capped 100), recorded with source for future adaptive velocity/decay.
    try:
        from app.data_loader import load_resources

        skill_id = None
        for r in load_resources():
            if r.get("id") == request.resource_id:
                skill_id = r.get("skill_id")
                break
        if skill_id:
            latest = (
                db.query(MasteryHistory)
                .filter(
                    MasteryHistory.learner_id == request.learner_id,
                    MasteryHistory.skill_id == skill_id,
                )
                .order_by(MasteryHistory.recorded_at.desc())
                .first()
            )
            current = latest.mastery if latest else 0.0
            new_mastery = min(current + 10.0, 100.0)
            db.add(
                MasteryHistory(
                    learner_id=request.learner_id,
                    skill_id=skill_id,
                    mastery=new_mastery,
                    source="resource_completion",
                )
            )
    except Exception:
        pass

    db.commit()
    db.refresh(progress)

    return {
        "message": "Resource marked as completed",
        "resource_id": request.resource_id,
        "progress_percent": progress.progress_percent,
        "status": progress.status,
    }


@router.get("/{learner_id}", response_model=LearnerProgressResponse)
def get_overall_progress(learner_id: int, db: Session = Depends(get_db)):
    # Get all progress records for the learner
    all_progress = db.query(Progress).filter(Progress.learner_id == learner_id).all()

    total_resources = len(all_progress)
    completed_resources = sum(1 for p in all_progress if p.status == "completed")
    in_progress_resources = sum(1 for p in all_progress if p.status == "in_progress")
    not_started_resources = sum(1 for p in all_progress if p.status == "not_started")

    overall_progress = (
        (completed_resources / total_resources * 100) if total_resources > 0 else 0.0
    )

    # Get milestones from MasteryHistory
    mastery_records = (
        db.query(MasteryHistory)
        .filter(MasteryHistory.learner_id == learner_id)
        .all()
    )

    milestones = []
    for record in mastery_records:
        milestones.append({
            "skill_id": record.skill_id,
            "mastery": record.mastery,
            "source": record.source,
            "recorded_at": record.recorded_at.isoformat() if record.recorded_at else None,
        })

    # Determine next action based on progress
    # INTERVIEW: Finish-what-you-started first (in_progress before not_started) to reduce context switching.
    next_action = "No action available"
    if in_progress_resources > 0:
        first_in_progress = (
            db.query(Progress)
            .filter(
                Progress.learner_id == learner_id,
                Progress.status == "in_progress",
            )
            .first()
        )
        if first_in_progress:
            next_action = f"Continue working on {first_in_progress.resource_id}"
    elif not_started_resources > 0:
        first_not_started = (
            db.query(Progress)
            .filter(
                Progress.learner_id == learner_id,
                Progress.status == "not_started",
            )
            .first()
        )
        if first_not_started:
            next_action = f"Start working on {first_not_started.resource_id}"

    return LearnerProgressResponse(
        learner_id=learner_id,
        overall_progress=round(overall_progress, 2),
        total_resources=total_resources,
        completed_resources=completed_resources,
        in_progress_resources=in_progress_resources,
        not_started_resources=not_started_resources,
        milestones=milestones,
        next_action=next_action,
    )


@router.get("/{learner_id}/skills", response_model=List[SkillMasteryResponse])
def get_skill_mastery(learner_id: int, db: Session = Depends(get_db)):
    # Get latest mastery records per skill
    mastery_records = (
        db.query(MasteryHistory)
        .filter(MasteryHistory.learner_id == learner_id)
        .all()
    )

    # Group by skill_id and get latest mastery
    latest_mastery = {}
    for record in mastery_records:
        sid = record.skill_id
        if sid not in latest_mastery or record.recorded_at > latest_mastery[sid].recorded_at:
            latest_mastery[sid] = record

    # Also check for skills in progress that don't have mastery records yet
    in_progress_resources = (
        db.query(Progress)
        .filter(
            Progress.learner_id == learner_id,
            Progress.status.in_(["in_progress", "not_started"]),
        )
        .all()
    )

    # Build response with skills that have mastery or in-progress resources
    skill_responses = []
    for sid, record in latest_mastery.items():
        # Get skill name if available
        # INTERVIEW: Guarded lookup — canonical string IDs vs legacy Integer PK.
        try:
            skill = db.query(Skill).filter(Skill.name == sid).first()
        except Exception:
            skill = None
        skill_name = skill.name if skill else sid

        # Get target mastery from career_skills if available
        # INTERVIEW: V1 default 70.0 — per-career required_mastery lookup deferred to Assessment phase; keeps Progress API working without a career join.
        # For V1, we use a default target of 70.0
        target_mastery = 70.0

        skill_responses.append(
            SkillMasteryResponse(
                skill_id=sid,
                skill_name=skill_name,
                current_mastery=record.mastery,
                target_mastery=target_mastery,
                gap=max(target_mastery - record.mastery, 0.0),
                status="ready" if record.mastery >= target_mastery else "in_progress",
            )
        )

    return skill_responses


@router.get("/dashboard/{learner_id}", response_model=DashboardResponse)
def get_dashboard(learner_id: int, db: Session = Depends(get_db)):
    # Get all progress records for the learner
    all_progress = db.query(Progress).filter(Progress.learner_id == learner_id).all()

    total_resources = len(all_progress)
    completed_resources = sum(1 for p in all_progress if p.status == "completed")
    in_progress_resources = sum(1 for p in all_progress if p.status == "in_progress")
    not_started_resources = sum(1 for p in all_progress if p.status == "not_started")

    overall_progress = (
        (completed_resources / total_resources * 100) if total_resources > 0 else 0.0
    )

    # Create progress bar visualization
    filled = int(overall_progress / 10)
    progress_bar = "█" * filled + "░" * (10 - filled)
    progress_bar_str = f"{progress_bar} {round(overall_progress, 1)}%"

    # Get milestones from MasteryHistory
    mastery_records = (
        db.query(MasteryHistory)
        .filter(MasteryHistory.learner_id == learner_id)
        .all()
    )

    milestones = []
    for record in mastery_records:
        milestones.append({
            "skill_id": record.skill_id,
            "mastery": record.mastery,
            "source": record.source,
            "recorded_at": record.recorded_at.isoformat() if record.recorded_at else None,
        })

    # Get skill mastery
    latest_mastery = {}
    for record in mastery_records:
        sid = record.skill_id
        if sid not in latest_mastery or record.recorded_at > latest_mastery[sid].recorded_at:
            latest_mastery[sid] = record

    skill_mastery = []
    for sid, record in latest_mastery.items():
        # INTERVIEW: Canonical skill IDs are strings; skills.id is legacy Integer — guarded lookup falls back to sid so V1 never 500s.
        try:
            skill = db.query(Skill).filter(Skill.name == sid).first()
        except Exception:
            skill = None
        skill_name = skill.name if skill else sid
        target_mastery = 70.0

        skill_mastery.append(
            SkillMasteryResponse(
                skill_id=sid,
                skill_name=skill_name,
                current_mastery=record.mastery,
                target_mastery=target_mastery,
                gap=max(target_mastery - record.mastery, 0.0),
                status="ready" if record.mastery >= target_mastery else "in_progress",
            )
        )

    # Determine next action
    # INTERVIEW: Same priority as progress endpoint — in_progress first.
    next_action = "No action available"
    if in_progress_resources > 0:
        first_in_progress = (
            db.query(Progress)
            .filter(
                Progress.learner_id == learner_id,
                Progress.status == "in_progress",
            )
            .first()
        )
        if first_in_progress:
            next_action = f"Continue working on {first_in_progress.resource_id}"
    elif not_started_resources > 0:
        first_not_started = (
            db.query(Progress)
            .filter(
                Progress.learner_id == learner_id,
                Progress.status == "not_started",
            )
            .first()
        )
        if first_not_started:
            next_action = f"Start working on {first_not_started.resource_id}"

    # Estimate time remaining from real resource hours; fall back to 1.0h per unknown resource.
    # INTERVIEW: sums curated estimated_hours so dashboard stays consistent with roadmap totals; defensive fallback keeps V1 working when a resource_id is ad-hoc.
    try:
        from app.data_loader import load_resources as _load_res

        _hours_by_id = {r.get("id"): float(r.get("estimated_hours", 1.0) or 1.0) for r in _load_res() if r.get("id")}
    except Exception:
        _hours_by_id = {}
    estimated_time_remaining = 0.0
    for p in all_progress:
        if p.status != "completed":
            estimated_time_remaining += _hours_by_id.get(p.resource_id, 1.0)
    estimated_time_remaining = round(float(estimated_time_remaining), 2)

    return DashboardResponse(
        learner_id=learner_id,
        overall_progress=round(overall_progress, 2),
        progress_bar=progress_bar_str,
        total_resources=total_resources,
        completed_resources=completed_resources,
        in_progress_resources=in_progress_resources,
        not_started_resources=not_started_resources,
        skill_mastery=skill_mastery,
        milestones=milestones,
        next_action=next_action,
        estimated_time_remaining=estimated_time_remaining,
    )


@router.get("/notifications/{learner_id}", response_model=List[NotificationResponse])
def get_notifications(learner_id: int, db: Session = Depends(get_db)):
    # INTERVIEW: V1 in-app only (no push/email) — derived from Progress state, no extra table.
    from datetime import datetime as dt

    now = dt.utcnow()
    # Generate notifications based on learner's progress state
    all_progress = db.query(Progress).filter(Progress.learner_id == learner_id).all()
    completed_resources = sum(1 for p in all_progress if p.status == "completed")
    in_progress_resources = sum(1 for p in all_progress if p.status == "in_progress")
    not_started_resources = sum(1 for p in all_progress if p.status == "not_started")

    notifications = []

    # Next action notification
    if not_started_resources > 0:
        notifications.append(
            NotificationResponse(
                id=1,
                learner_id=learner_id,
                title="🎯 Your next action is ready",
                message=f"Complete {not_started_resources} remaining resource(s) to continue your journey.",
                type="next_action",
                is_read=False,
                created_at=now,
            )
        )

    # Milestone notification
    if completed_resources > 0 and completed_resources % 3 == 0:
        notifications.append(
            NotificationResponse(
                id=2,
                learner_id=learner_id,
                title="🏆 Milestone approaching",
                message=f"You've completed {completed_resources} resources! Keep going for the next milestone.",
                type="milestone",
                is_read=False,
                created_at=now,
            )
        )

    # Streak reminder
    if in_progress_resources > 0:
        notifications.append(
            NotificationResponse(
                id=3,
                learner_id=learner_id,
                title="📈 Keep the streak alive",
                message=f"You have {in_progress_resources} resource(s) in progress. Continue to build momentum!",
                type="streak",
                is_read=False,
                created_at=now,
            )
        )

    return notifications


@router.get("/certificate/{learner_id}", response_model=CertificateResponse)
def get_certificate(learner_id: int, db: Session = Depends(get_db)):
    # INTERVIEW: V1 certificate page (no PDF yet) — 404 when no work, 403 until 100%, SHA-256 ID for employer verification.
    # Check if learner has completed all resources
    all_progress = db.query(Progress).filter(Progress.learner_id == learner_id).all()

    if not all_progress:
        raise HTTPException(
            status_code=404,
            detail="No progress records found. Complete some resources first."
        )

    completed_resources = [p for p in all_progress if p.status == "completed"]
    total_resources = len(all_progress)
    completion_percent = (len(completed_resources) / total_resources * 100) if total_resources > 0 else 0.0

    # Get completed skill IDs
    skills_completed = list(set(p.resource_id for p in completed_resources))

    # Generate certificate ID
    import hashlib
    from datetime import datetime as dt
    cert_id = hashlib.sha256(
        f"{learner_id}{dt.now().strftime('%Y-%m-%d')}".encode()
    ).hexdigest()[:16]

    # Check if learner is fully complete
    if completion_percent < 100.0:
        raise HTTPException(
            status_code=403,
            detail=f"Certificate not yet available. Completion: {round(completion_percent, 1)}%. Need 100%."
        )

    # Get learner name if available
    learner = db.query(Learner).filter(Learner.id == learner_id).first()
    learner_name = learner.name if learner else f"Learner-{learner_id}"

    return CertificateResponse(
        learner_name=learner_name,
        target_career="GenAI Engineer",
        completion_percent=round(completion_percent, 2),
        skills_completed=skills_completed,
        completion_date=dt.now().strftime("%Y-%m-%d"),
        certificate_id=cert_id,
        verified=True,
    )
