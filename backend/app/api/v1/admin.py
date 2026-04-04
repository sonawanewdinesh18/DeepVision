"""
Admin API endpoints
Provides admin-specific functionality for dashboard, user management, etc.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.dependencies import get_current_admin_user, get_supabase
from app.models.schemas import UserPublic
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
        
        # Get users
        response = supabase.table("profiles")\
            .select("id, email, full_name, role, subscription_plan, is_active, created_at")\
            .range(offset, offset + limit - 1)\
            .execute()
        
        users = []
        for profile in response.data:
            # Get detection count for each user separately
            detection_count_response = supabase.table("detections")\
                .select("*", count="exact")\
                .eq("user_id", profile["id"])\
                .execute()
            
            # Get last active (last detection date)
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
                "subscription_plan": profile.get("subscription_plan", "free"),
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
    subscription_plan: str = "free",
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
        
        # Update profile with role and subscription
        profile_data = {
            "role": role,
            "subscription_plan": subscription_plan,
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
    subscription_plan: Optional[str] = None,
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
        if subscription_plan is not None:
            update_data["subscription_plan"] = subscription_plan
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


# ==================== SUBSCRIPTION MANAGEMENT ====================

@router.get("/subscriptions")
async def get_subscriptions(
    supabase: Client = Depends(get_supabase),
    admin: UserPublic = Depends(get_current_admin_user)
):
    """Get subscription statistics and user breakdown."""
    try:
        # Get all users with their subscription plans
        response = supabase.table("profiles").select("id, email, full_name, subscription_plan, created_at").execute()
        
        # Count by plan
        plan_counts = {"free": 0, "basic": 0, "premium": 0, "enterprise": 0}
        users_by_plan = {"free": [], "basic": [], "premium": [], "enterprise": []}
        
        for profile in response.data:
            plan = profile.get("subscription_plan", "free")
            plan_counts[plan] = plan_counts.get(plan, 0) + 1
            users_by_plan[plan].append({
                "id": profile["id"],
                "email": profile["email"],
                "full_name": profile.get("full_name", ""),
                "created_at": profile["created_at"]
            })
        
        return {
            "plan_counts": plan_counts,
            "users_by_plan": users_by_plan,
            "total_users": len(response.data)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch subscriptions: {str(e)}"
        )


@router.put("/subscriptions/{user_id}")
async def update_user_subscription(
    user_id: str,
    subscription_plan: str,
    supabase: Client = Depends(get_supabase),
    admin: UserPublic = Depends(get_current_admin_user)
):
    """Update a user's subscription plan."""
    try:
        valid_plans = ["free", "basic", "premium", "enterprise"]
        if subscription_plan not in valid_plans:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid subscription plan. Must be one of: {', '.join(valid_plans)}"
            )
        
        response = supabase.table("profiles")\
            .update({"subscription_plan": subscription_plan})\
            .eq("id", user_id)\
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {"message": "Subscription updated successfully", "user": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update subscription: {str(e)}"
        )



# ==================== PRICING PLANS MANAGEMENT ====================

@router.get("/pricing-plans")
async def get_pricing_plans(
    include_inactive: bool = False,
    supabase: Client = Depends(get_supabase),
    admin: UserPublic = Depends(get_current_admin_user)
):
    """Get all pricing plans (admin can see inactive plans too)."""
    try:
        query = supabase.table("pricing_plans").select("*").order("display_order")
        
        if not include_inactive:
            query = query.eq("is_active", True)
        
        response = query.execute()
        
        return {"plans": response.data}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch pricing plans: {str(e)}"
        )


@router.post("/pricing-plans")
async def create_pricing_plan(
    name: str,
    display_name: str,
    description: str,
    price: float,
    billing_period: str = "monthly",
    features: List[str] = [],
    max_detections: int = 0,
    max_storage_gb: int = 0,
    priority_support: bool = False,
    api_access: bool = False,
    custom_models: bool = False,
    is_active: bool = True,
    display_order: int = 0,
    supabase: Client = Depends(get_supabase),
    admin: UserPublic = Depends(get_current_admin_user)
):
    """Create a new pricing plan."""
    try:
        plan_data = {
            "name": name.lower().replace(" ", "_"),
            "display_name": display_name,
            "description": description,
            "price": price,
            "billing_period": billing_period,
            "features": features,
            "max_detections": max_detections,
            "max_storage_gb": max_storage_gb,
            "priority_support": priority_support,
            "api_access": api_access,
            "custom_models": custom_models,
            "is_active": is_active,
            "display_order": display_order
        }
        
        response = supabase.table("pricing_plans").insert(plan_data).execute()
        
        return {"message": "Pricing plan created successfully", "plan": response.data[0]}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create pricing plan: {str(e)}"
        )


@router.put("/pricing-plans/{plan_id}")
async def update_pricing_plan(
    plan_id: str,
    display_name: Optional[str] = None,
    description: Optional[str] = None,
    price: Optional[float] = None,
    billing_period: Optional[str] = None,
    features: Optional[List[str]] = None,
    max_detections: Optional[int] = None,
    max_storage_gb: Optional[int] = None,
    priority_support: Optional[bool] = None,
    api_access: Optional[bool] = None,
    custom_models: Optional[bool] = None,
    is_active: Optional[bool] = None,
    display_order: Optional[int] = None,
    supabase: Client = Depends(get_supabase),
    admin: UserPublic = Depends(get_current_admin_user)
):
    """Update a pricing plan."""
    try:
        update_data = {}
        
        if display_name is not None:
            update_data["display_name"] = display_name
        if description is not None:
            update_data["description"] = description
        if price is not None:
            update_data["price"] = price
        if billing_period is not None:
            update_data["billing_period"] = billing_period
        if features is not None:
            update_data["features"] = features
        if max_detections is not None:
            update_data["max_detections"] = max_detections
        if max_storage_gb is not None:
            update_data["max_storage_gb"] = max_storage_gb
        if priority_support is not None:
            update_data["priority_support"] = priority_support
        if api_access is not None:
            update_data["api_access"] = api_access
        if custom_models is not None:
            update_data["custom_models"] = custom_models
        if is_active is not None:
            update_data["is_active"] = is_active
        if display_order is not None:
            update_data["display_order"] = display_order
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        response = supabase.table("pricing_plans").update(update_data).eq("id", plan_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pricing plan not found"
            )
        
        return {"message": "Pricing plan updated successfully", "plan": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update pricing plan: {str(e)}"
        )


@router.delete("/pricing-plans/{plan_id}")
async def delete_pricing_plan(
    plan_id: str,
    supabase: Client = Depends(get_supabase),
    admin: UserPublic = Depends(get_current_admin_user)
):
    """Delete a pricing plan (or just deactivate it)."""
    try:
        # Instead of deleting, we deactivate to preserve data integrity
        response = supabase.table("pricing_plans")\
            .update({"is_active": False})\
            .eq("id", plan_id)\
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pricing plan not found"
            )
        
        return {"message": "Pricing plan deactivated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete pricing plan: {str(e)}"
        )
