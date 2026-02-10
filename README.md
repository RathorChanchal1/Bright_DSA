# DSA Tracker

A simple UI to track your Data Structures & Algorithms practice: mark questions solved, filter by topic, and maintain a daily streak.

## Features

- **419 questions** with topic and sub-topic
- **Mark solved/unsolved** — stored in your browser (localStorage)
- **Streak** — consecutive days you open the app (visit streak)
- **Filters** — by topic, sub-topic, and status (all / solved / unsolved)
- **Search** — by question name or topic
- **Links** — open problem (LeetCode / GeeksForGeeks) in a new tab

## Run locally

1. Serve the folder with any static server (GitHub Pages doesn’t allow `file://` for JSON).

   **Option A – Python**
   ```bash
   cd DSA_sai
   python3 -m http.server 8000
   ```
   Open: http://localhost:8000

   **Option B – Node**
   ```bash
   npx serve .
   ```

2. Or open `index.html` after placing the repo in a local server.

## Host on GitHub Pages

1. Push this repo to GitHub.
2. **Settings → Pages**
3. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main** (or your default), folder: **/ (root)**
4. Save. The site will be at `https://<username>.github.io/<repo-name>/`.

Your progress (solved questions and streak) is stored in the browser on that device. To sync across devices you’d need a backend or a different storage (e.g. export/import).

## Regenerating `data/questions.json`

If you change `DSA_Questions_Topics.csv`, regenerate the JSON:

```bash
node -e "
const fs = require('fs');
const raw = fs.readFileSync('DSA_Questions_Topics.csv', 'utf8');
const lines = raw.split(/\r?\n/).filter(l => l.trim());
const out = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  const parts = [];
  let cur = '', inQ = false;
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    if (c === '\"') { inQ = !inQ; continue; }
    if (!inQ && c === ',') { parts.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  parts.push(cur.trim());
  const [topic, subTopic, sNo, questionName, questionLink, javaSolution] = parts;
  out.push({ id: i - 1, topic: topic || '', subTopic: subTopic || '', sNo: sNo || '', questionName: questionName || '', questionLink: questionLink || '', javaSolution: javaSolution || '' });
}
fs.writeFileSync('data/questions.json', JSON.stringify(out));
console.log('Written', out.length, 'questions');
"
```

## Structure

```
DSA_sai/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── data/
│   └── questions.json
├── DSA_Questions_Topics.csv
└── README.md
```
