import os

file_path = "/home/bearydnh/Escritorio/miPlata/frontend/miplata/src/main.jsx"
with open(file_path, "r") as f:
    content = f.read()

# Typography (Make it JetBrains Mono globally for that sleek tech look)
content = content.replace("'Inter', sans-serif", "'JetBrains Mono', monospace")
content = content.replace("'Nunito',sans-serif", "'JetBrains Mono', monospace")

# Backgrounds - making them "un poco mas claros"
content = content.replace("background:\"#000000\"", "background:\"#121212\"") # Main bg
content = content.replace("background:\"#111111\"", "background:\"#1e1e24\"") # Cards
content = content.replace("border:\"1px solid #27272a\"", "border:\"1px solid #3f3f46\"") # Borders

# Adjust Header / Nav backgrounds
content = content.replace("background:\"#09090b\"", "background:\"#18181b\"")
content = content.replace("background:\"#0e0e1a\"", "background:\"#18181b\"")

# Text colors
content = content.replace("color:\"#ffffff\"", "color:\"#f4f4f5\"") # slightly softer white
content = content.replace("color:\"#a1a1aa\"", "color:\"#a1a1aa\"")
content = content.replace("color:\"#888888\"", "color:\"#71717a\"")

# Accent colors based on the image
# Image uses: Ingresos (Blue), Gastos (Red), Balance (Green), Ahorro (White/Gray)
# Since we mapped Ingresos to #10b981 (Green) previously, let's map it to Blue #3b82f6
content = content.replace("#10b981", "#3b82f6") # Green -> Blue (Ingresos)
content = content.replace("#059669", "#2563eb") # Dark Green -> Dark Blue

# Ahorro was Blue #3b82f6, make it White/Light Gray #f4f4f5
# Wait, I just replaced #10b981 with #3b82f6, I need to be careful with replace order.
# Let's read the current file and just do it carefully.
