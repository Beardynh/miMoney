import os

file_path = "/home/bearydnh/Escritorio/miPlata/frontend/miplata/src/main.jsx"
with open(file_path, "r") as f:
    content = f.read()

# Typography
content = content.replace("'Outfit',sans-serif", "'Inter', sans-serif")
content = content.replace("'Nunito',sans-serif", "'Inter', sans-serif")
content = content.replace("Outfit:wght@300;400;500;600;700;800;900&family=Nunito:wght@400;500;600;700;800", "Inter:wght@300;400;500;600;700;800")

# Backgrounds
content = content.replace("#0a0a14", "#000000") # Main bg
content = content.replace("#0e0e1a", "#000000") # Header/Sidebar
content = content.replace("#12121f", "#111111") # Cards

# Borders
content = content.replace("#1e1e35", "#27272a") # Border

# Text
content = content.replace("#e0e0e0", "#ffffff") # Main text
content = content.replace("#6b7a8d", "#a1a1aa") # Muted
content = content.replace("#4a4a6a", "#888888") # Muted 2
content = content.replace("#6b5a5a", "#a1a1aa") # Muted 3

# Accent Colors (matching the image)
# Ingresos/Positive: Green
content = content.replace("#c3f73a", "#10b981") # Neon yellow -> Emerald green
content = content.replace("#a0c830", "#059669") # Darker green

# Gastos/Negative: Red
content = content.replace("#ff6b6b", "#ef4444")
content = content.replace("#ff4757", "#f87171")

# Ahorro/Deudas/Neutral: Blue (instead of orange)
content = content.replace("#ffa502", "#3b82f6") # Orange -> Blue

with open(file_path, "w") as f:
    f.write(content)

index_path = "/home/bearydnh/Escritorio/miPlata/frontend/miplata/src/index.css"
with open(index_path, "r") as f:
    idx_content = f.read()

idx_content = idx_content.replace("#0a0a14", "#000000")
idx_content = idx_content.replace("#1e1e35", "#27272a")

with open(index_path, "w") as f:
    f.write(idx_content)

print("Styles updated successfully!")
