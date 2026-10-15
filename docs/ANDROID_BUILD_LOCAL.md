# Local Android Build Guide — Ernesto's Machine

This guide is for the `openGym` repository on Ernesto's Mac.

## Paths

- Repository: `/Users/ernesto/dev/openGym`
- Frontend: `/Users/ernesto/dev/openGym/frontend`
- Android project: `/Users/ernesto/dev/openGym/frontend/android`
- APK output (debug): `/Users/ernesto/dev/openGym/frontend/android/app/build/outputs/apk/debug/app-debug.apk`
- Node: `/Users/ernesto/.local/bin/node` (v26)
- Java 21: `/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`
- Android Studio: `/Applications/Android Studio.app`
- Android SDK: `$HOME/Library/Android/sdk`
- Emulator AVD name already created: `opengym`

## Shell setup

Add these to `~/.zshrc` if not already there:

```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/emulator:$PATH"
```

Then reload:

```bash
source ~/.zshrc
```

Verify:

```bash
java -version
adb version
```

Expected Java version: OpenJDK 21.x.

## Important note about Java

Android Studio's bundled JDK on this machine is Java 25 and does not satisfy this project's Gradle requirement. Always use the Homebrew OpenJDK 21 path above.

## Complete Android build from scratch

Run from the repository root:

```bash
cd /Users/ernesto/dev/openGym
cd frontend

npm install
VITE_MOBILE=1 npm run build
node ../scripts/catalogue/stage-media.mjs dist
npx cap sync android
node scripts/check-mobile-bundle.mjs
```

Then build the Android APK:

```bash
cd /Users/ernesto/dev/openGym/frontend/android
./gradlew assembleDebug
```

The debug APK is created here:

```text
/Users/ernesto/dev/openGym/frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

Notes:
- The development build uses the Android application ID suffix `.test`, so it installs side-by-side with the release app.
- The build includes 6,554 exercise stills and 6,554 animations, which is why the APK is about 227 MB.
- After `build:mobile`, `frontend/dist` is the mobile bundle. Run plain `npm run build` again before deploying to a server.

## Android-only sync

To avoid the iOS `pod install` failure when Xcode is not available, use:

```bash
VITE_MOBILE=1 npm run build
node ../scripts/catalogue/stage-media.mjs dist
npx cap sync android
node scripts/check-mobile-bundle.mjs
```

Do not rely on `npm run build:mobile` on this machine unless Xcode is installed.

## Emulator setup

An AVD was already created:

```text
Name: opengym
Device: Pixel 9
Target: Google APIs Android 15 arm64-v8a
```

Start it:

```bash
"$ANDROID_HOME/emulator/emulator" -avd opengym
```

Create it again if needed:

```bash
echo "no" | avdmanager create avd \
  -n opengym \
  -k "system-images;android-35;google_apis;arm64-v8a" \
  -d "pixel_9"
```

Wait for boot:

```bash
adb wait-for-device
while [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" != "1" ]; do
  sleep 2
done
```

Install the debug APK:

```bash
adb install -r /Users/ernesto/dev/openGym/frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

Launch the app:

```bash
adb shell monkey -p ch.duartesantos.opengym.test -c android.intent.category.LAUNCHER 1
```

Close the emulator:

```bash
adb -s emulator-5554 emu kill
```

## Debug vs release

Debug build:

```bash
./gradlew assembleDebug
```

Release build and signing (keep the keystore permanently):

```bash
keytool -genkeypair -keystore my.keystore -alias opengym -keyalg RSA -validity 10950
./gradlew assembleRelease
zipalign -f -p 4 app/build/outputs/apk/release/app-release-unsigned.apk aligned.apk
apksigner sign --ks my.keystore --ks-key-alias opengym --out openGym.apk aligned.apk
```

## Standard rebuild loop

```bash
cd /Users/ernesto/dev/openGym/frontend
VITE_MOBILE=1 npm run build
node ../scripts/catalogue/stage-media.mjs dist
npx cap sync android
node scripts/check-mobile-bundle.mjs
cd android && ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Quick checks

Run frontend tests:

```bash
cd /Users/ernesto/dev/openGym/frontend
npm test
```

Run API tests:

```bash
cd /Users/ernesto/dev/openGym/api
npm test
```

## Android Studio alternative

Open the native project in Android Studio:

```bash
cd /Users/ernesto/dev/openGym/frontend
npx cap open android
```

Or open this folder directly:

```text
/Users/ernesto/dev/openGym/frontend/android
```

In Android Studio, set Gradle JDK to:

```text
/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
```

Then use Build → Build Bundle(s) / APK(s) → Build APK(s).