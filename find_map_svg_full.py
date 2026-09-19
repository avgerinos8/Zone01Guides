import json

transcript_path = '/home/blasphemy/.gemini/antigravity/brain/a0a7282e-1a05-40d1-98bd-de7b3b66746c/.system_generated/logs/transcript_full.jsonl'
with open(transcript_path, 'r') as f:
    lines = f.readlines()
    
# Iterate backwards to find the last time I successfully wrote or viewed the Map SVG
for line in reversed(lines):
    data = json.loads(line)
    if 'tool_calls' in data:
        for tc in data['tool_calls']:
            if tc['name'] == 'run_command':
                cmd = tc['args'].get('CommandLine', '')
                if 'map[rune]int' in cmd and '[]int' in cmd and '<svg' in cmd:
                    print("FOUND MAP SVG IN SCRIPT!")
                    print(cmd[:1000])
                    break
