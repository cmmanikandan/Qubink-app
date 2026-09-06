from PIL import Image
from collections import deque

def remove_outer_black_only(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()

    # Visited grid
    visited = [[False for _ in range(height)] for _ in range(width)]
    queue = deque()

    # Seed all 4 edges
    for x in range(width):
        for y in (0, height - 1):
            r, g, b, _ = pixels[x, y]
            if max(r, g, b) < 40:
                queue.append((x, y))
                visited[x][y] = True

    for y in range(height):
        for x in (0, width - 1):
            if not visited[x][y]:
                r, g, b, _ = pixels[x, y]
                if max(r, g, b) < 40:
                    queue.append((x, y))
                    visited[x][y] = True

    # Flood fill
    while queue:
        cx, cy = queue.popleft()
        r, g, b, a = pixels[cx, cy]
        brightness = max(r, g, b)
        
        # Make outer pixel transparent
        pixels[cx, cy] = (r, g, b, 0)

        for nx, ny in ((cx+1, cy), (cx-1, cy), (cx, cy+1), (cx, cy-1)):
            if 0 <= nx < width and 0 <= ny < height and not visited[nx][ny]:
                nr, ng, nb, _ = pixels[nx, ny]
                if max(nr, ng, nb) < 40: # connected dark outer pixel
                    visited[nx][ny] = True
                    queue.append((nx, ny))

    img.save(output_path, "PNG")
    print("Saved outer-transparent logo to", output_path)

if __name__ == "__main__":
    remove_outer_black_only("logo.jpeg", "public/logo-outer-trans.png")
