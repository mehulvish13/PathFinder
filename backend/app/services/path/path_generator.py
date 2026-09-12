from typing import Dict, List, Optional

# INTERVIEW: import matcher here (not LLM) — keeps path deterministic and explainable
try:
    from app.services.resources.resource_matcher import recommend_resources
except ImportError:
    recommend_resources = None  # type: ignore

IMPORTANCE_WEIGHT = {
    "critical": 1.0,
    "high": 0.85,
    "medium": 0.65,
    "low": 0.40
}


def calculate_skill_gaps(
    current_skills: Dict[str, float],
    career_requirements: List[dict]
) -> List[dict]:
    gaps = []

    for requirement in career_requirements:
        skill_id = requirement["skill_id"]
        required_mastery = requirement["required_mastery"]
        importance = requirement.get("importance", "medium")

        current_mastery = current_skills.get(skill_id, 0)

        gap = max(required_mastery - current_mastery, 0)

        if gap > 0:
            importance_weight = IMPORTANCE_WEIGHT.get(
                importance,
                IMPORTANCE_WEIGHT["medium"]
            )

            priority_score = gap * importance_weight

            gaps.append({
                "skill_id": skill_id,
                "current_mastery": current_mastery,
                "required_mastery": required_mastery,
                "gap": gap,
                "importance": importance,
                "priority_score": round(priority_score, 2)
            })

    gaps.sort(
        key=lambda item: item["priority_score"],
        reverse=True
    )

    return gaps


def generate_learning_path(
    recommendations: List[dict],
    prerequisites: Optional[List[dict]] = None,
    resources: Optional[List[dict]] = None,
    learner_level: str = "beginner",
    learning_preference: Optional[str] = None,
    max_hours: Optional[float] = None,
    resource_limit: int = 3,
) -> Dict[str, List[str]]:
    """
    Generate a personalized learning path from skill recommendations.

    This function takes skill recommendations (from the recommendation engine)
    and creates a sequential learning path that respects prerequisite
    dependencies, ensuring learners build knowledge in the correct order.

    Args:
        recommendations: List of skill recommendations from recommend_skills
        prerequisites: List of prerequisite relationships between skills
        resources: Curated resources list (from load_resources) — matched per skill
        learner_level: beginner|intermediate|advanced for difficulty fit
        learning_preference: project|theory|mixed for type fit
        max_hours: time fit filter for resources
        resource_limit: top-N resources per skill

    Returns:
        Dictionary containing the personalized learning path with stages/phases
    """
    # Build a prerequisite map for quick lookup
    prereq_map = {}
    if prerequisites:
        for prereq in prerequisites:
            target = prereq.get("target_skill", prereq.get("skill", ""))
            source = prereq.get("source_skill", prereq.get("prerequisite", ""))
            if target not in prereq_map:
                prereq_map[target] = []
            prereq_map[target].append(source)
    
    # Build the learning path by resolving prerequisites in order
    path = []
    learned_skills = set()
    
    # Process recommendations in priority order (support priority_score legacy)
    for recommendation in sorted(
        recommendations,
        key=lambda x: x.get("priority", x.get("priority_score", 0)),
        reverse=True
    ):
        skill_id = recommendation.get("skill_id", recommendation.get("skill", ""))
        priority = recommendation.get("priority", recommendation.get("priority_score", 0))

        # INTERVIEW: match resources per skill here — deterministic 50/20/20/10, no LLM
        skill_resources: List[dict] = []
        if resources and recommend_resources is not None:
            try:
                skill_resources = recommend_resources(
                    skill_id=skill_id,
                    resources=resources,
                    learner_level=learner_level,
                    learning_preference=learning_preference,
                    max_hours=max_hours,
                    limit=resource_limit,
                )
            except Exception:
                skill_resources = []

        # Resolve prerequisites - only add skill when prerequisites are met
        unresolved_prereqs = _get_unresolved_prerequisites(
            skill_id, learned_skills, prereq_map
        )

        if unresolved_prereqs:
            # Skill is blocked by prerequisites - add prerequisite info
            path.append({
                "skill": skill_id,
                "skill_id": skill_id,
                "status": "blocked",
                "prerequisites": unresolved_prereqs,
                "priority": priority,
                "resources": skill_resources,
            })
        else:
            # Skill can be learned - add to path
            path.append({
                "skill": skill_id,
                "skill_id": skill_id,
                "status": "ready",
                "current_mastery": recommendation.get("current_mastery", 0),
                "required_mastery": recommendation.get("required_mastery", 0),
                "gap": recommendation.get("gap", 0),
                "priority": priority,
                "resources": skill_resources,
            })
            learned_skills.add(skill_id)
    
    # Organize into phases based on dependency levels
    phases = _organize_into_phases(path, prereq_map)
    
    return {
        "learning_path": path,
        "phases": phases,
        "total_skills": len(path),
        "ready_skills": sum(1 for step in path if step.get("status") == "ready"),
        "blocked_skills": sum(1 for step in path if step.get("status") == "blocked")
    }


def _get_unresolved_prerequisites(
    skill_id: str,
    learned_skills: set,
    prereq_map: Dict[str, List[str]]
) -> List[str]:
    """Get list of prerequisites for a skill that haven't been learned yet."""
    prerequisites = prereq_map.get(skill_id, [])
    unresolved = []
    
    for prereq in prerequisites:
        if prereq not in learned_skills:
            unresolved.append(prereq)
    
    return unresolved


def _organize_into_phases(
    path: List[dict],
    prereq_map: Dict[str, List[str]]
) -> List[Dict[str, List[str]]]:
    """Organize learning path steps into phases based on prerequisite chains."""
    phases = []
    current_phase = []
    max_prereq_depth = 0
    
    for step in path:
        if step.get("status") == "blocked":
            # Blocked skills form their own phase or are noted
            if current_phase:
                phases.append({
                    "phase": len(phases) + 1,
                    "skills": current_phase,
                    "description": f"Phase {len(phases) + 1}: Foundational skills"
                })
                current_phase = []
        else:
            # Count prerequisite depth for phase grouping
            skill = step.get("skill", "")
            prereq_depth = _get_prerequisite_depth(skill, prereq_map)
            max_prereq_depth = max(max_prereq_depth, prereq_depth)
            
            current_phase.append({
                "skill": skill,
                "priority": step.get("priority", 0),
                "prerequisite_depth": prereq_depth
            })
    
    # Don't forget any remaining skills
    if current_phase:
        phases.append({
            "phase": len(phases) + 1,
            "skills": current_phase,
            "description": f"Phase {len(phases) + 1}: Advanced skills"
        })
    
    return phases


def _get_prerequisite_depth(
    skill_id: str,
    prereq_map: Dict[str, List[str]],
    visited: Optional[set] = None
) -> int:
    """Get the depth of prerequisites for a skill."""
    if visited is None:
        visited = set()
    
    if skill_id in visited:
        return 0
    
    visited.add(skill_id)
    
    prerequisites = prereq_map.get(skill_id, [])
    if not prerequisites:
        return 0
    
    # Recursively find max depth
    max_depth = 0
    for prereq in prerequisites:
        depth = _get_prerequisite_depth(prereq, prereq_map, visited.copy())
        max_depth = max(max_depth, depth + 1)
    
    return max_depth