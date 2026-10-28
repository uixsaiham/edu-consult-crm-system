from pathlib import Path
import re,html
Path('tmp/pdf-review').mkdir(parents=True, exist_ok=True)
s=Path('docs/crm-case-study.md').read_text()
def inline(t):
 t=html.escape(t)
 t=re.sub(r'\*\*(.*?)\*\*',r'<strong>\1</strong>',t)
 return re.sub(r'(?<!\*)\*([^*]+)\*',r'<em>\1</em>',t)
def render(t):
 lines=t.strip().splitlines(); out=[]; i=0
 while i<len(lines):
  l=lines[i]
  if not l.strip(): i+=1;continue
  if l.startswith('```'):
   block=[];i+=1
   while i<len(lines) and not lines[i].startswith('```'):block.append(lines[i]);i+=1
   out.append('<pre>'+html.escape('\n'.join(block))+'</pre>');i+=1;continue
  if l.startswith('|'):
   rows=[]
   while i<len(lines) and lines[i].startswith('|'):
    row=[c.strip() for c in lines[i].strip('|').split('|')]
    if not all(re.fullmatch(r'[-: ]+',c) for c in row):rows.append(row)
    i+=1
   out.append('<table><thead><tr>'+''.join('<th>'+inline(c)+'</th>' for c in rows[0])+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+inline(c)+'</td>' for c in row)+'</tr>' for row in rows[1:])+'</tbody></table>');continue
  if re.match(r'^\d+\. ',l):
   out.append('<p class="step">'+inline(l)+'</p>');i+=1;continue
  para=[l];i+=1
  while i<len(lines) and lines[i].strip() and not lines[i].startswith(('|','```')):
   para.append(lines[i]);i+=1
  out.append('<p>'+inline(' '.join(para))+'</p>')
 return ''.join(out)
parts=re.split(r'^## (.+)$',s,flags=re.M)
intro=parts[0].split('\n',1)[1]
cover='<section class="cover"><div class="eyebrow">PRODUCT DESIGN CASE STUDY / 2026</div><h1>BHE CRM</h1><h2>From Enquiry<br>to Enrolment</h2><div class="rule"></div>'+render(intro)+'<div class="contents">'+''.join('<div>'+inline(parts[i])+'</div>' for i in range(1,len(parts),2))+'</div></section>'
pages=[]
for n,i in enumerate(range(1,len(parts),2),1):
 pages.append('<section><div class="eyebrow">BHE CRM / UI &amp; UX CASE STUDY</div><h2>'+inline(parts[i])+'</h2>'+render(parts[i+1])+'<footer>DESIGN DOCUMENTATION <span>'+str(n).zfill(2)+'</span></footer></section>')
css='''@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;color:#182940;font-family:Arial,sans-serif;font-size:10pt;line-height:1.52}section{position:relative;padding:20mm 17mm 19mm;min-height:297mm;page-break-after:always}section:last-child{page-break-after:auto}.eyebrow{font-size:8pt;letter-spacing:1.7px;color:#4d76bb;font-weight:700;margin-bottom:8mm}h1{font-size:52pt;letter-spacing:-2px;margin:14mm 0 0;line-height:1.1}h2{font-size:25pt;line-height:1.18;letter-spacing:-.6px;margin:0 0 9mm;max-width:170mm}.cover h2{font-size:34pt;margin:4mm 0 8mm;color:#4d76bb}.cover{background:#f4f7fb}.cover p{font-size:9pt}.rule{width:25mm;height:3px;background:#4d76bb;margin-bottom:8mm}p{margin:0 0 4mm}table{border-collapse:collapse;width:100%;font-size:8.5pt;line-height:1.4;margin:5mm 0;table-layout:fixed}th{background:#e9eff8;color:#264d83;text-align:left}th,td{padding:3mm 2.6mm;border-bottom:1px solid #dce4ef;vertical-align:top;overflow-wrap:anywhere}tr{break-inside:avoid}tr:nth-child(even){background:#f7f9fc}strong{font-weight:700}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-family:Menlo,monospace;font-size:6.6pt;line-height:1.75;padding:4mm;background:#f2f5fa;border-left:3px solid #4d76bb;margin:5mm 0}.contents{margin-top:9mm;display:grid;grid-template-columns:1fr 1fr;gap:3mm;font-size:9pt;color:#38567d}.step{background:#f4f7fb;padding:3mm 4mm;margin-bottom:3mm}footer{position:absolute;bottom:10mm;left:17mm;right:17mm;border-top:1px solid #dce4ef;padding-top:3mm;font-size:7pt;letter-spacing:1px;color:#718097}footer span{float:right}'''
Path('tmp/pdf-review/crm-case-study.html').write_text('<!doctype html><html><head><meta charset="utf-8"><title>BHE CRM — UI/UX Case Study</title><style>'+css+'</style></head><body>'+cover+''.join(pages)+'</body></html>')
