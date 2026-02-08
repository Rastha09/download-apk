import JSZip from "jszip";

const ICON_SEARCH_PATTERNS = [
  // Prefer mipmap (higher quality), sorted by resolution (highest first)
  /^res\/mipmap-xxxhdpi[^/]*\/ic_launcher(?:_round)?\.png$/i,
  /^res\/mipmap-xxhdpi[^/]*\/ic_launcher(?:_round)?\.png$/i,
  /^res\/mipmap-xhdpi[^/]*\/ic_launcher(?:_round)?\.png$/i,
  /^res\/mipmap-hdpi[^/]*\/ic_launcher(?:_round)?\.png$/i,
  /^res\/mipmap-mdpi[^/]*\/ic_launcher(?:_round)?\.png$/i,
  // Fallback to drawable
  /^res\/drawable-xxxhdpi[^/]*\/ic_launcher(?:_round)?\.png$/i,
  /^res\/drawable-xxhdpi[^/]*\/ic_launcher(?:_round)?\.png$/i,
  /^res\/drawable-xhdpi[^/]*\/ic_launcher(?:_round)?\.png$/i,
  /^res\/drawable-hdpi[^/]*\/ic_launcher(?:_round)?\.png$/i,
  // Generic app_icon patterns
  /^res\/mipmap-xxxhdpi[^/]*\/app_icon\.png$/i,
  /^res\/mipmap-xxhdpi[^/]*\/app_icon\.png$/i,
  // Fallback: any PNG in mipmap with "launcher" or "icon" in name
  /^res\/mipmap-xxxhdpi[^/]*\/.*(?:launcher|icon).*\.png$/i,
  /^res\/mipmap-xxhdpi[^/]*\/.*(?:launcher|icon).*\.png$/i,
  /^res\/mipmap-xhdpi[^/]*\/.*(?:launcher|icon).*\.png$/i,
];

/**
 * Extract the app icon from an APK or APKS file.
 * Returns a Blob of the icon image, or null if not found.
 */
export async function extractApkIcon(file: File): Promise<Blob | null> {
  try {
    const zip = await JSZip.loadAsync(file);

    // For .apks files, look for base.apk inside
    if (file.name.toLowerCase().endsWith(".apks")) {
      return await extractIconFromApksBundle(zip);
    }

    // For regular .apk files
    return await findIconInZip(zip);
  } catch (error) {
    console.warn("Could not extract icon from APK:", error);
    return null;
  }
}

async function extractIconFromApksBundle(zip: JSZip): Promise<Blob | null> {
  // Look for base.apk or similar in the bundle
  const baseApkNames = ["base.apk", "base-master.apk"];

  for (const name of baseApkNames) {
    const baseApkFile = zip.file(name);
    if (baseApkFile) {
      const baseApkData = await baseApkFile.async("arraybuffer");
      const baseApkZip = await JSZip.loadAsync(baseApkData);
      return await findIconInZip(baseApkZip);
    }
  }

  // Fallback: look for any .apk file in the bundle
  const apkFiles = zip.file(/\.apk$/i);
  for (const apkFile of apkFiles) {
    try {
      const apkData = await apkFile.async("arraybuffer");
      const apkZip = await JSZip.loadAsync(apkData);
      const icon = await findIconInZip(apkZip);
      if (icon) return icon;
    } catch {
      continue;
    }
  }

  return null;
}

async function findIconInZip(zip: JSZip): Promise<Blob | null> {
  const fileNames = Object.keys(zip.files);

  // Try each pattern in priority order
  for (const pattern of ICON_SEARCH_PATTERNS) {
    for (const fileName of fileNames) {
      if (pattern.test(fileName)) {
        const file = zip.file(fileName);
        if (file) {
          const data = await file.async("blob");
          // Verify it's actually an image (check size > 0)
          if (data.size > 0) {
            return new Blob([data], { type: "image/png" });
          }
        }
      }
    }
  }

  return null;
}
