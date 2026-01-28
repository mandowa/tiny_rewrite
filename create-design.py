#!/usr/bin/env python3
"""
Visual expression of Linguistic Flow philosophy
Creating a masterpiece for the Writing Suggestion App
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# Register fonts
font_dir = "../.agents/skills/canvas-design/canvas-fonts"
pdfmetrics.registerFont(TTFont('WorkSans-Regular', f'{font_dir}/WorkSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('WorkSans-Bold', f'{font_dir}/WorkSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('InstrumentSans-Regular', f'{font_dir}/InstrumentSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('GeistMono-Regular', f'{font_dir}/GeistMono-Regular.ttf'))

# Canvas setup
width, height = letter  # 8.5 x 11 inches
c = canvas.Canvas("writing-app-design.pdf", pagesize=letter)

# Color palette - soft, flowing gradients
color_deep_purple = (0.4, 0.27, 0.64)  # #667eea
color_soft_purple = (0.46, 0.29, 0.64)  # #764ba2
color_light_purple = (0.93, 0.95, 1.0)  # #eef2ff
color_accent = (0.38, 0.4, 0.95)  # #6366f1
color_white = (1, 1, 1)
color_text_dark = (0.06, 0.09, 0.16)  # #0f172a
color_text_light = (0.39, 0.45, 0.55)  # #64748b

# Background - subtle gradient effect through layered rectangles
def draw_gradient_background():
    """Create flowing gradient background"""
    # Base layer - deep purple
    c.setFillColorRGB(*color_deep_purple)
    c.rect(0, 0, width, height, fill=1, stroke=0)
    
    # Flowing organic shapes with transparency
    c.setFillColorRGB(0.46, 0.29, 0.64, alpha=0.6)
    c.ellipse(width * 0.7, height * 0.8, width * 1.2, height * 1.3, fill=1, stroke=0)
    
    c.setFillColorRGB(0.38, 0.4, 0.95, alpha=0.3)
    c.ellipse(-width * 0.2, height * 0.3, width * 0.5, height * 0.8, fill=1, stroke=0)

# Main composition
def draw_main_composition():
    """Create the central visual narrative"""
    
    # Central card - the transformation space
    card_x = width * 0.15
    card_y = height * 0.35
    card_width = width * 0.7
    card_height = height * 0.4
    corner_radius = 24
    
    # Card shadow (subtle)
    c.setFillColorRGB(0, 0, 0, alpha=0.1)
    c.roundRect(card_x + 4, card_y - 4, card_width, card_height, corner_radius, fill=1, stroke=0)
    
    # Card background
    c.setFillColorRGB(*color_white)
    c.roundRect(card_x, card_y, card_width, card_height, corner_radius, fill=1, stroke=0)
    
    # Three transformation zones - representing Email, Teams, Speaking
    zone_width = card_width * 0.28
    zone_height = card_height * 0.6
    zone_y = card_y + card_height * 0.2
    zone_spacing = card_width * 0.06
    
    zones = [
        (card_x + zone_spacing, "EMAIL", (0.93, 0.95, 1.0)),
        (card_x + zone_spacing + zone_width + zone_spacing, "TEAMS", (0.93, 0.95, 1.0)),
        (card_x + zone_spacing + (zone_width + zone_spacing) * 2, "SPEAKING", (0.93, 0.95, 1.0))
    ]
    
    for zone_x, label, zone_color in zones:
        # Zone background with subtle gradient
        c.setFillColorRGB(*zone_color, alpha=0.5)
        c.roundRect(zone_x, zone_y, zone_width, zone_height, 16, fill=1, stroke=0)
        
        # Flowing lines - representing text transformation
        c.setStrokeColorRGB(*color_accent, alpha=0.3)
        c.setLineWidth(1.5)
        for i in range(5):
            y_pos = zone_y + zone_height * 0.2 + i * (zone_height * 0.12)
            line_width = zone_width * (0.7 - i * 0.08)
            c.line(zone_x + zone_width * 0.15, y_pos, 
                   zone_x + zone_width * 0.15 + line_width, y_pos)
        
        # Label - whispered typography
        c.setFillColorRGB(*color_text_light)
        c.setFont('WorkSans-Regular', 7)
        c.drawCentredString(zone_x + zone_width/2, zone_y + zone_height * 0.85, label)

# Title and subtle branding
def draw_title():
    """Minimal, elegant title"""
    # Main title - positioned with breathing room
    c.setFillColorRGB(*color_white)
    c.setFont('WorkSans-Bold', 32)
    c.drawCentredString(width/2, height * 0.85, "Linguistic Flow")
    
    # Subtitle - whispered
    c.setFont('InstrumentSans-Regular', 11)
    c.setFillColorRGB(*color_white, alpha=0.8)
    c.drawCentredString(width/2, height * 0.81, "Transform · Refine · Express")

# Footer - minimal attribution
def draw_footer():
    """Subtle footer with essential information"""
    c.setFont('GeistMono-Regular', 7)
    c.setFillColorRGB(*color_white, alpha=0.6)
    c.drawCentredString(width/2, height * 0.08, "Writing Suggestion Application")
    c.drawCentredString(width/2, height * 0.05, "AI-Powered Language Refinement")

# Decorative elements - organic flow markers
def draw_flow_markers():
    """Subtle visual markers suggesting flow and transformation"""
    # Top right - flowing dots
    c.setFillColorRGB(*color_white, alpha=0.3)
    for i in range(8):
        x = width * 0.85 + i * 8
        y = height * 0.92 - i * 3
        size = 3 - i * 0.2
        c.circle(x, y, size, fill=1, stroke=0)
    
    # Bottom left - transformation arc
    c.setStrokeColorRGB(*color_white, alpha=0.2)
    c.setLineWidth(2)
    c.arc(width * 0.05, height * 0.15, width * 0.25, height * 0.35, 
          startAng=0, extent=90, fromCenter=False)

# Compose the masterpiece
draw_gradient_background()
draw_flow_markers()
draw_main_composition()
draw_title()
draw_footer()

# Save
c.save()
print("✨ Design created: writing-app-design.pdf")
print("📐 Dimensions: 8.5 x 11 inches (US Letter)")
print("🎨 Philosophy: Linguistic Flow - transformation through visual rhythm")
