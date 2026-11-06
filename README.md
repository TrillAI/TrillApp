# Trill Transcribe

A free, ad-free transcription prototype with a responsive website and a Capacitor Android project. **This is not production-ready and no APK is included.** The Android wrapper, model download, microphone, playback, export and recognition need testing on actual target devices before distribution.

## Run the website

Install Node.js 20.19 or later (or a recent Node.js 22), then:

```sh
npm ci --ignore-scripts
npm run dev
# open the address printed by Vite
```

`npm run build` builds the static site in `dist`; serve it over HTTPS (or localhost) for browser microphone access. `npm test` runs the utility and simulated UI tests. Installing with `--ignore-scripts` avoids an unnecessary native ONNX runtime download; this project uses its browser WebAssembly runtime.

## Branding video

Place an MP4 at **`public/branding.mp4`** before building. The welcome screen attempts to play it muted; it continues on video end, after five seconds, or when the user taps Continue. If it is missing, the text logo appears briefly instead. The native Android launch screen may appear before the web video while the WebView starts. Do not put a copyrighted video here without permission.

## How it works

- Pick one of four modes, read its description, accept the terms, then start. These modes organize sessions; they do **not** use specialized radio or call models.
- Select a local audio/video file or enter a direct media URL. The player uses browser codecs and HLS.js for HLS where supported. File transcription decodes audio in the browser and uses the multilingual `onnx-community/whisper-tiny` model via Transformers.js. The model is downloaded from Hugging Face on first use, needs network access and may be large; availability, caching, performance and supported codecs depend on the device. For full-file transcription, links must be directly downloadable and permit CORS; HLS is not supported by the full-file button. Large media can exhaust memory. Experimental playing-stream transcription is described below.
- Live microphone transcription uses the browser's Web Speech API, which may transmit audio to the browser vendor and is unavailable in many browsers and Android WebViews. Phone calls cannot generally be captured directly; speakerphone plus microphone may work where supported, with all legally required consent.
- Correct words directly in the transcript. Corrections are saved, but do not train the model. The optional seven-pass setting votes for the most common complete transcript; identical deterministic passes often repeat mistakes. Neither voting nor this model guarantees accuracy, especially on noisy radio, numbers, names and jargon. Never rely on it for emergency or safety-critical decisions.
- IndexedDB stores sessions on the current device. Edits are saved after a short delay and every ten minutes; Sync saves immediately **locally**, not to other devices. Export makes a text file. Clearing site/app data may delete transcripts; maintain exported backups.
- There is no public sharing, QR code, translation, learned corrections, user accounts, cloud synchronization, direct call audio capture, or simultaneous playback transcription. Private-by-default here means no app-operated public feed, not a guarantee about external media hosts or speech providers.

## Experimental live stream transcription

Select a direct URL (including a compatible HLS playlist), choose **Load link**, then choose **Transcribe playing stream**. The app plays that source and sends approximately 12-second chunks of its audio to Whisper; this is processing granularity, not a limit on the stream's duration. No total stream duration is displayed. Completed text is saved to local IndexedDB. You can navigate within the website and use **Active session** to return. On finite media, the final partial chunk is processed when playback ends.

This is experimental: the source must be playable and permit cross-origin audio access, the browser must support Web Audio, and the device must be fast enough. The first model download can take a long time. If the model falls behind, the app stops and displays an error rather than silently discarding the backlog. Manual Stop immediately discards buffered and in-flight audio; only completed text is saved. Browser tabs can be throttled or suspended in the background, and closing the tab or app stops processing. This does not capture audio from other apps or DRM-protected sources. Android background/closed-app processing needs a native foreground service, ongoing notification, persistent job management, and on-device validation; that service is **not implemented**. No transcription system can guarantee perfect recognition or support every stream.

## Android SDK setup

1. In Android Studio open **Settings/Preferences → Languages & Frameworks → Android SDK** (or **More Actions → SDK Manager** on the welcome screen). Copy the **Android SDK Location**. Under SDK Platforms install **Android 15 / API 35**; under SDK Tools install **Android SDK Platform-Tools** and **Android SDK Build-Tools**. Apply the changes.
2. Set the SDK location using Android Studio's project settings, or create `android/local.properties` in this repository with one line. Replace the example with your actual SDK folder (not the Android Studio folder):

   ```properties
   # Windows example (forward slashes avoid escaping backslashes):
   sdk.dir=C:/Users/YOUR_NAME/AppData/Local/Android/Sdk
   # macOS example: sdk.dir=/Users/YOUR_NAME/Library/Android/sdk
   # Linux example: sdk.dir=/home/YOUR_NAME/Android/Sdk
   ```

   Use only the line appropriate for your computer. `local.properties` is machine-specific and ignored by Git. Alternatively set `ANDROID_HOME` to the SDK directory in your environment.
