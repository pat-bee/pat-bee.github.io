# Quiet Cycle — corrected GitHub edition (version 4)

## Confirmed deployment problem and repair

On inspection, https://pat-bee.github.io/quietcycle/ referenced `app.js`, but https://pat-bee.github.io/quietcycle/app.js returned GitHub Pages “404 — File not found.” The HTML displayed normally, but no timer handlers were loaded, leaving every button inactive.

**Recommended repair:** replace the existing `index.html` in the folder or repository that publishes `/quietcycle/` with this package's `index.html`. Commit it to the publishing branch, wait for GitHub Pages to deploy, then reload the page in Safari. Look for **GitHub edition · version 4 · self-contained** near the bottom. You should see “Ready when you are.” and an enabled Start button. This new HTML includes all timer code and styles; `app.js` is no longer required. Keep the existing GitHub Pages configuration.

**Minimal alternative:** keep your current HTML and upload this package's `app.js` beside it, with that exact lowercase filename. This is the unchanged original JavaScript for repairing the missing resource. Do not upload just the zip; extract the files first.

The two repairs are alternatives. The self-contained HTML is preferred because a missing JavaScript file cannot silently disable it. It also reports initialization errors and keeps the optional haptic test from being required for the main controls to initialize.

The replacement was tested with actual browser clicks for Start, Pause/Resume, Restart, and sound preview. Included automated checks cover the complete timeline, longer decays, closing tone, interrupted audio, and hiding the page. Physical iPhone audio and Shortcuts vibration still require on-device testing. This package does not change the live GitHub repository by itself.

## Included behavior

- A five-minute session with 25 repeating 12-second cycles.
- First cue at 4 seconds: a warm 432 Hz chime (about 1.65 seconds).
- Second cue 2 seconds later: a brighter 432 Hz chime (about 1.3 seconds).
- Third cue 6 seconds later: a rounder 432 Hz chime (about 1.9 seconds).
- At exactly five minutes, one pure 432 Hz closing tone replaces the final short cue and slowly fades over 10 seconds. Total playback is 5:10.
- Start, Pause/Resume, Restart, volume, and sound preview. Pausing during the closing tone preserves its position.
- The page pauses when hidden or interrupted. Keep it open and your screen awake; it requests a screen wake lock where available.
- A brief first-cue vibration on browsers that implement `navigator.vibrate`. iPhone Safari does not implement it.
- An experimental **one-shot** iPhone Shortcuts haptic test, explained below. This does not make the five-minute session vibrate automatically.

All cycle tones have a 432 Hz fundamental, with different harmonics and decays. The closing tone is a pure sine tone with a gentle attack and slow fade. Audio is synthesized locally; there are no audio downloads, third-party scripts, accounts, or analytics.

## Publish on GitHub Pages

1. Create a GitHub repository, for example `quiet-cycle`. A public repository works with GitHub Free.
2. Unzip this package. Upload `index.html` to the publishing folder; it contains all required code. The other files are documentation, the optional shortcut source, and local verification. `.nojekyll` is optional for this plain HTML app.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**, then choose **main** and **/(root)**. Save.
5. Wait for publication, then use the **Visit site** link in Pages settings. For an ordinary project repository, the address is `https://YOUR-USERNAME.github.io/quiet-cycle/`.
6. Open that address directly in iPhone Safari. Tap **Test chimes** and adjust your media volume. Optionally choose **Share → Add to Home Screen** for the regular timer. Run the haptic experiment from Safari itself.

No build command, npm install, GitHub Actions configuration, or server is required. To update it, replace `index.html`, commit, wait for Pages to finish, and refresh Safari. No service worker caches old files.

Already using a GitHub Pages repository? Place `index.html` in a `quietcycle` subdirectory, then open `/quietcycle/` on that existing site. For your existing deployment, keep using the current folder.

Official guide: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## Experimental haptic shortcut test

