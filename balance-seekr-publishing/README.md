# Balance Seekr Publishing Assets

This folder contains all assets needed for Solana Mobile dApp Store submission.

## Folder Structure

```
balance-seekr-publishing/
├── README.md (this file)
├── app-icon-512.png (App icon - 512x512)
├── banner-1200x600.png (Banner graphic - 1200x600)
├── screenshots/ (Screenshots of your app)
│   ├── screenshot-1-home.jpg
│   ├── screenshot-2-home.jpg
│   ├── screenshot-3-Habits.jpg
│   ├── screenshot-4-Breathwork.jpg
│   ├── screenshot-5-Journal.jpg
│   ├── screenshot-6-Tasks.jpg
│   ├── screenshot-7-masterminds.jpg
│   └── screenshot-8-Masterminds.jpg
├── apk/ (APK builds go here)
│   └── balance-seekr-release.apk (Build this and place here)
└── config.yaml (Create this for Solana dApp Store submission)
```

## Next Steps

1. **Build APK:**
   ```bash
   eas build --platform android --profile production
   ```
   Then download and place in `apk/` folder

2. **Create config.yaml:**
   - See `docs/SOLANA_MOBILE_DAPP_STORE_SUBMISSION.md` for template
   - Fill in your app details

3. **Ready for Submission:**
   - Follow the submission guide in `docs/SOLANA_MOBILE_DAPP_STORE_SUBMISSION.md`

## For Testing Distribution

See `docs/APK_BUILD_AND_DISTRIBUTION.md` for how to:
- Build the APK
- Upload for testers
- Distribute to beta testers

