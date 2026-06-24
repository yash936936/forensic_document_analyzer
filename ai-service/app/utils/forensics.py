import cv2
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
import os

def perform_ela(image_path, quality=90):
    """
    Performs Error Level Analysis on an image.
    """
    temp_file = "temp_ela.jpg"
    
    # Open original image
    original = Image.open(image_path).convert('RGB')
    
    # Save it with a specific JPEG quality
    original.save(temp_file, 'JPEG', quality=quality)
    
    # Re-open and compare
    temporary = Image.open(temp_file)
    
    # Calculate the absolute difference between original and the resaved version
    ela_image = ImageChops.difference(original, temporary)
    
    # Enhance the difference for visualization
    extrema = ela_image.getextrema()
    max_diff = max([ex[1] for ex in extrema])
    if max_diff == 0:
        max_diff = 1
    
    scale = 255.0 / max_diff
    ela_image = ImageEnhance.Brightness(ela_image).enhance(scale)
    
    # Cleanup
    if os.path.exists(temp_file):
        os.remove(temp_file)
        
    return ela_image

def calculate_fraud_score(image_path):
    """
    Analyzes the ELA image and returns a probability score of tampering.
    """
    ela_img = perform_ela(image_path)
    # Convert to numpy for analysis
    ela_data = np.array(ela_img)
    
    # Higher average brightness in ELA usually means more modification
    mean_val = np.mean(ela_data)
    
    # Simple heuristic: map mean value to a 0-100 score
    # Usually, background noise is low. Tampered areas are bright.
    score = min(100, int(mean_val * 10)) 
    
    return score
