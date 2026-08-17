"""
app/services/user_service.py

Business logic for user profiles, preferences, statistics, analytics, feedback, and notifications.
"""

from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status

from app.core.database import get_supabase
from app.core.exceptions import CustomAPIException
from app.schemas.user import (
    UserPublic,
    UserUpdate,
    UserStatistics,
    UserSettings,
    UserSettingsUpdate,
    UserAnalyticsOverview,
    ChartData,
    FeedbackCreate,
    FeedbackResponse,
    NotificationItem,
    NotificationResponse,
)


class UserService:
    """Handles user domain business logic."""

    async def update_last_active(self, user_id: str) -> None:
        """Record the latest active timestamp for the user."""
        supabase = get_supabase()
        supabase.table("profiles").update({
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", user_id).execute()

    async def update_profile(self, user_id: str, email: str, update_data: UserUpdate) -> UserPublic:
        """Update full name and avatar URL for user."""
        supabase = get_supabase()
        data_to_update = update_data.model_dump(exclude_unset=True)

        if not data_to_update:
            resp = supabase.table("profiles").select("*").eq("id", user_id).execute()
            if not resp.data:
                raise CustomAPIException("User profile not found.", code="NOT_FOUND", status_code=404)
            profile = resp.data[0]
            return UserPublic(
                id=profile["id"],
                email=email,
                full_name=profile.get("full_name"),
                role=profile.get("role", "user"),
                avatar_url=profile.get("avatar_url"),
                created_at=profile.get("created_at"),
            )

        resp = supabase.table("profiles").update(data_to_update).eq("id", user_id).execute()
        if not resp.data:
            raise CustomAPIException("Failed to update user profile.", code="UPDATE_FAILED", status_code=400)

        profile = resp.data[0]
        return UserPublic(
            id=profile["id"],
            email=email,
            full_name=profile.get("full_name"),
            role=profile.get("role", "user"),
            avatar_url=profile.get("avatar_url"),
            created_at=profile.get("created_at"),
        )

    async def get_statistics(self, user_id: str) -> UserStatistics:
        """Calculate and return scan statistics for a user."""
        supabase = get_supabase()

        # Count total
        total_resp = supabase.table("detections").select("id", count="exact").eq("user_id", user_id).execute()
        total = total_resp.count or 0

        # Count real/authentic
        real_resp = supabase.table("detections").select("id", count="exact").eq("user_id", user_id).eq("verdict", "REAL").execute()
        authentic = real_resp.count or 0

        # Count fake
        fake_resp = supabase.table("detections").select("id", count="exact").eq("user_id", user_id).eq("verdict", "FAKE").execute()
        deepfake = fake_resp.count or 0

        # Get latest detection date
        last_resp = supabase.table("detections").select("created_at").eq("user_id", user_id).order("created_at", desc=True).limit(1).execute()
        last_at = last_resp.data[0]["created_at"] if last_resp.data else None

        return UserStatistics(
            total_detections=total,
            authentic_count=authentic,
            deepfake_count=deepfake,
            last_detection_at=last_at,
        )

    async def get_settings(self, user_id: str) -> UserSettings:
        """Fetch user preferences."""
        supabase = get_supabase()
        resp = supabase.table("user_settings").select("*").eq("user_id", user_id).execute()

        if not resp.data:
            return UserSettings()

        data = resp.data[0]
        return UserSettings(
            email_notifications=data.get("email_notifications", True),
            weekly_report=data.get("weekly_report", False),
            two_factor_enabled=data.get("two_factor_enabled", False),
            theme=data.get("theme", "dark"),
            language=data.get("language", "en"),
            timezone=data.get("timezone", "UTC"),
        )

    async def update_settings(self, user_id: str, settings_update: UserSettingsUpdate) -> Dict[str, Any]:
        """Update or create user preferences."""
        supabase = get_supabase()
        update_data = settings_update.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        check_resp = supabase.table("user_settings").select("id").eq("user_id", user_id).execute()

        if check_resp.data:
            resp = supabase.table("user_settings").update(update_data).eq("user_id", user_id).execute()
        else:
            update_data["user_id"] = user_id
            resp = supabase.table("user_settings").insert(update_data).execute()

        if not resp.data:
            raise CustomAPIException("Failed to update settings.", code="UPDATE_FAILED", status_code=400)

        return resp.data[0]

    async def get_analytics_overview(self, user_id: str) -> UserAnalyticsOverview:
        """Fetch analytics overview metrics."""
        supabase = get_supabase()

        stats = await self.get_statistics(user_id)
        seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

        recent_resp = supabase.table("detections").select(
            "id, created_at, processing_time_ms"
        ).eq("user_id", user_id).gte("created_at", seven_days_ago).execute()

        recent_items = recent_resp.data or []
        last_7_days = len(recent_items)

        # Average processing time
        times = [d.get("processing_time_ms", 0) for d in recent_items if d.get("processing_time_ms")]
        avg_time = (sum(times) / len(times) / 1000.0) if times else 1.5

        # Most active weekday
        day_names = [
            datetime.fromisoformat(d["created_at"].replace("Z", "+00:00")).strftime("%A")
            for d in recent_items if "created_at" in d
        ]
        counter = Counter(day_names)
        most_active = counter.most_common(1)[0][0] if counter else "Monday"

        # Success rate
        success_rate = (stats.authentic_count / stats.total_detections * 100) if stats.total_detections > 0 else 100.0

        return UserAnalyticsOverview(
            total_detections=stats.total_detections,
            authentic_count=stats.authentic_count,
            deepfake_count=stats.deepfake_count,
            success_rate=round(success_rate, 1),
            avg_processing_time=round(avg_time, 2),
            most_active_day=most_active,
            last_7_days_detections=last_7_days,
        )

    async def get_analytics_chart(self, user_id: str, days: int = 7) -> ChartData:
        """Generate time-series chart data for user detections."""
        supabase = get_supabase()
        start_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

        resp = supabase.table("detections").select(
            "verdict, created_at"
        ).eq("user_id", user_id).gte("created_at", start_date).order("created_at", desc=False).execute()

        date_map = {}
        for i in range(days):
            d = (datetime.now(timezone.utc) - timedelta(days=days - i - 1)).strftime("%b %d")
            date_map[d] = {"total": 0, "authentic": 0, "deepfake": 0}

        for item in (resp.data or []):
            try:
                date_str = datetime.fromisoformat(item["created_at"].replace("Z", "+00:00")).strftime("%b %d")
                if date_str in date_map:
                    date_map[date_str]["total"] += 1
                    if item.get("verdict") == "REAL":
                        date_map[date_str]["authentic"] += 1
                    else:
                        date_map[date_str]["deepfake"] += 1
            except Exception:
                continue

        return ChartData(
            labels=list(date_map.keys()),
            detections=[v["total"] for v in date_map.values()],
            authentic=[v["authentic"] for v in date_map.values()],
            deepfake=[v["deepfake"] for v in date_map.values()],
        )

    async def submit_feedback(self, user_id: str, feedback: FeedbackCreate) -> FeedbackResponse:
        """Submit feedback on a detection or the platform."""
        supabase = get_supabase()
        resp = supabase.table("feedback").insert({
            "user_id": user_id,
            "detection_id": feedback.detection_id,
            "subject": feedback.subject,
            "message": feedback.message,
            "status": "pending",
        }).execute()

        if not resp.data:
            raise CustomAPIException("Failed to submit feedback.", code="SUBMIT_FAILED", status_code=400)

        data = resp.data[0]
        return FeedbackResponse(
            id=data["id"],
            user_id=data["user_id"],
            detection_id=data.get("detection_id"),
            subject=data["subject"],
            message=data["message"],
            status=data["status"],
            created_at=data["created_at"],
        )

    async def get_feedback_list(self, user_id: str) -> List[FeedbackResponse]:
        """Fetch feedback history for a user."""
        supabase = get_supabase()
        resp = supabase.table("feedback").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()

        return [
            FeedbackResponse(
                id=item["id"],
                user_id=item["user_id"],
                detection_id=item.get("detection_id"),
                subject=item.get("subject", ""),
                message=item.get("message", ""),
                status=item.get("status", "pending"),
                created_at=item["created_at"],
            )
            for item in (resp.data or [])
        ]

    async def get_feedback_details(self, feedback_id: str, user_id: str) -> FeedbackResponse:
        """Fetch single feedback details."""
        supabase = get_supabase()
        resp = supabase.table("feedback").select("*").eq("id", feedback_id).eq("user_id", user_id).execute()

        if not resp.data:
            raise CustomAPIException("Feedback not found.", code="NOT_FOUND", status_code=404)

        item = resp.data[0]
        return FeedbackResponse(
            id=item["id"],
            user_id=item["user_id"],
            detection_id=item.get("detection_id"),
            subject=item.get("subject", ""),
            message=item.get("message", ""),
            status=item.get("status", "pending"),
            created_at=item["created_at"],
        )

    async def get_notifications(self, user_id: str, unread_only: bool = False) -> NotificationResponse:
        """Fetch user notifications feed."""
        supabase = get_supabase()
        query = supabase.table("notifications").select("*").eq("user_id", user_id)

        if unread_only:
            query = query.eq("is_read", False)

        resp = query.order("created_at", desc=True).limit(50).execute()

        unread_resp = supabase.table("notifications").select(
            "id", count="exact"
        ).eq("user_id", user_id).eq("is_read", False).execute()

        items = [
            NotificationItem(
                id=item["id"],
                title=item.get("title", ""),
                message=item.get("message", ""),
                type=item.get("type", "info"),
                is_read=item.get("is_read", False),
                action_url=item.get("action_url"),
                created_at=item["created_at"],
            )
            for item in (resp.data or [])
        ]

        return NotificationResponse(
            items=items,
            unread_count=unread_resp.count or 0,
            total=len(items),
        )

    async def mark_notification_read(self, notification_id: str, user_id: str) -> None:
        """Mark a notification item as read."""
        supabase = get_supabase()
        resp = supabase.table("notifications").update({
            "is_read": True
        }).eq("id", notification_id).eq("user_id", user_id).execute()

        if not resp.data:
            raise CustomAPIException("Notification not found.", code="NOT_FOUND", status_code=404)

    async def delete_notification(self, notification_id: str, user_id: str) -> None:
        """Delete a notification item."""
        supabase = get_supabase()
        resp = supabase.table("notifications").delete().eq("id", notification_id).eq("user_id", user_id).execute()

        if not resp.data:
            raise CustomAPIException("Notification not found.", code="NOT_FOUND", status_code=404)

    async def delete_account(self, user_id: str) -> None:
        """Soft/hard delete user profile and auth account."""
        supabase = get_supabase()
        try:
            supabase.auth.admin.delete_user(user_id)
        except Exception as exc:
            # Fallback: remove profile directly
            supabase.table("profiles").delete().eq("id", user_id).execute()


user_service = UserService()
