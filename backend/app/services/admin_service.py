"""
app/services/admin_service.py

Business logic for administrator dashboards, system statistics, user management, and AI monitoring.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from app.core.database import get_supabase
from app.core.exceptions import CustomAPIException
from app.engine.model import get_model_status

logger = logging.getLogger(__name__)
from app.schemas.admin import (
    AdminStatsResponse,
    AdminActivityItem,
    AdminActivityResponse,
    AdminUserItem,
    AdminUsersResponse,
    AdminModelItem,
    AdminModelsResponse,
    AdminFeedbackItem,
    AdminFeedbackResponse,
    AdminChartDataPoint,
    AdminChartResponse,
)


class AdminService:
    """Handles administrator operations and cross-system analytics."""

    async def get_stats(self) -> AdminStatsResponse:
        """
        Aggregate platform-wide statistics.
        Fixes the verdict comparison bug (checking 'FAKE' instead of 'DEEPFAKE').
        """
        supabase = get_supabase()

        # Total scans
        scans_resp = supabase.table("detections").select("id", count="exact").execute()
        total_scans = scans_resp.count or 0

        # Deepfakes count (verdict = FAKE)
        fakes_resp = supabase.table("detections").select("id", count="exact").eq("verdict", "FAKE").execute()
        deepfakes_count = fakes_resp.count or 0

        # Authentic count (verdict = REAL)
        auth_resp = supabase.table("detections").select("id", count="exact").eq("verdict", "REAL").execute()
        authentic_count = auth_resp.count or 0

        # Total registered users count
        users_resp = supabase.table("profiles").select("id", count="exact").execute()
        total_users = users_resp.count or 0
        active_users = total_users  # All verified active accounts

        # Average Response Time calculation (processing_time_ms)
        proc_resp = supabase.table("detections").select("processing_time_ms").not_.is_("processing_time_ms", "null").limit(500).execute()
        proc_times = [d["processing_time_ms"] for d in (proc_resp.data or []) if d.get("processing_time_ms") is not None]
        avg_response_time = int(sum(proc_times) / len(proc_times)) if proc_times else 320

        # Accuracy
        accuracy = (authentic_count / total_scans * 100.0) if total_scans > 0 else 100.0

        # Trend comparison (last 30 days vs previous 30 days)
        now = datetime.now(timezone.utc)
        thirty_days_ago = (now - timedelta(days=30)).isoformat()
        sixty_days_ago = (now - timedelta(days=60)).isoformat()

        recent_resp = supabase.table("detections").select("id", count="exact").gte("created_at", thirty_days_ago).execute()
        recent_count = recent_resp.count or 0

        prev_resp = supabase.table("detections").select("id", count="exact").gte("created_at", sixty_days_ago).lt("created_at", thirty_days_ago).execute()
        prev_count = prev_resp.count or 0

        scans_change = ((recent_count - prev_count) / prev_count * 100.0) if prev_count > 0 else 0.0

        return AdminStatsResponse(
            total_scans=total_scans,
            deepfakes_detected=deepfakes_count,
            active_users=active_users,
            system_accuracy=round(accuracy, 1),
            scans_change=round(scans_change, 1),
            deepfakes_change=0.0,
            users_change=0.0,
            accuracy_change=0.0,
            total_users=total_users,
            total_users_change=0.0,
            avg_response_time=avg_response_time,
            response_time_change=0.0,
        )

    async def get_recent_activity(self, limit: int = 10) -> AdminActivityResponse:
        """Fetch system-wide detection activity with user names."""
        supabase = get_supabase()

        resp = supabase.table("detections").select(
            "id, file_name, verdict, confidence, created_at, user_id"
        ).order("created_at", desc=True).limit(limit).execute()

        detections = resp.data or []
        user_ids = list({d.get("user_id") for d in detections if d.get("user_id")})

        # Batch load user profiles in a single query (solves N+1 query problem)
        user_map: Dict[str, Dict[str, str]] = {}
        if user_ids:
            profiles_resp = supabase.table("profiles").select("id, full_name, email").in_("id", user_ids).execute()
            for p in (profiles_resp.data or []):
                user_map[p["id"]] = {
                    "full_name": p.get("full_name") or "User",
                    "email": p.get("email") or "",
                }

        activities: List[AdminActivityItem] = []
        for d in detections:
            uid = d.get("user_id")
            user_info = user_map.get(uid, {"full_name": "Unknown User", "email": ""})
            activities.append(
                AdminActivityItem(
                    id=d["id"],
                    file_name=d.get("file_name") or "media_scan",
                    verdict=d.get("verdict") or "UNKNOWN",
                    confidence=d.get("confidence") or 0.0,
                    created_at=d.get("created_at") or "",
                    user_name=user_info["full_name"],
                    user_email=user_info["email"],
                )
            )

        return AdminActivityResponse(activities=activities)

    async def get_chart_data(self, days: int = 7) -> AdminChartResponse:
        """Fetch daily aggregate authentic vs fake detections."""
        supabase = get_supabase()
        start_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

        resp = supabase.table("detections").select(
            "verdict, created_at"
        ).gte("created_at", start_date).order("created_at", desc=False).execute()

        daily_map: Dict[str, Dict[str, int]] = {}
        for i in range(days):
            d = (datetime.now(timezone.utc) - timedelta(days=days - i - 1)).strftime("%Y-%m-%d")
            daily_map[d] = {"authentic": 0, "deepfake": 0}

        for item in (resp.data or []):
            try:
                date_str = item["created_at"][:10]
                if date_str in daily_map:
                    if item.get("verdict") == "REAL":
                        daily_map[date_str]["authentic"] += 1
                    else:
                        daily_map[date_str]["deepfake"] += 1
            except Exception:
                continue

        points = [
            AdminChartDataPoint(
                date=k,
                authentic=v["authentic"],
                deepfake=v["deepfake"],
            )
            for k, v in sorted(daily_map.items())
        ]

        return AdminChartResponse(chart_data=points)

    async def get_users(self, page: int = 1, limit: int = 20) -> AdminUsersResponse:
        """Fetch paginated list of registered users with total scan counts."""
        supabase = get_supabase()
        offset = (page - 1) * limit

        total_resp = supabase.table("profiles").select("id", count="exact").execute()
        total = total_resp.count or 0

        profiles_resp = supabase.table("profiles").select(
            "id, email, full_name, role, is_active, created_at, updated_at"
        ).range(offset, offset + limit - 1).execute()

        users_list: List[AdminUserItem] = []
        for p in (profiles_resp.data or []):
            uid = p["id"]
            # Count user scans
            scans_count = supabase.table("detections").select("id", count="exact").eq("user_id", uid).execute()
            
            users_list.append(
                AdminUserItem(
                    id=uid,
                    email=p.get("email") or "",
                    full_name=p.get("full_name") or "",
                    role=p.get("role") or "user",
                    is_active=p.get("is_active", True),
                    created_at=p.get("created_at") or "",
                    last_active=p.get("updated_at") or p.get("created_at"),
                    detection_count=scans_count.count or 0,
                )
            )

        pages = (total + limit - 1) // limit if limit > 0 else 1
        return AdminUsersResponse(
            users=users_list,
            total=total,
            page=page,
            limit=limit,
            pages=pages,
        )

    async def create_user(self, email: str, password: str, full_name: Optional[str] = None, role: str = "user") -> Dict[str, Any]:
        """Admin creates a new user in auth and profiles."""
        supabase = get_supabase()
        norm_email = email.lower().strip()

        auth_resp = supabase.auth.admin.create_user({
            "email": norm_email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"full_name": full_name or "New User"},
        })

        if not auth_resp or not auth_resp.user:
            raise CustomAPIException("Failed to provision auth user.", code="AUTH_FAILED", status_code=400)

        user_id = auth_resp.user.id
        supabase.table("profiles").update({
            "role": role,
            "full_name": full_name or "New User",
        }).eq("id", user_id).execute()

        return {
            "message": "User created successfully",
            "user_id": user_id,
            "email": norm_email,
        }

    async def update_user(self, user_id: str, full_name: Optional[str] = None, role: Optional[str] = None, is_active: Optional[bool] = None) -> Dict[str, Any]:
        """Update user record fields."""
        supabase = get_supabase()
        update_data = {}
        if full_name is not None:
            update_data["full_name"] = full_name
        if role is not None:
            update_data["role"] = role
        if is_active is not None:
            update_data["is_active"] = is_active

        if not update_data:
            raise CustomAPIException("No fields specified for update.", code="EMPTY_UPDATE", status_code=400)

        resp = supabase.table("profiles").update(update_data).eq("id", user_id).execute()
        if not resp.data:
            raise CustomAPIException("User not found.", code="NOT_FOUND", status_code=404)

        return {"message": "User updated successfully", "user": resp.data[0]}

    async def toggle_user_status(self, user_id: str) -> Dict[str, Any]:
        """Toggle user active status."""
        supabase = get_supabase()
        resp = supabase.table("profiles").select("is_active").eq("id", user_id).execute()
        if not resp.data:
            raise CustomAPIException("User not found.", code="NOT_FOUND", status_code=404)

        curr = resp.data[0].get("is_active", True)
        new_status = not curr

        update_resp = supabase.table("profiles").update({"is_active": new_status}).eq("id", user_id).execute()
        return {
            "message": f"User {'activated' if new_status else 'deactivated'} successfully",
            "user": update_resp.data[0],
        }

    async def delete_user(self, user_id: str) -> None:
        """Delete user detections, profile, and auth record."""
        supabase = get_supabase()
        supabase.table("detections").delete().eq("user_id", user_id).execute()
        supabase.table("profiles").delete().eq("id", user_id).execute()
        try:
            supabase.auth.admin.delete_user(user_id)
        except Exception:
            pass

    async def get_feedback(self, page: int = 1, limit: int = 20, status_filter: Optional[str] = None) -> AdminFeedbackResponse:
        """Paginated feedback management feed."""
        supabase = get_supabase()
        offset = (page - 1) * limit

        count_query = supabase.table("feedback").select("id", count="exact")
        if status_filter:
            count_query = count_query.eq("status", status_filter)
        count_resp = count_query.execute()
        total = count_resp.count or 0

        query = supabase.table("feedback").select("*")
        if status_filter:
            query = query.eq("status", status_filter)
        resp = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()

        feedback_items: List[AdminFeedbackItem] = []
        user_ids = list({f.get("user_id") for f in (resp.data or []) if f.get("user_id")})
        detection_ids = list({f.get("detection_id") for f in (resp.data or []) if f.get("detection_id")})

        user_map = {}
        if user_ids:
            profiles = supabase.table("profiles").select("id, full_name, email").in_("id", user_ids).execute()
            for p in (profiles.data or []):
                user_map[p["id"]] = {
                    "name": p.get("full_name") or "User",
                    "email": p.get("email") or "",
                }

        detection_map = {}
        if detection_ids:
            dets = supabase.table("detections").select("id, file_name, file_url, verdict, confidence, file_type").in_("id", detection_ids).execute()
            for d in (dets.data or []):
                detection_map[d["id"]] = d

        for item in (resp.data or []):
            uid = item.get("user_id")
            did = item.get("detection_id")
            uinfo = user_map.get(uid, {"name": "Anonymous", "email": ""})
            dinfo = detection_map.get(did, {})
            feedback_items.append(
                AdminFeedbackItem(
                    id=item["id"],
                    user_id=uid,
                    user_name=uinfo["name"],
                    user_email=uinfo["email"],
                    detection_id=did,
                    detection_file_name=dinfo.get("file_name"),
                    detection_file_url=dinfo.get("file_url"),
                    detection_verdict=dinfo.get("verdict"),
                    detection_confidence=dinfo.get("confidence"),
                    detection_file_type=dinfo.get("file_type"),
                    subject=item.get("subject") or "",
                    rating=item.get("rating"),
                    comment=item.get("message") or item.get("comment") or "",
                    status=item.get("status", "pending"),
                    admin_response=item.get("admin_notes") or item.get("admin_response"),
                    created_at=item.get("created_at") or "",
                )
            )

        pages = (total + limit - 1) // limit if limit > 0 else 1
        return AdminFeedbackResponse(
            feedback=feedback_items,
            total=total,
            page=page,
            limit=limit,
            pages=pages,
        )

    async def update_feedback(self, feedback_id: str, status: str, admin_response: Optional[str] = None) -> Dict[str, Any]:
        """Update feedback triage status."""
        supabase = get_supabase()
        update_data = {
            "status": status,
        }
        if status in ("resolved", "reviewed"):
            update_data["admin_verified"] = True
            update_data["admin_verified_at"] = datetime.now(timezone.utc).isoformat()
        else:
            update_data["admin_verified"] = False

        if admin_response:
            update_data["admin_notes"] = admin_response

        resp = supabase.table("feedback").update(update_data).eq("id", feedback_id).execute()
        if not resp.data:
            raise CustomAPIException("Feedback not found.", code="NOT_FOUND", status_code=404)

        # Notify user of admin review or response
        target_uid = resp.data[0].get("user_id")
        if target_uid:
            try:
                supabase.table("notifications").insert({
                    "user_id": target_uid,
                    "title": f"Feedback Status: {status.capitalize()}",
                    "message": admin_response or f"Your feedback has been marked as {status}.",
                    "type": "system",
                    "is_read": False,
                }).execute()
            except Exception as notify_err:
                logger.warning(f"Failed to create feedback notification: {notify_err}")

        return {"message": "Feedback updated successfully", "feedback": resp.data[0]}

    async def delete_feedback(self, feedback_id: str) -> None:
        """Delete a feedback entry."""
        supabase = get_supabase()
        resp = supabase.table("feedback").delete().eq("id", feedback_id).execute()
        if not resp.data:
            raise CustomAPIException("Feedback not found.", code="NOT_FOUND", status_code=404)

    def get_ai_status(self) -> Dict[str, Any]:
        """Return diagnostic status of loaded AI models."""
        return {
            "status": "success",
            "models": {
                "hybrid_vit": get_model_status(),
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


admin_service = AdminService()
