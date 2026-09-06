from PIL import Image

def remove_black_background(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    for item in datas:
        r, g, b, a = item
        brightness = max(r, g, b)
        # If very dark/black, make transparent
        if brightness < 18:
            new_data.append((r, g, b, 0))
        elif brightness < 50:
            # Smooth feathering on outer glow
            alpha = int(((brightness - 18) / (50 - 18)) * 255)
            new_data.append((r, g, b, alpha))
        else:
            new_data.append((r, g, b, 255))
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print("Saved transparent logo to", output_path)

if __name__ == "__main__":
    remove_black_background("logo.jpeg", "public/logo.png")
    remove_black_background("logo.jpeg", "public/logo-transparent.png")
