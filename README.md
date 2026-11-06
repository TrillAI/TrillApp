# Trill Transcribe

A free, ad-free transcription prototype with a responsive website and a Capacitor Android project. **This is not production-ready and no APK is included.** The Android wrapper, model download, microphone, playback, export and recognition need testing on actual target devices before distribution.

## Run the website

Install Node.js 20 or later, then:

```sh
npm ci --ignore-scripts
npm run dev
# open the address printed by Vite
```

`npm run build` builds the static site in `dist`; serve it over HTTPS (or localhost) for browser microphone access. `npm test` runs the unit tests. Installing with `--ignore-scripts` avoids an unnecessary native ONNX runtime download; this project uses its browser WebAssembly runtime.

## Branding video

Place an MP4 at **`public/branding.mp4`** before building. The welcome screen attempts to play it muted; it continues on video end, after five seconds, or when the user taps Continue. If it is missing, the text logo appears briefly instead. The native Android launch screen may appear before the web video while the WebView starts. Do not put a copyrighted video here without permission.

## How it works

- Pick one of four modes, read its description, accept the terms, then start. These modes organize sessions; they do **not** use specialized radio or call models.
- Select a local audio/video file or enter a direct media URL. The player uses browser codecs and HLS.js for HLS where supported. File transcription decodes audio in the browser and uses the multilingual `onnx-community/whisper-tiny` model via Transformers.js. The model is downloaded from Hugging Face on first use, needs network access and may be large; availability, caching, performance and supported codecs depend on the device. Links must be directly downloadable and permit CORS. HLS and live stream transcription are not supported. Large media can exhaust memory.
- Live microphone transcription uses the browser's Web Speech API, which may transmit audio to the browser vendor and is unavailable in many browsers and Android WebViews. Phone calls cannot generally be captured directly; speakerphone plus microphone may work where supported, with all legally required consent.
- Correct words directly in the transcript. Corrections are saved, but do not train the model. The optional seven-pass setting votes for the most common complete transcript; identical deterministic passes often repeat mistakes. Neither voting nor this model guarantees accuracy, especially on noisy radio, numbers, names and jargon. Never rely on it for emergency or safety-critical decisions.
- IndexedDB stores sessions on the current device. Edits are saved after a short delay and every ten minutes; Sync saves immediately **locally**, not to other devices. Export makes a text file. Clearing site/app data may delete transcripts; maintain exported backups.
- There is no public sharing, QR code, translation, learned corrections, user accounts, cloud synchronization, direct call audio capture, or simultaneous playback transcription. Private-by-default here means no app-operated public feed, not a guarantee about external media hosts or speech providers.

## Android

The `android/` directory is a Capacitor project, not a verified Android release. Install Android Studio, a compatible Android SDK and JDK 21, then run:

```sh
npm ci --ignore-scripts
npm run android:sync
cd android
./gradlew assembleDebug
```

The debug APK is normally at `android/app/build/outputs/apk/debug/app-debug.apk`. Android Studio can generate a release signing key and signed release APK using **Build > Generate Signed Bundle / APK**. Keep the keystore and its passwords private and backed up; losing the key can prevent future updates. No release key is provided or checked into this repository. The wrapper requires real-device testing, including model downloads, file picker, playback, storage, export, navigation-bar insets, and microphone permissions. Android WebView support may differ substantially from Chrome. No claim is made that these features currently work in the wrapper.

## Privacy and legal

Read the in-app terms and privacy information. They are draft text, not legal advice. Have qualified counsel review them, recording consent rules, third-party model/dependency licenses and your distribution practices before release. No content is intentionally uploaded by the app for file transcription; fetching a remote URL contacts its host, model downloads contact Hugging Face, and browser speech recognition may use a remote service. No analytics or advertising are included. Don't put secrets in the app.

## Developer notes

The optional donation screen is in `src/main.js` (`donate()`); add your own legitimate link there. The save indicator is ↻. No fake cross-device sync is enabled. Permissions are deliberately minimal; no call-log or phone-call recording permissions are requested. The project currently has only unit tests for small utility functions, not end-to-end, accessibility, Android or accuracy tests.
