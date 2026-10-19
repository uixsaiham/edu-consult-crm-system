from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from xml.sax.saxutils import escape
out='output/pdf/behance-case-study-prompt.pdf'
styles={
 'title':ParagraphStyle('title',fontName='Helvetica-Bold',fontSize=30,leading=35,textColor=HexColor('#17243a'),spaceAfter=18),
 'h':ParagraphStyle('h',fontName='Helvetica-Bold',fontSize=16,leading=21,textColor=HexColor('#245fc2'),spaceBefore=17,spaceAfter=9),
 'body':ParagraphStyle('body',fontName='Helvetica',fontSize=10.5,leading=16,textColor=HexColor('#344054'),spaceAfter=9),
 'small':ParagraphStyle('small',fontName='Helvetica',fontSize=9,leading=14,textColor=HexColor('#667085'),spaceAfter=12),
}
story=[]
def p(t,style='body'): story.append(Paragraph(escape(t),styles[style]))
def h(t):p(t,'h')
def bullets(items):
 for t in items:p('- '+t)
def page():story.append(PageBreak())
p('BEHANCE / REUSABLE PROMPT','small')
p('UI/UX case study\n11-section template'.replace('\n',' '),'title')
p('A reusable creative brief for a clear, visually compelling product design story.')
h('How to use')
p('Copy the prompt content from the following pages into your design assistant. Replace the bracketed details, attach your product screenshots, brand assets and research, and develop the case study one section at a time.')
h('Begin prompt')
p('Act as a senior product designer and editorial designer. Create a polished, Behance-ready UI/UX case study for my project, organized into 11 connected sections.')
h('Project brief')
bullets(['Project name: [Name]','Product: [What the product does]','Industry: [Industry]','Target users: [Primary and secondary users]','Main problem: [Problem users face]','Business goal: [What the business wants to achieve]','Platform: [Web / mobile / desktop]','My role: [Your responsibilities]','Team: [Who you worked with]','Duration and year: [Timeline / year]','Main features: [Key features]','Brand direction: [Colors, typography, personality]','Available evidence: [Research, feedback, analytics, test results]','Available assets: [Screenshots, wireframes, logo, components]','Reference style: [Attach examples or describe the visual direction]'])
page()
p('Creative direction','title')
h('Objective')
p('Tell a clear story connecting the problem, research, design decisions, final experience, and results. Make the case study visually compelling for Behance and easy for recruiters, clients, and designers to scan.')
p('Create project-specific content and layouts. Avoid generic portfolio language, excessive decoration, and repetitive screenshot grids.')
h('Content accuracy')
bullets(['Use only the facts and assets I provide.','Do not invent interviews, quotes, personas, metrics, usability findings, or business outcomes.','Mark missing information as [To confirm].','Clearly label proposed research, illustrative personas, and expected outcomes.','Distinguish my individual contribution from the team\'s work.'])
h('Design direction')
bullets(['Use a consistent grid, generous whitespace, strong hierarchy, and readable typography.','Choose a visual identity appropriate to the product and its audience.','Alternate concise editorial sections with detailed product visuals.','Give each section a distinct composition while maintaining a coherent design system.','Use accessible contrast and text sizes that remain readable when the case study is scaled down.','Preserve the proportions and content of supplied product screenshots.','Use mockups selectively; show important workflows in clear, flat screenshots.','Write informative headlines and short captions that explain decisions.','Keep essential text editable and make assets suitable for high-resolution export.'])
page()
p('The story / 01-04','title')
sections=[('01 - Project overview','Introduce the product and its value in one clear headline. Include a concise project summary, target audience, role, team, duration, platform, and year. Use a strong product preview as the opening visual.'),('02 - Design process','Show the actual process used: discovery, definition, exploration, design, validation, and iteration. Explain the purpose and outputs of each relevant stage. Avoid presenting the process as perfectly linear if it was iterative.'),('03 - Product showcase','Create an engaging introduction to the final product. Highlight its main value proposition and 2-3 core capabilities. Use a hero composition with selected interface screens and concise annotations.'),('04 - Problem & goals','Explain the existing situation, user frustrations, business challenges, and constraints. Separate user needs from business objectives. Connect each goal to a success measure where evidence is available.')]
for a,b in sections:h(a);p(b)
page()
p('The reasoning / 05-08','title')
sections=[('05 - Research & discovery','Present the available research methods, participants or sources, and key findings. Show how findings influenced product priorities and design decisions. Include competitor analysis only when supported by actual research. Keep assumptions clearly separated from validated findings.'),('06 - Target users & key workflows','Describe the primary user groups, their responsibilities, needs, and context. Use evidence-based personas or concise user profiles. Show the key journey, friction points, and opportunities. Focus on behaviors and tasks rather than decorative demographic details.'),('07 - Information architecture & user flows','Explain how the product is organized and why. Show a readable sitemap or navigation structure. Illustrate 1-2 important task flows, including relevant decisions, errors, or recovery paths. Connect the structure to users\' priorities.'),('08 - Wireframes & design exploration','Show how early concepts developed into the selected direction. Include meaningful wireframes, alternatives, and iterations when available. Explain the reasoning behind major layout and interaction decisions. Use before-and-after comparisons only when real versions exist.')]
for a,b in sections:h(a);p(b)
page()
p('The experience / 09-11','title')
h('09 - Design system')
p('Present the visual and interaction foundations: colors, typography, spacing, grid, iconography, and reusable components. Include important component states, such as hover, focus, disabled, error, and success. Explain how the system supports consistency, accessibility, and implementation.')
h('10 - Final UI & experience')
p('Organize final screens around user tasks rather than a random gallery. For each major workflow, explain:')
bullets(['What the user needs to accomplish','How the interface supports the task','Which design decision improves clarity or efficiency'])
p('Show relevant responsive layouts, empty states, loading states, feedback, and error handling when available. Use close-ups and annotations where they clarify important details.')
h('11 - Validation, outcomes & reflection')
p('Present actual usability findings and measured results when available. Explain what changed after feedback. If the product has not launched, state that clearly and present a validation plan or expected outcomes instead. Close with lessons learned, remaining limitations, next steps, and a concise project sign-off.')
page()
p('Working instructions','title')
h('Work section by section')
p('First, review my brief and assets. Ask one concise set of questions about essential missing information.')
p('Then propose:')
bullets(['1. The overall narrative and visual direction','2. A content outline for all 11 sections','3. A consistent layout and typography system'])
p('After that, develop one section at a time. For each section, provide:')
bullets(['Its communication goal','A strong headline and finished body copy','Recommended layout and visual hierarchy','Required screenshots, diagrams, or assets','Captions and annotations','Any missing facts marked [To confirm]'])
p('Check each section for clarity, factual accuracy, readability, and consistency before proceeding. Ensure the final case study reads as one connected story with a clear explanation of my design contribution.')
h('End prompt')
p('Reuse this template for each new project by updating the brief and supplying the relevant evidence and assets.','small')
def footer(c,d):
 w,ht=A4;c.setStrokeColor(HexColor('#dce3ee'));c.line(48,43,w-48,43);c.setFont('Helvetica',8);c.setFillColor(HexColor('#667085'));c.drawString(48,29,'BEHANCE CASE STUDY / REUSABLE PROMPT');c.drawRightString(w-48,29,str(d.page))
SimpleDocTemplate(out,pagesize=A4,rightMargin=48,leftMargin=48,topMargin=46,bottomMargin=58,title='Behance UI/UX Case Study - Reusable 11-Section Prompt',author='').build(story,onFirstPage=footer,onLaterPages=footer)
print(out)
