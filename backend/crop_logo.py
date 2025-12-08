from PIL import Image
import os

def crop_transparent_borders(image_path):
    try:
        img = Image.open(image_path)
        img = img.convert("RGBA")
        
        # Get the bounding box of the non-zero regions
        bbox = img.getbbox()
        
        if bbox:
            print(f"Original size: {img.size}")
            print(f"Detected content bbox: {bbox}")
            
            # Crop the image to the bounding box
            cropped_img = img.crop(bbox)
            
            # Save the result, overwriting the original or creating a new one
            cropped_img.save(image_path)
            print(f"Successfully cropped and saved to {image_path}")
            print(f"New size: {cropped_img.size}")
        else:
            print("Image is completely transparent or empty.")
            
    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == "__main__":
    # Correct absolute path to the logo file based on previous interactions
    logo_path = r"x:\Saisonalitäten Auswertung\frontend\src\assets\lucid_alpha_logo.png"
    crop_transparent_borders(logo_path)
