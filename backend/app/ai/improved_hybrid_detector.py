"""
IMPROVED Hybrid Deepfake Detector
Enhanced version with better accuracy and confidence scores
"""

import logging
import numpy as np
from PIL import Image
import io
import cv2
from typing import Dict, Any
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class ImprovedHybridDetector:
    """
    Improved hybrid detector with better accuracy and confidence.
    """
    
    def __init__(self):
        """Initialize improved hybrid detector."""
        logger.info("Initializing IMPROVED Hybrid Detector")
        self.clip_model = None
        self.clip_processor = None
        self.face_detector = None
        self._load_models()
    
    def _load_models(self):
        """Load all required models."""
        # Load CLIP
        try:
            from transformers import CLIPProcessor, CLIPModel
            logger.info("Loading CLIP model...")
            self.clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
            self.clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
            self.clip_model.eval()
            logger.info("✅ CLIP model loaded successfully")
        except Exception as e:
            logger.error(f"❌ CLIP model failed to load: {e}")
            self.clip_model = None
        
        # Load face detector
        try:
            from facenet_pytorch import MTCNN
            self.face_detector = MTCNN(keep_all=True, device='cpu', post_process=False)
            logger.info("✅ Face detector loaded successfully")
        except Exception as e:
            logger.error(f"❌ Face detector failed to load: {e}")
            self.face_detector = None
    
    def detect_ai_generated(self, image: Image.Image) -> float:
        """
        IMPROVED AI-generated image detection using CLIP.
        Returns: Score 0-1 (higher = more likely AI-generated)
        """
        if self.clip_model is None:
            logger.warning("CLIP not available, returning neutral score")
            return 0.5
        
        try:
            import torch
            
            # IMPROVED: More specific and diverse prompts
            real_prompts = [
                "a photograph taken with a digital camera",
                "a real photo with natural lighting and imperfections",
                "an authentic photograph from a smartphone or camera",
                "a genuine photo with camera noise and compression",
                "a natural photograph with realistic textures",
                "a real-world photo with depth and perspective"
            ]
            
            ai_prompts = [
                "a perfect AI-generated digital artwork",
                "a flawless computer-generated synthetic image",
                "an artificial image created by stable diffusion or midjourney",
                "a dall-e generated artificial picture",
                "a synthetic image with unrealistic perfection",
                "a GAN-generated fake image with artificial patterns"
            ]
            
            all_prompts = real_prompts + ai_prompts
            
            # Prepare inputs
            inputs = self.clip_processor(
                text=all_prompts,
                images=image,
                return_tensors="pt",
                padding=True
            )
            
            # Get predictions
            with torch.no_grad():
                outputs = self.clip_model(**inputs)
                logits_per_image = outputs.logits_per_image
                probs = logits_per_image.softmax(dim=1)
            
            # Calculate scores
            real_score = probs[0, :len(real_prompts)].mean().item()
            ai_score = probs[0, len(real_prompts):].mean().item()
            
            # IMPROVED: Better normalization with confidence boost
            total = real_score + ai_score
            if total > 0:
                ai_probability = ai_score / total
                
                # Apply sigmoid-like transformation to boost confidence
                # This makes scores closer to 0 or 1, reducing uncertainty
                ai_probability = 1 / (1 + np.exp(-10 * (ai_probability - 0.5)))
            else:
                ai_probability = 0.5
            
            logger.info(f"🤖 AI Detection: real={real_score:.4f}, ai={ai_score:.4f}, final={ai_probability:.4f}")
            return ai_probability
            
        except Exception as e:
            logger.error(f"AI detection error: {e}")
            return 0.5
    
    def detect_face_swap(self, image_np: np.ndarray) -> float:
        """
        IMPROVED face-swap detection with better heuristics.
        Returns: Score 0-1 (higher = more likely face-swap)
        """
        if self.face_detector is None:
            logger.warning("Face detector not available, returning neutral score")
            return 0.5
        
        try:
            # Convert to RGB if needed
            if len(image_np.shape) == 2:
                image_np = cv2.cvtColor(image_np, cv2.COLOR_GRAY2RGB)
            elif image_np.shape[2] == 4:
                image_np = cv2.cvtColor(image_np, cv2.COLOR_RGBA2RGB)
            
            # Detect faces
            boxes, probs = self.face_detector.detect(Image.fromarray(image_np))
            
            if boxes is None or len(boxes) == 0:
                logger.info("👤 No faces detected - likely not a face-swap")
                return 0.2  # Lower score if no faces
            
            logger.info(f"👤 Detected {len(boxes)} face(s)")
            
            # Analyze each face
            face_scores = []
            
            for i, box in enumerate(boxes):
                x1, y1, x2, y2 = [int(b) for b in box]
                
                # Add padding for better context
                padding = 20
                x1_pad = max(0, x1 - padding)
                y1_pad = max(0, y1 - padding)
                x2_pad = min(image_np.shape[1], x2 + padding)
                y2_pad = min(image_np.shape[0], y2 + padding)
                
                # Extract face region
                face = image_np[y1:y2, x1:x2]
                face_with_context = image_np[y1_pad:y2_pad, x1_pad:x2_pad]
                
                if face.size == 0:
                    continue
                
                score = 0.0
                checks_passed = 0
                total_checks = 0
                
                # Convert to grayscale for analysis
                gray_face = cv2.cvtColor(face, cv2.COLOR_RGB2GRAY)
                
                # CHECK 1: Edge sharpness at face boundary (IMPROVED)
                total_checks += 1
                edges = cv2.Canny(gray_face, 30, 100)
                edge_density = np.sum(edges > 0) / edges.size
                
                # Face-swaps have unnaturally sharp boundaries
                if edge_density > 0.12:
                    score += 0.25
                    checks_passed += 1
                    logger.info(f"  ⚠️  Face {i}: High edge density ({edge_density:.4f})")
                
                # CHECK 2: Color consistency (IMPROVED)
                total_checks += 1
                if x1_pad < x1 and y1_pad < y1:
                    # Get face and surrounding regions
                    face_region = face_with_context[padding:padding+face.shape[0], 
                                                   padding:padding+face.shape[1]]
                    
                    # Top surrounding
                    top_surround = face_with_context[:padding, padding:padding+face.shape[1]]
                    # Left surrounding
                    left_surround = face_with_context[padding:padding+face.shape[0], :padding]
                    
                    if top_surround.size > 100 and left_surround.size > 100:
                        face_color = np.mean(face_region, axis=(0, 1))
                        surround_color = (np.mean(top_surround, axis=(0, 1)) + 
                                        np.mean(left_surround, axis=(0, 1))) / 2
                        
                        color_diff = np.linalg.norm(face_color - surround_color)
                        
                        # Face-swaps have color mismatches
                        if color_diff > 25:
                            score += 0.30
                            checks_passed += 1
                            logger.info(f"  ⚠️  Face {i}: Color mismatch ({color_diff:.2f})")
                
                # CHECK 3: Blending artifacts (IMPROVED)
                total_checks += 1
                laplacian = cv2.Laplacian(gray_face, cv2.CV_64F)
                laplacian_var = laplacian.var()
                
                # Face-swaps are often over-smoothed
                if laplacian_var < 100:
                    score += 0.25
                    checks_passed += 1
                    logger.info(f"  ⚠️  Face {i}: Over-smoothed ({laplacian_var:.2f})")
                
                # CHECK 4: Frequency domain analysis (NEW)
                total_checks += 1
                # Apply FFT to detect unnatural frequency patterns
                f_transform = np.fft.fft2(gray_face)
                f_shift = np.fft.fftshift(f_transform)
                magnitude = np.abs(f_shift)
                
                # Check for unusual frequency distribution
                center_y, center_x = magnitude.shape[0]//2, magnitude.shape[1]//2
                center_region = magnitude[center_y-10:center_y+10, center_x-10:center_x+10]
                outer_region = magnitude.copy()
                outer_region[center_y-10:center_y+10, center_x-10:center_x+10] = 0
                
                center_energy = np.mean(center_region)
                outer_energy = np.mean(outer_region[outer_region > 0])
                
                if outer_energy > 0:
                    freq_ratio = center_energy / outer_energy
                    # Face-swaps have unusual frequency distributions
                    if freq_ratio > 100 or freq_ratio < 10:
                        score += 0.20
                        checks_passed += 1
                        logger.info(f"  ⚠️  Face {i}: Unusual frequency pattern ({freq_ratio:.2f})")
                
                # Normalize score
                final_face_score = min(score, 1.0)
                face_scores.append(final_face_score)
                
                logger.info(f"👤 Face {i}: {checks_passed}/{total_checks} checks failed, score={final_face_score:.4f}")
            
            if not face_scores:
                return 0.3
            
            # Return maximum score (if any face looks swapped, flag it)
            final_score = max(face_scores)
            logger.info(f"👤 Face-swap detection final: {final_score:.4f}")
            return final_score
            
        except Exception as e:
            logger.error(f"Face-swap detection error: {e}")
            return 0.5
    
    def detect_manipulation_artifacts(self, image_np: np.ndarray) -> float:
        """
        IMPROVED manipulation artifact detection.
        Returns: Score 0-1 (higher = more likely manipulated)
        """
        try:
            # Convert to grayscale
            if len(image_np.shape) == 3:
                gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
            else:
                gray = image_np
            
            score = 0.0
            checks_passed = 0
            total_checks = 0
            
            # CHECK 1: JPEG compression artifacts (IMPROVED)
            total_checks += 1
            # Resize for DCT if too large
            if gray.shape[0] > 512 or gray.shape[1] > 512:
                gray_small = cv2.resize(gray, (512, 512))
            else:
                gray_small = gray
            
            dct = cv2.dct(np.float32(gray_small) / 255.0)
            dct_abs = np.abs(dct)
            
            # Check high-frequency components
            h, w = dct_abs.shape
            high_freq = dct_abs[h//2:, w//2:]
            low_freq = dct_abs[:h//4, :w//4]
            
            hf_mean = np.mean(high_freq)
            lf_mean = np.mean(low_freq)
            
            if lf_mean > 0:
                freq_ratio = hf_mean / lf_mean
                # Manipulated images have unusual frequency ratios
                if freq_ratio > 0.15 or freq_ratio < 0.01:
                    score += 0.25
                    checks_passed += 1
                    logger.info(f"  ⚠️  Unusual DCT pattern ({freq_ratio:.4f})")
            
            # CHECK 2: Noise consistency (IMPROVED)
            total_checks += 1
            # Apply high-pass filter
            kernel = np.array([[-1, -1, -1],
                             [-1,  8, -1],
                             [-1, -1, -1]], dtype=np.float32)
            noise = cv2.filter2D(gray, cv2.CV_32F, kernel)
            noise_std = np.std(noise)
            
            # Manipulated images have inconsistent noise
            if noise_std < 5 or noise_std > 30:
                score += 0.30
                checks_passed += 1
                logger.info(f"  ⚠️  Inconsistent noise ({noise_std:.2f})")
            
            # CHECK 3: Edge consistency (IMPROVED)
            total_checks += 1
            edges = cv2.Canny(gray, 50, 150)
            edge_density = np.sum(edges > 0) / edges.size
            
            # Check edge distribution
            h_edges = np.sum(edges, axis=0)
            v_edges = np.sum(edges, axis=1)
            
            h_var = np.var(h_edges)
            v_var = np.var(v_edges)
            
            # Manipulated images have uneven edge distribution
            if edge_density < 0.01 or edge_density > 0.20:
                score += 0.20
                checks_passed += 1
                logger.info(f"  ⚠️  Unusual edge density ({edge_density:.4f})")
            
            # CHECK 4: Color histogram analysis (NEW)
            total_checks += 1
            if len(image_np.shape) == 3:
                # Analyze color distribution
                hist_r = cv2.calcHist([image_np], [0], None, [256], [0, 256])
                hist_g = cv2.calcHist([image_np], [1], None, [256], [0, 256])
                hist_b = cv2.calcHist([image_np], [2], None, [256], [0, 256])
                
                # Check for unnatural color distributions
                r_peaks = len([i for i in range(1, 255) if hist_r[i] > hist_r[i-1] and hist_r[i] > hist_r[i+1]])
                g_peaks = len([i for i in range(1, 255) if hist_g[i] > hist_g[i-1] and hist_g[i] > hist_g[i+1]])
                b_peaks = len([i for i in range(1, 255) if hist_b[i] > hist_b[i-1] and hist_b[i] > hist_b[i+1]])
                
                avg_peaks = (r_peaks + g_peaks + b_peaks) / 3
                
                # AI images often have too few or too many peaks
                if avg_peaks < 5 or avg_peaks > 50:
                    score += 0.25
                    checks_passed += 1
                    logger.info(f"  ⚠️  Unusual color distribution ({avg_peaks:.1f} peaks)")
            
            final_score = min(score, 1.0)
            logger.info(f"🔍 Artifact detection: {checks_passed}/{total_checks} checks failed, score={final_score:.4f}")
            return final_score
            
        except Exception as e:
            logger.error(f"Artifact detection error: {e}")
            return 0.5
    
    async def detect_image(self, image_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        IMPROVED comprehensive deepfake detection.
        """
        start_time = datetime.now(timezone.utc)
        
        try:
            # Load image
            image = Image.open(io.BytesIO(image_bytes))
            image = image.convert('RGB')
            image_np = np.array(image)
            
            # Resize if too large (but keep reasonable quality)
            max_size = 1024
            if max(image.size) > max_size:
                ratio = max_size / max(image.size)
                new_size = tuple(int(dim * ratio) for dim in image.size)
                image = image.resize(new_size, Image.Resampling.LANCZOS)
                image_np = np.array(image)
            
            logger.info(f"📸 Analyzing: {filename}, size: {image.size}")
            
            # Run all detection methods
            ai_score = self.detect_ai_generated(image)
            face_swap_score = self.detect_face_swap(image_np)
            artifact_score = self.detect_manipulation_artifacts(image_np)
            
            # IMPROVED: Adaptive weighting based on content
            has_faces = face_swap_score > 0.3
            
            if has_faces:
                # If faces detected, give more weight to face-swap detection
                final_score = (
                    ai_score * 0.30 +
                    face_swap_score * 0.50 +
                    artifact_score * 0.20
                )
            else:
                # No faces, rely more on AI and artifact detection
                final_score = (
                    ai_score * 0.60 +
                    face_swap_score * 0.10 +
                    artifact_score * 0.30
                )
            
            # IMPROVED: Better verdict thresholds
            if final_score >= 0.55:  # Lowered from 0.60
                verdict = "FAKE"
                # Confidence increases with score
                confidence = 0.5 + (final_score - 0.55) * 1.11  # Maps 0.55-1.0 to 0.5-1.0
            elif final_score <= 0.45:  # Raised from 0.40
                verdict = "REAL"
                # Confidence increases as score decreases
                confidence = 0.5 + (0.45 - final_score) * 1.11  # Maps 0.0-0.45 to 1.0-0.5
            else:
                verdict = "SUSPICIOUS"
                confidence = 0.5  # Low confidence for borderline cases
            
            # Cap confidence at reasonable levels
            confidence = min(max(confidence, 0.5), 0.95)
            
            end_time = datetime.now(timezone.utc)
            processing_time = int((end_time - start_time).total_seconds() * 1000)
            
            logger.info(f"✅ VERDICT: {verdict} | Score: {final_score:.4f} | Confidence: {confidence:.4f}")
            
            return {
                "verdict": verdict,
                "confidence": round(confidence, 4),
                "details": {
                    "ai_generated_probability": round(final_score, 4),
                    "detection_method": "improved_hybrid_ensemble",
                    "model_version": "Improved-Hybrid-v2",
                    "processing_time_ms": processing_time,
                    "method_scores": {
                        "ai_generated": round(ai_score, 4),
                        "face_swap": round(face_swap_score, 4),
                        "manipulation_artifacts": round(artifact_score, 4)
                    },
                    "analysis_methods": [
                        "Enhanced CLIP AI Detection",
                        "Advanced Face-Swap Detection",
                        "Improved Artifact Detection"
                    ]
                }
            }
            
        except Exception as e:
            logger.error(f"Detection failed: {e}")
            raise RuntimeError(f"Failed to analyze image: {e}")
    
    async def detect_video(self, video_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        IMPROVED video detection.
        """
        try:
            import tempfile
            from pathlib import Path
            
            # Save video temporarily
            with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp:
                tmp.write(video_bytes)
                tmp_path = tmp.name
            
            # Open video
            cap = cv2.VideoCapture(tmp_path)
            
            if not cap.isOpened():
                raise RuntimeError("Failed to open video file")
            
            # Get video properties
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            logger.info(f"🎬 Video: {filename}, FPS: {fps}, Frames: {total_frames}")
            
            # Sample more frames for better accuracy
            num_samples = min(15, total_frames)  # Increased from 10
            frame_interval = max(1, total_frames // num_samples)
            frame_scores = []
            
            frame_idx = 0
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                if frame_idx % frame_interval == 0:
                    # Convert BGR to RGB
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    pil_image = Image.fromarray(frame_rgb)
                    
                    # Convert to bytes
                    img_bytes = io.BytesIO()
                    pil_image.save(img_bytes, format='JPEG', quality=95)
                    img_bytes.seek(0)
                    
                    # Analyze frame
                    result = await self.detect_image(img_bytes.getvalue(), f"frame_{frame_idx}")
                    frame_scores.append(result['details']['ai_generated_probability'])
                    
                    logger.info(f"🎬 Frame {frame_idx}: {result['verdict']} ({result['confidence']:.4f})")
                
                frame_idx += 1
            
            cap.release()
            Path(tmp_path).unlink()
            
            if not frame_scores:
                raise RuntimeError("No frames could be analyzed")
            
            # IMPROVED: Better aggregation
            avg_score = np.mean(frame_scores)
            max_score = np.max(frame_scores)
            median_score = np.median(frame_scores)
            
            # Weight: average 50%, median 30%, max 20%
            final_score = avg_score * 0.5 + median_score * 0.3 + max_score * 0.2
            
            # Determine verdict with improved thresholds
            if final_score >= 0.55:
                verdict = "FAKE"
                confidence = 0.5 + (final_score - 0.55) * 1.11
            elif final_score <= 0.45:
                verdict = "REAL"
                confidence = 0.5 + (0.45 - final_score) * 1.11
            else:
                verdict = "SUSPICIOUS"
                confidence = 0.5
            
            confidence = min(max(confidence, 0.5), 0.95)
            
            logger.info(f"🎬 Video verdict: {verdict} (avg: {avg_score:.4f}, median: {median_score:.4f}, max: {max_score:.4f})")
            
            return {
                "verdict": verdict,
                "confidence": round(confidence, 4),
                "details": {
                    "average_ai_probability": round(avg_score, 4),
                    "median_ai_probability": round(median_score, 4),
                    "max_ai_probability": round(max_score, 4),
                    "frames_analyzed": len(frame_scores),
                    "detection_method": "improved_hybrid_ensemble_video",
                    "model_version": "Improved-Hybrid-Video-v2"
                }
            }
            
        except Exception as e:
            logger.error(f"Video detection failed: {e}")
            raise RuntimeError(f"Failed to analyze video: {e}")


# Global improved detector instance
improved_hybrid_detector = ImprovedHybridDetector()
