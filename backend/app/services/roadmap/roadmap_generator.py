from typing import List, Optional
import math


def generate_roadmap(
    learning_path: List[dict],
    target_career: str,
    hours_per_week: Optional[float] = None,
) -> dict:
    """
    Generate a roadmap from the learning path.
    
    Transforms the learning path into structured phases with milestones,
    estimated hours, and next action recommendations.
    
    Args:
        learning_path: List of skill recommendations from the learning path generator
        target_career: Target career for the roadmap (e.g., "GenAI Engineer")
        hours_per_week: Optional hours per week for time estimation
        
    Returns:
        Dictionary containing the structured roadmap
    """
    phases = []
    current_phase = []
    phase_number = 1

    # Group skills into phases (3 skills per phase for V1)
    for item in learning_path:
        current_phase.append(item)
        
        if len(current_phase) >= 3:
            phases.append(
                build_phase(
                    current_phase,
                    phase_number
                )
            )
            phase_number += 1
            current_phase = []

    # Add remaining skills as final phase
    if current_phase:
        phases.append(
            build_phase(
                current_phase,
                phase_number
            )
        )

    # Calculate total estimated hours
    total_hours = sum(
        phase["estimated_hours"]
        for phase in phases
    )

    # Determine next action
    next_action = get_next_action(phases)

    # INTERVIEW: hours_per_week turns total hours into calendar time (V1 estimate); None/guarded when pace unknown so schema stays honest.
    estimated_weeks = None
    try:
        pace = float(hours_per_week) if hours_per_week else 0
        if pace > 0:
            estimated_weeks = round(total_hours / pace, 1)
    except (TypeError, ValueError):
        estimated_weeks = None

    return {
        "title": f"{target_career} Learning Roadmap",
        "target_career": target_career,
        "total_estimated_hours": total_hours,
        "estimated_weeks": estimated_weeks,
        "phases": phases,
        "next_action": next_action,
    }


def build_phase(
    skills: List[dict],
    phase_number: int
) -> dict:
    """
    Build a phase from a list of skills.
    
    Args:
        skills: List of skill dictionaries from learning path
        phase_number: Phase number for identification
        
    Returns:
        Dictionary representing a roadmap phase
    """
    estimated_hours = 0
    
    # Calculate estimated hours from resources
    for skill in skills:
        # Extract resources from skill data (handle different formats)
        resources = []
        if "resources" in skill:
            resources = skill["resources"]
        elif "resource_list" in skill:
            resources = skill["resource_list"]
            
        for resource in resources:
            # Handle different resource formats
            if isinstance(resource, dict):
                estimated_hours += resource.get("estimated_hours", 0)
            elif isinstance(resource, str):
                # Default estimate for string resources
                estimated_hours += 2.0  # 2 hours default

    # Extract skill IDs for milestone
    skill_ids = [
        skill["skill_id"] if "skill_id" in skill else skill.get("skill", "")
        for skill in skills
    ]
    
    # Filter out empty skill IDs
    skill_ids = [sid for sid in skill_ids if sid]

    return {
        "id": f"phase_{phase_number}",
        "title": f"Phase {phase_number}",
        "description": (
            "Build the skills required "
            "for the next stage of your career."
        ),
        "skills": skills,  # Keep original skill data
        "milestone": {
            "id": f"milestone_{phase_number}",
            "title": (
                f"Complete Phase {phase_number}"
            ),
            "description": (
                "Complete the recommended "
                "learning activities and projects."
            ),
            "skills": skill_ids,
        },
        "estimated_hours": estimated_hours,
    }


def get_next_action(phases: List[dict]) -> str:
    """
    Determine the next action based on the roadmap phases.
    
    Args:
        phases: List of roadmap phase dictionaries
        
    Returns:
        String describing the next action for the learner
    """
    if not phases:
        return "No learning path available yet."

    first_phase = phases[0]

    if not first_phase["skills"]:
        return "No next action available."

    first_skill = first_phase["skills"][0]
    
    # Extract skill ID from different possible formats
    skill_id = (
        first_skill.get("skill_id") or 
        first_skill.get("skill") or 
        "the first skill"
    )

    return (
        f"Start learning {skill_id}."
    )