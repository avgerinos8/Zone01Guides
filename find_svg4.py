import json

transcript_path = '/home/blasphemy/.gemini/antigravity/brain/a0a7282e-1a05-40d1-98bd-de7b3b66746c/.system_generated/logs/transcript.jsonl'
with open(transcript_path, 'r') as f:
    for line in f:
        data = json.loads(line)
        if 'tool_calls' in data:
            for tc in data['tool_calls']:
                if tc['name'] == 'run_command':
                    cmd = tc['args'].get('CommandLine', '')
                    if '<svg viewBox="0 0 800' in cmd and 'replace(' in cmd:
                        print("FOUND SCRIPT:")
                        print(cmd[:300])
                        print("...")
