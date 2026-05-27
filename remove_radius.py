import re
import os

file_path = "/home/bearydnh/Escritorio/miPlata/frontend/miplata/src/main.jsx"

with open(file_path, "r") as f:
    content = f.read()

# Replace all numeric borderRadius values with 0
# Match borderRadius: 12, borderRadius: 24, etc.
content = re.sub(r'borderRadius:\s*\d+', 'borderRadius: 0', content)

# Match string-based ones like borderRadius: "12px"
content = re.sub(r'borderRadius:\s*"[^%]+?"', 'borderRadius: 0', content)

with open(file_path, "w") as f:
    f.write(content)

print("Border radius removed successfully!")
