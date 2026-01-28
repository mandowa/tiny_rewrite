#!/usr/bin/env python3
"""
Visual expression of Linguistic Flow philosophy
Creating a masterpiece for the Writing Suggestion App
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Canvas dimensions (1920x1080 - modern web resolution)
width, height = 1920, 1080

# Create image with gradient background
img = Image.new('RGB', (width, height), color='#667eea')

# Create gradient background
draw = ImageDraw.Draw(img, 'RGBA')

# Gradient effect - layered ellipses with transparency
for i in range(100):
    alpha = int(255 * (1 - i/100) * 0.3)
    color = (118, 75, 162, alpha)  # #764ba2 with varying alpha
    offset = i * 5
    draw.ellipse([width * 0.7 - offset, height * 0.8 - offset, 
                  width * 1.2 + offset, height * 1.3 + offset], 
                 fill=color)

# Another gradient layer
for i in range(80):
    alpha = int(255 * (1 - i/80) * 0.2)
    color = (99, 102, 241, alpha)  # #6366f1 with varying alpha
    offset = i * 4
    draw.ellipse([-width * 0.2 - offset, height * 0.3 - offset, 
                  width * 0.5 + offset, height * 0.8 + offset], 
                 fill=color)

# Load fonts
try:
    font_dir = ".agents/skills/canvas-design/canvas-fonts"
    title_font = ImageFont.truetype(f'{font_dir}/WorkSans-Bold.ttf', 80)
    subtitle_font = ImageFont.truetype(f'{font_dir}/InstrumentSans-Regular.ttf', 28)
    label_font = ImageFont.truetype(f'{font_dir}/WorkSans-Regular.ttf', 18)
    small_font = ImageFont.truetype(f'{font_dir}/GeistMono-Regular.ttf', 16)
except:
    # Fallback to default font
    title_font = ImageFont.load_default()
    subtitle_font = ImageFont.load_default()
    label_font = ImageFont.load_default()
    small_font = ImageFont.load_default()

# Draw title
title_text = "Linguistic Flow"
title_bbox = draw.textbbox((0, 0), title_text, font=title_font)
title_width = title_bbox[2] - title_bbox[0]
draw.text((width//2 - title_width//2, height * 0.12), title_text, 
          fill=(255, 255, 255, 255), font=title_font)

# Draw subtitle
subtitle_text = "Transform · Refine · Express"
subtitle_bbox = draw.textbbox((0, 0), subtitle_text, font=subtitle_font)
subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
draw.text((width//2 - subtitle_width//2, height * 0.22), subtitle_text, 
          fill=(255, 255, 255, 200), font=subtitle_font)

# Central composition - three transformation cards
card_y = int(height * 0.35)
card_height = int(height * 0.45)
card_width = int(width * 0.25)
card_spacing = int(width * 0.04)
start_x = int(width * 0.5 - (card_width * 1.5 + card_spacing))

labels = ["EMAIL", "TEAMS", "SPEAKING"]
colors = [(238, 242, 255), (238, 242, 255), (238, 242, 255)]

for i, (label, color) in enumerate(zip(labels, colors)):
    card_x = start_x + i * (card_width + card_spacing)
    
    # Card shadow
    shadow_offset = 8
    draw.rounded_rectangle(
        [card_x + shadow_offset, card_y + shadow_offset, 
         card_x + card_width + shadow_offset, card_y + card_height + shadow_offset],
        radius=24, fill=(0, 0, 0, 30)
    )
    
    # Card background
    draw.rounded_rectangle(
        [card_x, card_y, card_x + card_width, card_y + card_height],
        radius=24, fill=(255, 255, 255, 255)
    )
    
    # Inner content area
    inner_x = card_x + 40
    inner_y = card_y + 60
    inner_width = card_width - 80
    inner_height = card_height - 120
    
    draw.rounded_rectangle(
        [inner_x, inner_y, inner_x + inner_width, inner_y + inner_height],
        radius=16, fill=(*color, 128)
    )
    
    # Flowing lines - text transformation visualization
    for j in range(6):
        line_y = inner_y + 40 + j * 50
        line_width = inner_width * (0.8 - j * 0.08)
        line_x_start = inner_x + (inner_width - line_width) // 2
        draw.line(
            [(line_x_start, line_y), (line_x_start + line_width, line_y)],
            fill=(99, 102, 241, 80), width=3
        )
    
    # Label
    label_bbox = draw.textbbox((0, 0), label, font=label_font)
    label_width = label_bbox[2] - label_bbox[0]
    draw.text((card_x + card_width//2 - label_width//2, card_y + card_height - 45), 
              label, fill=(100, 116, 139, 255), font=label_font)

# Flow markers - top right
for i in range(10):
    x = int(width * 0.88 + i * 15)
    y = int(height * 0.08 - i * 5)
    size = 6 - i * 0.3
    draw.ellipse([x - size, y - size, x + size, y + size], 
                 fill=(255, 255, 255, 80))

# Footer text
footer_text = "AI-Powered Language Refinement"
footer_bbox = draw.textbbox((0, 0), footer_text, font=small_font)
footer_width = footer_bbox[2] - footer_bbox[0]
draw.text((width//2 - footer_width//2, height * 0.92), footer_text, 
          fill=(255, 255, 255, 150), font=small_font)

# Save the image
img.save("writing-app-design.png", quality=95)
print("✨ Design created: writing-app-design.png")
print("📐 Dimensions: 1920 x 1080 pixels")
print("🎨 Philosophy: Linguistic Flow - transformation through visual rhythm")