3. In Android Studio set **Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK** to JDK 21 (the bundled Android Studio JDK may be selected if it is version 21). For terminal builds set `JAVA_HOME` to a JDK 21 installation and check `java -version`.
4. From the repository root run `npm ci --ignore-scripts` and `npm run android:sync`. Open the `android` folder in Android Studio and let Gradle sync, then choose **Build → Build APK(s)**. Or use the commands below. Gradle requires internet access to download its distribution and Android dependencies; accept any SDK licenses requested by Android Studio.
5. If the build still fails, use **Build Output** in Android Studio or run `./gradlew assembleDebug --stacktrace` (Windows: `gradlew.bat assembleDebug --stacktrace`) from the `android` folder and share the first error and its surrounding lines. Don't share signing passwords or private keys.

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

The optional donation screen is in `src/main.js` (`donate()`); add your own legitimate link there. The save indicator is ↻. No fake cross-device sync is enabled. Permissions are deliberately minimal; no call-log or phone-call recording permissions are requested. Automated coverage includes utility and simulated UI tests, but not real-browser, accessibility, Android or speech-accuracy tests.

## Preparing a Cloudflare Tunnel test

For a test of the built website (rather than the development server):

```sh
npm ci --ignore-scripts
npm run build
npm run preview -- --port 4173 --strictPort
# In a second terminal, with cloudflared installed:
cloudflared tunnel --url http://localhost:4173
```

The Vite preview server is for testing, not a hardened public production server. Quick Tunnel `*.trycloudflare.com` hosts are allowed. For a named tunnel with a custom hostname, specify the **exact hostname** when starting the server, for example `TRILL_ALLOWED_HOSTS=transcribe.example.com npm run preview -- --port 4173 --strictPort`. Multiple hostnames can be comma-separated. Host checking remains enabled; don't use an unrestricted host list. Your tunnel forwards to the local server; the site's browser code doesn't connect to `localhost` to reach a backend. Only share the link with testers you trust, and consider Cloudflare Access or another access control for non-public testing. Tunnel HTTPS is necessary for microphone access. Avoid putting sensitive recordings or credential-bearing URLs into a test session; URLs are saved locally in the browser.

### Test checklist

1. Open the HTTPS link on desktop and on a phone. Check layout, keyboard focus, zoom, the Continue button, and the optional branding video. Browser and app storage are separate for different origins and devices.
2. Choose each mode and confirm its description; check the consent gate, read the terms, and start a session. Decline microphone permission once, then allow it in a compatible browser and stop listening. Check the status message. A browser's speech service may require internet and may transmit audio to its provider.
3. Try a short, consented recording with known words. Select it, play it, transcribe it, compare results to the recording, and edit mistakes. Test a radio sample, overlapping voices, silence, and unfamiliar names/numbers. Record browser/device, sample length and observed errors. The first model download can be slow or fail if Hugging Face is blocked; subsequent use depends on browser cache.
4. Try a direct HTTPS MP3 link whose server permits CORS, an HLS link for playback, and an inaccessible or unsupported link. Verify the error messages; full-file transcription of HLS playlists is unsupported. Try the experimental playing-stream button separately. Stop during download and during recognition, and confirm it doesn't continue in the background.
5. Edit and Sync, visit Library, search, reopen, reload the page, and export. Confirm exported text matches; delete a disposable session and confirm it stays deleted. Test the seven-pass option separately and compare output; it is not evidence of accuracy.
6. Check settings, help, donate and legal pages, narrow and landscape layouts, screen reader labels, reduced-motion preference and browser console/network errors. Repeat on actual Android devices, and test the Android wrapper independently once built. Do not use real private calls or sensitive material without permission.

Automated UI tests use a simulated DOM, fake IndexedDB, and a mocked recognition worker/audio decoder. They test interface and persistence flows, **not** actual speech accuracy, audio decoding, microphone access, HLS playback, real browser rendering or Android behavior. Headless Chromium could not be run in the current sandbox because system NSS libraries are missing. Retest these with a real browser and device.