This uses an Apple Shortcuts action to call a button in Safari, then invokes **Vibrate Device** natively. JavaScript is **not** directly controlling the iPhone's haptic motor. It may produce a perceptible delay, and Shortcuts chooses the vibration duration. It has not been verified on a physical iPhone.

The earlier simple proposal to click the button and immediately return would only confirm the click. This version waits briefly for the page to report that the audio source actually started. Even that cannot prove audible output or vibration.

### Build the shortcut once

1. In **Shortcuts**, create **Quiet Cycle Haptic Test**.
2. Open its details, enable **Show in Share Sheet**, and set the accepted input to **Safari Web Pages**.
3. Add **Run JavaScript on Web Page**. Its webpage input must be **Shortcut Input** (the Safari webpage), not the URL text. Replace the example script with the entire contents of `haptic-shortcut-test.js`. The same code is available under the page's **Set up the iPhone shortcut** section with a Copy button.
4. Add an **If** action: **JavaScript Result** **is** `PLAYING`.
5. Inside that branch, add **Vibrate Device**.
6. Inside **Otherwise**, add **Show Alert**, displaying **JavaScript Result**. Keep **End If** at the end.
7. If iOS requests it, enable **Allow Running Scripts** in the Shortcuts Advanced settings. Allow this shortcut to run JavaScript on your Quiet Cycle page when prompted.

`haptic-shortcut-test.js` is code to paste into an action. It is not an installable `.shortcut` file or an iCloud shortcut link.

### Run the test

1. Open the published page directly in Safari.
2. Leave the timer stopped or paused. Tap **Haptic shortcut test** directly once and wait for the chime to finish. This primes audio from an actual touch.
3. Choose Safari **Share → Quiet Cycle Haptic Test**.
4. Expected result: one warm chime followed closely by a native vibration. Ordinary **Test chimes** still previews all three longer chimes and the closing tone.
5. Record what happened: both sound and vibration, sound only, vibration only, or an alert. Also note any delay.

Tapping the test button on the webpage by itself plays sound only. The shortcut must be run from Safari's Share menu to request native vibration. You do not need to keep it running with the regular timer.

### Limits and troubleshooting

- This is a proof of concept, **not an automatically synchronized vibration loop**, and not a guarantee of simultaneous playback. The full-session bridge still needs on-device validation.
- If the alert says to open Quiet Cycle, the shortcut did not receive the correct Safari webpage or you opened the earlier hosted edition without this test button.
- If audio does not start promptly, directly tap the test button once in Safari, wait for it to finish, and retry from Share. Safari's shortcut JavaScript action has a short execution limit; this test polls for at most 850 ms instead of waiting for an entire chime.
- If Safari suspends or cancels audio while the share sheet is open, this bridge may not work on that iOS version. The regular timer pauses when the document becomes hidden.
- Check media volume, Bluetooth output, Silent Mode, and system vibration settings if sound or vibration is missing. A PLAYING result only confirms that the Web Audio source started.
- Restart cancels any active sound preview and starts the whole session again.

Apple's JavaScript action guide: https://support.apple.com/en-au/guide/shortcuts/apdb71a01d93/ios
Apple's execution-limit explanation: https://support.apple.com/en-sg/guide/shortcuts/apd218e2187d/ios
Apple's Repeat/Vibrate example: https://support.apple.com/en-mk/guide/shortcuts/apdc11deb2c1/ios

## Files and local verification

- `index.html` — self-contained page, styles, timer, audio synthesis, and on-page shortcut setup. This is the only required deployment file.
- `app.js` — unchanged legacy JavaScript, included only as the minimal missing-file repair for the old HTML. The version 4 HTML does not load it.
- `haptic-shortcut-test.js` — paste into the shortcut's JavaScript action; do not add it as a script tag to the page.
- `.nojekyll` — allows GitHub Pages to serve the files without Jekyll processing.
- `verify.cjs` — dependency-free checks. With Node.js installed, run `node verify.cjs`.

The included checks exercise timer cues, pause/resume, the closing fade, and the shortcut acknowledgement. They do not simulate iPhone hardware or establish that haptics work in Safari.
