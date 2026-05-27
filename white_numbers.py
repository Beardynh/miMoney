import os
import re

file_path = "/home/bearydnh/Escritorio/miPlata/frontend/miplata/src/main.jsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. Main top cards: color:s.color -> color:"#ffffff"
content = content.replace('color:s.color,fontFamily:"\'JetBrains Mono\',monospace"', 'color:"#ffffff",fontFamily:"\'JetBrains Mono\',monospace"')

# 2. Presupuesto ratio: color:over?"#ef4444":near?"#3b82f6":"#3b82f6" -> color:"#ffffff"
content = content.replace('color:over?"#ef4444":near?"#3b82f6":"#3b82f6",fontFamily:"\'JetBrains Mono\',monospace"', 'color:"#ffffff",fontFamily:"\'JetBrains Mono\',monospace"')

# 3. Meta Ahorro ratio: color:"#3b82f6" -> color:"#ffffff"
content = content.replace('color:"#3b82f6",fontFamily:"\'JetBrains Mono\',monospace"', 'color:"#ffffff",fontFamily:"\'JetBrains Mono\',monospace"')

# 4. Desglose category values: color:c.color,fontFamily:"'JetBrains Mono',monospace" -> color:"#ffffff"
content = content.replace('color:c.color,fontFamily:"\'JetBrains Mono\',monospace"', 'color:"#ffffff",fontFamily:"\'JetBrains Mono\',monospace"')

# 5. Ultimos movimientos / Txs list: t.type==="income"?"#22d3ee":"#ef4444" -> "#ffffff"
content = content.replace('color:t.type==="income"?"#22d3ee":"#ef4444"', 'color:"#ffffff"')

# 6. Deudas card value: color:c.color,fontFamily:"'JetBrains Mono',monospace" (Already covered by #4, wait, let's just make sure)

with open(file_path, "w") as f:
    f.write(content)

print("Numbers updated to white successfully!")
