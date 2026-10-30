// Paste into Shortcuts → Run JavaScript on Web Page.
// Set that action's input to Shortcut Input (a Safari Web Page).
// Next: If JavaScript Result is PLAYING → Vibrate Device.
// Otherwise: Show Alert with JavaScript Result.
// This is a one-shot experiment, not an automatic five-minute haptic loop.
(function () {
  const button = document.getElementById('haptic-test');
  if (!button) {
    completion('Open the GitHub version of Quiet Cycle in Safari first.');
    return;
  }
  if (button.disabled) {
    completion('Pause Quiet Cycle and wait for any test sound to finish.');
    return;
  }
  button.click();
  const deadline = Date.now() + 850;
  function check() {
    const state = button.dataset.audioState;
    if (state === 'playing') {
      completion('PLAYING');
    } else if (state === 'failed') {
      completion('Sound could not start. Tap Haptic shortcut test in Safari once, then retry from Share.');
    } else if (Date.now() >= deadline) {
      completion('Audio did not confirm promptly. Tap Haptic shortcut test in Safari once, then retry from Share.');
    } else {
      setTimeout(check, 25);
    }
  }
  check();
}());
