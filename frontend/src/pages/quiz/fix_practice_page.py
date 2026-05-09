import sys

path = r'v:\Business Web Project\Ed-Tech-Learning Platform\frontend\src\pages\quiz\PracticeQuizPage.tsx'

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Look for the duplicated block around 1160-1175
# Specifically 1167-1173 (indices 1166-1172)
# But I should be careful with indices.

start_search = 1160
end_search = 1180

# I'll just look for the specific lines
to_remove = [
    "                   <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600 }}>\n",
    "                     {isLoggedIn ? `${progressPct}% Accuracy` : 'Accuracy Tracking'}\n",
    "                   </Typography>\n",
    "                   <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600 }}>\n",
    "                     {correctCount + incorrectCount} of {totalQ} questions completed\n",
    "                   </Typography>\n",
    "                 </Box>\n"
]

new_lines = []
skip = 0
for i, line in enumerate(lines):
    if skip > 0:
        skip -= 1
        continue
    
    match = True
    if i + len(to_remove) <= len(lines):
        for j in range(len(to_remove)):
            if lines[i+j].strip() != to_remove[j].strip():
                match = False
                break
        if match:
            print(f"Found match at line {i+1}")
            skip = len(to_remove) - 1
            continue
    
    new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
