import os

file_path = "/home/bearydnh/Escritorio/miPlata/frontend/miplata/src/main.jsx"
with open(file_path, "r") as f:
    content = f.read()

# Typography (JetBrains Mono for the tech vibe)
content = content.replace("'Outfit',sans-serif", "'JetBrains Mono', monospace")
content = content.replace("'Nunito',sans-serif", "'JetBrains Mono', monospace")
content = content.replace("'Inter', sans-serif", "'JetBrains Mono', monospace")
content = content.replace("'Inter',sans-serif", "'JetBrains Mono', monospace")

# Backgrounds - lighter dark theme
content = content.replace("background:\"#000000\"", "background:\"#121212\"") # Main bg
content = content.replace("background:\"#0a0a14\"", "background:\"#121212\"") # Main bg fallback
content = content.replace("background:\"#111111\"", "background:\"#1e1e24\"") # Cards
content = content.replace("background:\"#12121f\"", "background:\"#1e1e24\"") # Cards fallback

content = content.replace("border:\"1px solid #27272a\"", "border:\"1px solid #3f3f46\"") # Borders
content = content.replace("border:\"1px solid #1e1e35\"", "border:\"1px solid #3f3f46\"") # Borders fallback

# Sidebar / Header
content = content.replace("background:\"#0e0e1a\"", "background:\"#18181b\"")

# Text colors
content = content.replace("color:\"#ffffff\"", "color:\"#f4f4f5\"")
content = content.replace("color:\"#e0e0e0\"", "color:\"#f4f4f5\"")

# Dots / Accents (Image mapping)
# Ingresos -> Blue (#3b82f6)
content = content.replace("#10b981", "#3b82f6") # Green to Blue
content = content.replace("#c3f73a", "#3b82f6") # Old neon green to Blue
content = content.replace("text:\"#a0c830\"", "color:\"#60a5fa\"")

# Gastos -> Red (#ef4444)
content = content.replace("#ff6b6b", "#ef4444")
content = content.replace("#ff4757", "#ef4444")

# Balance / General accents -> Green (#10b981)
# Ahorro -> White / Gray (#e4e4e7)

with open(file_path, "w") as f:
    f.write(content)

index_path = "/home/bearydnh/Escritorio/miPlata/frontend/miplata/src/index.css"
with open(index_path, "r") as f:
    idx_content = f.read()

idx_content = idx_content.replace("#000000", "#121212")
idx_content = idx_content.replace("#0a0a14", "#121212")
idx_content = idx_content.replace("#27272a", "#3f3f46")
idx_content = idx_content.replace("#1e1e35", "#3f3f46")

with open(index_path, "w") as f:
    f.write(idx_content)

print("Styles updated successfully!")
