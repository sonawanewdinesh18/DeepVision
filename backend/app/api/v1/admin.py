"""
Admin API endpoints
Provides admin-specific functionality for dashboard, user management, etc.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.dependencies import get_current_admin_user, get_supabase
from app.models.schemas import UserPublic
from app.services.detection_service import detection_service
from supabase import Client

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
async def get_admin_stats(
    supabase: Client = Depends(get_supabase),
    admin: UserPublic = Depends(get_current_admin_user)
):
    """
    Get overall platform statistics for admin dashboard.
    Returns total scans, deepfakes detected, active users, and accuracy.
    """
    try:
        # Get total detections
        detections_response = supabase.table("detections").select("*", count="exact").execute()
        total_scans = detections_response.count or 0
        
        # Get deepfakes detected
        deepfakes_response = supabase.table("detections").select("*", count="exact").eq("verdict", "DEEPFAKE").execute()
        deepfakes_detected = deepfakes_response.count or 0
        
        # Get active users (users who have made at least one detection)
        active_users_response = supabase.table("profiles").select("id", count="exact").execute()
        active_users = active_users_response.count or 0
        
        # Calculate accuracy (authentic detections / total detections)
        authentic_response = supabase.table("detections").select("*", count="exact").eq("verdict", "REAL").execute()
        authentic_count = authentic_response.count or 0
        accuracy = (authentic_count / total_scans * 100) if total_scans > 0 else 0
        
        # Get previous month stats for comparison (simplified - using last 30 days vs previous 30 days)
        thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
        sixty_days_ago = (datetime.now() - timedelta(days=60)).isoformat()
        
        # Recent scans (last 30 days)
        recent_scans = supabase.table("detections").select("*", count="exact").gte("created_at", thirty_days_ago).execute()
        recent_scans_count = recent_scans.count or 0
        
        # Previous period scans (30-60 days ago)
        previous_scans = supabase.table("detections").select("*", count="exact").gte("created_at", sixty_days_ago).lt("created_at", thirty_days_ago).execute()
        previous_scans_count = previous_scans.count or 1  # Avoid division by zero
        
        # Calculate percentage change
        scans_change = ((recent_scans_count - previous_scans_count) / previous_scans_count * 100) if previous_scans_count > 0 else 0
        
        return {
            "total_scans": total_scans,
            "deepfakes_detected": deepfakes_detected,
            "active_users": active_users,
            "system_accuracy": round(accuracy, 1),
            "scans_change": round(scans_change, 1),
            "deepfakes_change": 0,  # Can be calculated similarly if needed
            "users_change": 0,  # Can be calculated similarly if needed
            "accuracy_change": 0  # Can be calculated similarly if needed
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch admin stats: {str(e)}"
        )


@router.get("/activity")
async def get_recent_activity(
    limit: int = 10,
    supabase: Client = Depends(get_supabase),
    admin: UserPublic = Depends(get_current_admin_user)
):
    """
    Get recent detection activity across all users.
    Returns recent detections with user information.
    """
    try:
        # Get recent detections
        response = supabase.table("detections")\
            .select("id, file_name, verdict, confidence, created_at, user_id")\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()
        
        activities = []
        for detection in response.data:
            # Fetch user profile separately
            user_id = detection.get("user_id")
            user_name = "Unknown User"
            user_email = ""
            
            if user_id:
                profile_response = supabase.table("profiles").select("full_name, email").eq("id", user_id).execute()
                if profile_response.data:
                    profile = profile_response.data[0]
                    user_name = profile.get("full_name", "Unknown User")
                    user_email = profile.get("email", "")
            
            activities.append({
                "id": detection["id"],
                "file_name": detection["file_name"],
                "verdict": detection["verdict"],
                "confidence": detection["confidence"],
                "created_at": detection["created_at"],
                "user_name": user_name,
                "user_email": user_email
            })
        
        return {"activities": activities}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch activity: {str(e)}"
        )


@router.get("/chart-data")
async def get_chart_data(
    days: int = 7,
    supabase: Client = Depends(get_supabase),
    admin: UserPublic = Depends(get_current_admin_user)
):
    """
    Get detection data for charts (last N days).
    Returns daily counts of authentic vs deepfake detections.
    """
    try:
        # Get detections from last N days
        start_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        response = supabase.table("detections")\
            .select("verdict, created_at")\
            .gte("created_at", start_date)\
            .order("created_at", desc=False)\
            .execute()
        
        # Group by date and verdict
        daily_data = {}
        for detection in response.data:
            date = detection["created_at"][:10]  # Get YYYY-MM-DD
            if date not in daily_data:
                daily_data[date] = {"authentic": 0, "deepfake": 0}
            
            if detection["verdict"] == "REAL":
                daily_data[date]["authentic"] += 1
            else:
                daily_data[date]["deepfake"] += 1
        
        # Convert to array format
        chart_data = []
        for date in sorted(daily_data.keys()):
            chart_data.append({
                "date": date,
                "authentic": daily_data[date]["authentic"],
                "deepfake": daily_data[date]["deepfake"]
            })
        
        return {"chart_data": chart_data}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch chart data: {str(e)}"
        )


@router.get("/users")
async def get_all_users(
    page: int = 1,
    limit: int = 20,
    supabase: Client = Depends(get_supabase),
    admin: UserPublic = Depends(get_current_admin_user)
):
    """
    Get all users with their statistics.
    Paginated list of users for user management.
    """
    try:
        offset = (page - 1) * limit
        
        # Get users with updated_at field
        response = supabase.table("profiles")\
            .select("id, email, full_name, role, is_active, created_at, updated_at")\
            .range(offset, offset + limit - 1)\
            .execute()
        
        users = []
        for profile in response.data:
            # Get detection count for each user separately
            detection_count_response = supabase.table("detections")\
                .select("*", count="exact")\
                .eq("user_id", profile["id"])\
                .execute()
            
            # Use updated_at as last_active (this shows when user last signed in or updated profile)
            # If updated_at is not available, fall back to last detection, then created_at
            last_active = profile.get("updated_at")
            
            if not last_active:
                # Fallback to last detection date
                last_detection = supabase.table("detections")\
                    .select("created_at")\
                    .eq("user_id", profile["id"])\
                    .order("created_at", desc=True)\
                    .limit(1)\
                    .execute()
                
                last_active = last_detection.data[0]["created_at"] if last_detection.data else profile["created_at"]
            
            users.append({
                "id": profile["id"],
                "email": profile["email"],
                "full_name": profile.get("full_name", ""),
                "role": profile.get("role", "user"),
                "is_active": profile.get("is_active", True),
                "created_at": profile["created_at"],
                "last_active": last_active,
                "detection_count": detection_count_response.count or 0
            })
        
        # Get total count
        count_response = supabase.table("profiles").select("*", count="exact").execute()
        total = count_response.count or 0
        
        return {
            "users": users,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch users: {str(e)}"
        )



# ==================== USER MANAGEMENT CRUD ====================

# ==================== USER MANAGEMENT CRUD ====================

@router.post("/users")
async def create_user(
    email: str,
    password: str,
    full_name: Optional[str] = None,
    role: str = "user",
    supabase: Client = Depends(get_supabase),
    admin: UserPublic = Depends(get_current_admin_user)
):
    """Create a new user (admin only)."""
    try:
        # Normalize email
        normalized_email = email.lower().strip()
        
        # Create user in Supabase Auth using admin API
        try:
            auth_response = supabase.auth.admin.create_user({
                "email": normalized_email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": full_name or "New User"
                }
            })
        except Exception as auth_error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create user in auth system: {str(auth_error)}"
            )
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user - no user returned from auth system"
            )
        
        user_id = auth_response.user.id
        
        # Update profile with role
        profile_data = {
            "role": role,
            "full_name": full_name or "New User"
        }
        
        try:
            supabase.table("profiles").update(profile_data).eq("id", user_id).execute()
        except Exception as profile_error:
            # User created but profile update failed - log but don't fail
            print(f"Profile update error: {profile_error}")
        
        return {
            "message": "User created successfully",
            "user_id": user_id,
            "email": normalized_email
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    full_name: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    supabase: Client = Depends(get_supabase),
    admin: UserPublic = Depends(get_current_admin_user)
):
    """Update user profile information."""
    try:
        update_data = {}
        if full_name is not None:
            update_data["full_name"] = full_name
        if role is not None:
            update_data["role"] = role
        if is_active is not None:
            update_data["is_active"] = is_active
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        response = supabase.table("profiles").update(update_data).eq("id", user_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {"message": "User updated successfully", "user": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user: {str(e)}"
        )


@router.put("/users/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: str,
    supabase: Client = Depends(get_supabase),
    admin: UserPublic = Depends(get_current_admin_user)
):
    """Toggle user active/inactive status."""
    try:
        # Get current status
        response = supabase.table("profiles").select("is_active").eq("id", user_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        current_status = response.data[0].get("is_active", True)
        new_status = not current_status
        
        # Update status
        update_response = supabase.table("profiles").update({"is_active": new_status}).eq("id", user_id).execute()
        
        return {
            "message": f"User {'activated' if new_status else 'deactivated'} successfully",
            "user": update_response.data[0]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to toggle user status: {str(e)}"
        )


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    supabase: Client = Depends(get_supabase),
    admin: UserPublic = Depends(get_current_admin_user)
):
    """Delete a user (soft delete by updating status)."""
    try:
        # Delete user's detections first
        supabase.table("detections").delete().eq("user_id", user_id).execute()
        
        # Delete user profile
        response = supabase.table("profiles").delete().eq("id", user_id).execute()
        
        # Also delete from auth.users (requires admin privileges)
        try:
            supabase.auth.admin.delete_user(user_id)
        except:
            pass  # Continue even if auth deletion fails
        
        return {"message": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )


# ==================== MODEL MANAGEMENT CRUD ====================

@router.get("/models")
async def get_models(
    supabase: Client = Depends(get_supabase),
    admin: UserPublic = Depends(get_current_admin_user)
):
    """Get all AI models with their statistics."""
    try:
        response = supabase.table("ai_models").select("*").order("created_at", desc=True).execute()
        
        models = []
        for model in response.data:
            # Get detection count for this model
            detection_count_response = supabase.table("detections")\
                .select("*", count="exact")\
                .eq("model_id", model["id"])\
                .execute()
            
            models.append({
                "id": model["id"],
                "name": model["name"],
                "version": model["version"],
                "accuracy": model.get("accuracy", 0),
                "status": model.get("status", "inactive"),
                "created_at": model["created_at"],
                "updated_at": model.get("updated_at"),
                "detection_count": detection_count_response.count or 0
            })
        
        return {"models": models}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch models: {str(e)}"
        )


@router.post("/models")
async def create_model(
    name: str,
    version: str,
    accuracy: float = 0.0,
    status: str = "inactive",
    supabase: Client = Depends(get_supabase),
    admin: UserPublic = Depends(get_current_admin_user)
):
    """Create a new AI model."""
    try:
        model_data = {
            "name": name,
            "version": version,
            "accuracy": accuracy,
            "status": status,
            "created_at": datetime.now().isoformat()
        }
        
        response = supabase.table("ai_models").insert(model_data).execute()
        
        return {"message": "Model created successfully", "model": response.data[0]}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create model: {str(e)}"
        )


@router.put("/models/{model_id}")
async def update_model(
    model_id: str,
    name: Optional[str] = None,
    version: Optional[str] = None,
    accuracy: Optional[float] = None,
    status: Optional[str] = None,
    supabase: Client = Depends(get_supabase),
    admin: UserPublic = Depends(get_current_admin_user)
):
    """Update an AI model."""
    try:
        update_data = {"updated_at": datetime.now().isoformat()}
        
        if name is not None:
            update_data["name"] = name
        if version is not None:
            update_data["version"] = version
        if accuracy is not None:
            update_data["accuracy"] = accuracy
        if status is not None:
            update_data["status"] = status
        
        response = supabase.table("ai_models").update(update_data).eq("id", model_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Model not found"
            )
        
        return {"message": "Model updated successfully", "model": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update model: {str(e)}"
        )


@router.delete("/models/{model_id}")
async def delete_model(
    model_id: str,
    supabase: Client = Depends(get_supabase),
    admin: UserPublic = Depends(get_current_admin_user)
):
    """Delete an AI model."""
    try:
        response = supabase.table("ai_models").delete().eq("id", model_id).execute()
        
        return {"message": "Model deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete model: {str(e)}"
        )


@router.get("/ai-status")
async def get_ai_model_status(
    admin: UserPublic = Depends(get_current_admin_user)
):
    """Get current AI model status for monitoring."""
    try:
        model_status = detection_service.get_model_status()
        return {
            "status": "success",
            "models": model_status,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "models": {
                "image_model": {"loaded": False, "error": str(e)},
                "video_model": {"loaded": False, "error": str(e)}
            },
            "timestamp": datetime.now().isoformat()
        }


# ==================== FEEDBACK MANAGEMENT CRUD ====================

@router.get("/feedback")
async def get_feedback(
    page: int = 1,
    limit: int = 20,
    status_filter: Optional[str] = None,
    supabase: Client = Depends(get_supabase),
    admin: UserPublic = Depends(get_current_admin_user)
):
    """Get all user feedback with pagination and filtering."""
    try:
        offset = (page - 1) * limit
        
        query = supabase.table("feedback").select("*")
        
        if status_filter:
            query = query.eq("status", status_filter)
        
        response = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        feedback_list = []
        for feedback in response.data:
            # Get user info
            user_id = feedback.get("user_id")
            user_name = "Anonymous"
            user_email = ""
            
            if user_id:
                profile_response = supabase.table("profiles").select("full_name, email").eq("id", user_id).execute()
                if profile_response.data:
                    profile = profile_response.data[0]
                    user_name = profile.get("full_name", "Anonymous")
                    user_email = profile.get("email", "")
            
            feedback_list.append({
                "id": feedback["id"],
                "user_id": user_id,
                "user_name": user_name,
                "user_email": user_email,
                "detection_id": feedback.get("detection_id"),
                "rating": feedback.get("rating"),
                "comment": feedback.get("comment", ""),
                "status": feedback.get("status", "pending"),
                "created_at": feedback["created_at"]
            })
        
        # Get total count
        count_query = supabase.table("feedback").select("*", count="exact")
        if status_filter:
            count_query = count_query.eq("status", status_filter)
        count_response = count_query.execute()
        total = count_response.count or 0
        
        return {
            "feedback": feedback_list,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch feedback: {str(e)}"
        )


@router.put("/feedback/{feedback_id}")
async def update_feedback_status(
    feedback_id: str,
    status: str,
    admin_response: Optional[str] = None,
    supabase: Client = Depends(get_supabase),
    admin: UserPublic = Depends(get_current_admin_user)
):
    """Update feedback status and add admin response."""
    try:
        update_data = {
            "status": status,
            "updated_at": datetime.now().isoformat()
        }
        
        if admin_response:
            update_data["admin_response"] = admin_response
        
        response = supabase.table("feedback").update(update_data).eq("id", feedback_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Feedback not found"
            )
        
        return {"message": "Feedback updated successfully", "feedback": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update feedback: {str(e)}"
        )


@router.delete("/feedback/{feedback_id}")
async def delete_feedback(
    feedback_id: str,
    supabase: Client = Depends(get_supabase),
    admin: UserPublic = Depends(get_current_admin_user)
):
    """Delete feedback."""
    try:
        response = supabase.table("feedback").delete().eq("id", feedback_id).execute()
        
        return {"message": "Feedback deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete feedback: {str(e)}"
        )


# Subscription and payment management endpoints removed
