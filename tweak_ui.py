import os

file_path = "/home/bearydnh/Escritorio/miPlata/frontend/miplata/src/main.jsx"
with open(file_path, "r") as f:
    content = f.read()

# Make the dark gray labels more visible
content = content.replace('color:"#3a3a5a"', 'color:"#a1a1aa"')

# Change the input amounts to white instead of blue
content = content.replace('color:"#3b82f6",fontSize:18', 'color:"#ffffff",fontSize:18')

# Change the sidebar nav selected state (no background, just bright text vs dim text)
content = content.replace('background:view===n.id?"#3b82f6":"transparent",color:view===n.id?"#000000":"#a1a1aa"', 'background:"transparent",color:view===n.id?"#ffffff":"#71717a"')

# Fix any leftover 'Outfit' fonts
content = content.replace("'Outfit'", "'JetBrains Mono', monospace")

with open(file_path, "w") as f:
    f.write(content)

print("UI tweaks applied successfully!")
