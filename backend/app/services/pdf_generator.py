import io
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_pdf_report(report_data: Dict[str, Any], interview_type: str) -> io.BytesIO:
    """
    Generates a beautifully typeset PDF report using ReportLab.
    Returns a BytesIO stream containing the binary PDF data.
    """
    buffer = io.BytesIO()
    
    # Page setup
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    story = []
    
    # Custom Palette
    primary_color = colors.HexColor("#4f46e5")    # Indigo 600
    text_dark = colors.HexColor("#1f2937")        # Gray 800
    accent_green = colors.HexColor("#16a34a")     # Green 600
    accent_red = colors.HexColor("#dc2626")       # Red 600
    
    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=primary_color,
        spaceAfter=10
    )
    
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=14,
        textColor=colors.HexColor("#4b5563"),
        spaceAfter=15
    )
    
    h2_style = ParagraphStyle(
        "H2Style",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=18,
        textColor=primary_color,
        spaceBefore=15,
        spaceAfter=8,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        "BodyStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=text_dark,
        spaceAfter=8
    )
    
    bold_body_style = ParagraphStyle(
        "BoldBodyStyle",
        parent=body_style,
        fontName="Helvetica-Bold"
    )

    bullet_style = ParagraphStyle(
        "BulletStyle",
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    # Document Header
    story.append(Paragraph("InterviewAI Evaluation Report", title_style))
    story.append(Paragraph(f"Category: {interview_type}  |  Generated on: {report_data.get('created_at', 'Now')}", subtitle_style))
    
    # Score Summary Table
    scores = report_data.get("scores", {})
    score_data = [
        [Paragraph("Metric", bold_body_style), Paragraph("Score (100)", bold_body_style)],
        [Paragraph("Overall Score", body_style), Paragraph(f"{scores.get('overall', 0)}", bold_body_style)],
        [Paragraph("Technical Knowledge", body_style), Paragraph(f"{scores.get('technical', 0)}", body_style)],
        [Paragraph("Communication Skills", body_style), Paragraph(f"{scores.get('communication', 0)}", body_style)],
        [Paragraph("Problem Solving", body_style), Paragraph(f"{scores.get('problem_solving', 0)}", body_style)],
        [Paragraph("Confidence & Posture", body_style), Paragraph(f"{scores.get('confidence', 0)}", body_style)]
    ]
    
    t = Table(score_data, colWidths=[200, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f3f4f6")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e5e7eb")),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TEXTCOLOR', (0,0), (-1,-1), text_dark)
    ]))
    
    story.append(t)
    story.append(Spacer(1, 15))
    
    # Summary
    story.append(Paragraph("Executive Summary", h2_style))
    story.append(Paragraph(report_data.get("summary", "No summary provided."), body_style))
    story.append(Spacer(1, 10))
    
    # Strengths
    story.append(Paragraph("Key Strengths", h2_style))
    for strg in report_data.get("strengths", []):
        story.append(Paragraph(f"&bull; {strg}", bullet_style))
    story.append(Spacer(1, 10))
    
    # Weaknesses & actionable items
    story.append(Paragraph("Areas for Improvement", h2_style))
    for weak in report_data.get("weaknesses", []):
        story.append(Paragraph(f"&bull; {weak}", bullet_style))
    story.append(Spacer(1, 10))
    
    # Actionable plan
    story.append(Paragraph("Actionable Improvement Plan", h2_style))
    for step in report_data.get("actionable_improvement_plan", []):
        story.append(Paragraph(f"&bull; {step}", bullet_style))
    
    doc.build(story)
    buffer.seek(0)
    return buffer
