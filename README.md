# RehabRoute (prototype)

A clickable prototype of a B2B2C gym app that helps injured members keep training while they wait for an NHS appointment.

**Member journey**
1. AI-style injury check (area, pain, cause, duration, aggravating movements)
2. Red-flag safety screen – refers to GP / NHS 111 / 999 if needed
3. Injury report and "what you can still train"
4. Book and pay for a physio video consultation (£49 placeholder, no real payment)
5. In-gym assessment with a PT, physio joining by video
6. Rehab plan delivered by the PT, with exercise tracking and a pain log

Static HTML/CSS/JS – no build step, no backend. Progress is saved in the browser.

> Prototype only. The triage is a simple rule-based stand-in for the AI and is not medical advice.

## Run locally
Open `index.html` in a browser.

## Deploy to Netlify
- **Drag and drop:** go to https://app.netlify.com/drop and drop this folder.
- **From GitHub:** push this folder to a repo, then in Netlify choose *Add new site → Import from Git*, pick the repo, leave the build command empty and set the publish directory to `/`.

## Deploy to GitHub Pages
Push to a repo, then *Settings → Pages → Deploy from branch → main / root*.
